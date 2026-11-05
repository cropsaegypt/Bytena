const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

console.log(`[Baytna DB Setup] Target Database Engine: ${isPostgres ? 'Cloud PostgreSQL (Persistent)' : 'SQLite'}`);

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (isPostgres) {
  // Ensure provider is postgresql
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema);
    console.log('[Baytna DB Setup] Switched schema.prisma datasource provider to "postgresql"');
  }
} else {
  // Ensure provider is sqlite
  if (schema.includes('provider = "postgresql"')) {
    schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema);
    console.log('[Baytna DB Setup] Switched schema.prisma datasource provider to "sqlite"');
  }
}

try {
  console.log('[Baytna DB Setup] Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('[Baytna DB Setup] Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

  console.log('[Baytna DB Setup] Seeding database...');
  execSync('node prisma/seed.js', { stdio: 'inherit' });

  console.log('[Baytna DB Setup] Database setup completed successfully!');
} catch (error) {
  console.warn('[Baytna DB Setup] Warning during DB setup:', error.message);
}
