import { ghApi, DEFAULT_REPO } from './client.mjs';

async function main() {
  console.log('Fetching Epic #36...');
  const epic = await ghApi(`/repos/${DEFAULT_REPO}/issues/36`);

  const oldTarget = '- [ ] #9 — **M0.1:** Avaliação técnica de bibliotecas PDF (pdf-lib, PDF.js, WASM) e matriz de compatibilidade';
  const newTarget = '- [ ] #9 — **[RESEARCH] PDF Processing Engines — JavaScript vs C++/Rust WebAssembly**';

  if (!epic.body.includes(oldTarget)) {
    console.log('Old target line not found or already updated.');
    return;
  }

  const updatedBody = epic.body.replace(oldTarget, newTarget);
  console.log('Updating Epic #36 with new title for #9...');
  await ghApi(`/repos/${DEFAULT_REPO}/issues/36`, {
    method: 'PATCH',
    body: JSON.stringify({ body: updatedBody })
  });

  console.log('Epic #36 successfully updated!');
}

main().catch(err => {
  console.error('Error syncing epic:', err.message);
  process.exit(1);
});
