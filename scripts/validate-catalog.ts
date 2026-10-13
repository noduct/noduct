import { tools } from '../src/data/tools';
import { validateCatalog } from '../src/lib/catalog';
const errors = validateCatalog(tools);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Catalog valid: ${tools.length} tool definitions.`);
