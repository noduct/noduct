/** ZIP sem compressão: evita cópias de PDFs já comprimidos e não exige dependências. */
const encoder = new TextEncoder();
const MAX_ZIP32 = 0xffffffff;

export class ZipLimitError extends Error {}

function crc32Update(current: number, bytes: Uint8Array): number {
  let crc = current;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc;
}

async function crc32(blob: Blob): Promise<number> {
  const reader = blob.stream().getReader();
  let crc = 0xffffffff;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) return (crc ^ 0xffffffff) >>> 0;
      crc = crc32Update(crc, result.value);
    }
  } finally {
    reader.releaseLock();
  }
}

function safeName(name: string, used: Set<string>): string {
  const cleaned = name.replace(/[\\/\u0000-\u001f]/g, '_').trim();
  if (!cleaned) throw new ZipLimitError('ZIP_NAME');
  const dot = cleaned.lastIndexOf('.');
  const stem = dot > 0 ? cleaned.slice(0, dot) : cleaned;
  const extension = dot > 0 ? cleaned.slice(dot) : '';
  let unique = cleaned;
  let suffix = 2;
  while (used.has(unique.toLocaleLowerCase())) {
    unique = `${stem} (${suffix})${extension}`;
    suffix += 1;
  }
  used.add(unique.toLocaleLowerCase());
  return unique;
}

interface Entry {
  readonly name: Uint8Array;
  readonly blob: Blob;
  readonly crc: number;
  readonly offset: number;
}

export async function createZipArchive(
  files: readonly { readonly name: string; readonly blob: Blob }[]
): Promise<Blob> {
  if (files.length > 0xffff) throw new ZipLimitError('ZIP_COUNT');
  const used = new Set<string>();
  const entries: Entry[] = [];
  const parts: BlobPart[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(safeName(file.name, used));
    if (name.length > 0xffff || file.blob.size > MAX_ZIP32) throw new ZipLimitError('ZIP_SIZE');
    const headerLength = 30 + name.length;
    if (offset + headerLength + file.blob.size > MAX_ZIP32)
      throw new ZipLimitError('ZIP_SIZE');
    const crc = await crc32(file.blob);
    const header = new Uint8Array(headerLength);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(12, 33, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, file.blob.size, true);
    view.setUint32(22, file.blob.size, true);
    view.setUint16(26, name.length, true);
    header.set(name, 30);
    entries.push({ name, blob: file.blob, crc, offset });
    parts.push(header, file.blob);
    offset += headerLength + file.blob.size;
  }

  const directoryOffset = offset;
  for (const entry of entries) {
    const header = new Uint8Array(46 + entry.name.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(14, 33, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.blob.size, true);
    view.setUint32(24, entry.blob.size, true);
    view.setUint16(28, entry.name.length, true);
    view.setUint32(42, entry.offset, true);
    header.set(entry.name, 46);
    parts.push(header);
    offset += header.length;
  }
  if (offset > MAX_ZIP32) throw new ZipLimitError('ZIP_SIZE');
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, offset - directoryOffset, true);
  view.setUint32(16, directoryOffset, true);
  parts.push(end);
  return new Blob(parts, { type: 'application/zip' });
}
