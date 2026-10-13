export function cleanText(value: string): string { return value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
