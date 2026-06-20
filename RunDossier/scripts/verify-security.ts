/**
 * ITSAP.60.005 security control verification.
 * Usage: npx tsx scripts/verify-security.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(root, '..');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

const checks: Check[] = [];

function record(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
  console.log(ok ? `[PASS] ${name}` : `[FAIL] ${name} — ${detail}`);
}

function fileExists(relativeFromRepo: string): boolean {
  return existsSync(join(repoRoot, relativeFromRepo));
}

function fileContains(relativeFromRepo: string, needle: string): boolean {
  const path = join(repoRoot, relativeFromRepo);
  if (!existsSync(path)) return false;
  return readFileSync(path, 'utf8').includes(needle);
}

function main(): void {
  console.log('=== ITSAP.60.005 security verification ===\n');

  record(
    'security.txt (landing)',
    fileExists('landing/public/.well-known/security.txt'),
    'landing/public/.well-known/security.txt'
  );
  record(
    'security.txt route (API)',
    fileContains('RunDossier/src/app.ts', '/.well-known/security.txt'),
    'RunDossier/src/routes/security.ts'
  );
  record(
    'ITSAP mapping doc',
    fileExists('docs/security/ITSAP-60-005.md'),
    'docs/security/ITSAP-60-005.md'
  );
  record(
    'SECURITY.md policy',
    fileExists('SECURITY.md'),
    'SECURITY.md'
  );
  record(
    'Security headers middleware',
    fileExists('RunDossier/src/middleware/security-headers.ts'),
    'HSTS, CSP, COOP, CORP'
  );
  record(
    'Rate limiting',
    fileExists('RunDossier/src/middleware/rate-limit.ts'),
    'rate-limit.ts'
  );
  record(
    'Auth lockout',
    fileExists('RunDossier/src/middleware/auth-lockout.ts'),
    'auth-lockout.ts'
  );
  record(
    'Safe error responses',
    fileExists('RunDossier/src/utils/safe-error.ts'),
    'safe-error.ts'
  );
  record(
    'Input sanitization',
    fileExists('RunDossier/src/utils/sanitize.ts'),
    'sanitize.ts'
  );
  record(
    'Audit log',
    fileExists('RunDossier/src/utils/audit-log.ts'),
    'audit-log.ts'
  );
  record(
    'Parameterized DB layer',
    fileContains('RunDossier/src/db.ts', 'pool.query'),
    'db.ts'
  );
  record(
    'CI dependency audit',
    fileContains('.github/workflows/ci.yml', 'npm audit') ||
      fileContains('.github/workflows/ci.yml', 'audit'),
    '.github/workflows/ci.yml'
  );
  record(
    'Pilot uses sanitize',
    fileContains('RunDossier/src/routes/pilot.ts', 'sanitizeText'),
    'pilot.ts'
  );
  record(
    'Intake uses sanitize',
    fileContains('RunDossier/src/services/intake.ts', 'sanitizeText'),
    'intake.ts'
  );
  record(
    'Telegram secureCompare',
    fileContains('RunDossier/src/routes/telegram.ts', 'secureCompare'),
    'telegram.ts'
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n=== ${checks.length - failed.length}/${checks.length} passed ===`);
  if (failed.length > 0) process.exit(1);
}

main();
