const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const targetFile = path.join(__dirname, '..', 'src', 'lib', 'db-seed-binary.ts');

if (fs.existsSync(dbPath)) {
  const buf = fs.readFileSync(dbPath);
  const base64 = buf.toString('base64');
  const content = `export const EMBEDDED_DB_BASE64 = "${base64}";\n`;
  fs.writeFileSync(targetFile, content);
  console.log(`[Rebuild Embedded DB] Successfully updated ${targetFile} (${buf.length} bytes -> Base64 length ${base64.length})`);
} else {
  console.error('[Rebuild Embedded DB] prisma/dev.db does not exist!');
}
