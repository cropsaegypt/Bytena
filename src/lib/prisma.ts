import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { EMBEDDED_DB_BASE64 } from './db-seed-binary';

function getDatabaseUrl(): string {
  // 1. If a Cloud Database URL is provided (PostgreSQL / Neon / Supabase): USE IT DIRECTLY!
  if (
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))
  ) {
    return process.env.DATABASE_URL;
  }

  // 2. On Vercel / serverless: copy dev.db to /tmp so SQLite has write and journal lock permissions!
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || (process.env.NODE_ENV === 'production' && process.platform === 'linux')) {
    const tmpDbPath = '/tmp/dev.db';
    let needsRestore = true;

    if (fs.existsSync(tmpDbPath)) {
      try {
        const stats = fs.statSync(tmpDbPath);
        if (stats.size > 1000) {
          needsRestore = false;
        }
      } catch (err) {
        needsRestore = true;
      }
    }

    if (needsRestore) {
      let copied = false;
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve('./prisma/dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
        path.join(__dirname, 'prisma', 'dev.db'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            copied = true;
            console.log(`[Baytna DB] Restored SQLite database from ${candidate} to ${tmpDbPath}`);
            break;
          } catch (e) {
            console.error('[Baytna DB] Failed to copy database from candidate:', e);
          }
        }
      }

      if (!copied && EMBEDDED_DB_BASE64) {
        try {
          const buffer = Buffer.from(EMBEDDED_DB_BASE64, 'base64');
          fs.writeFileSync(tmpDbPath, buffer);
          console.log(`[Baytna DB] Restored SQLite database from embedded binary to ${tmpDbPath} (${buffer.length} bytes)`);
        } catch (e) {
          console.error('[Baytna DB] Failed to restore embedded binary to /tmp:', e);
        }
      }

      try {
        fs.chmodSync(tmpDbPath, 0o666);
      } catch (e) {
        // ignore chmod errors
      }
    }

    return `file:${tmpDbPath}`;
  }
  return process.env.DATABASE_URL || 'file:./dev.db';
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
