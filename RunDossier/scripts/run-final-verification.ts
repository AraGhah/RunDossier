/**
 * Full verification suite — exits 0 only when score is 100%.
 * Usage: npm run verify:full
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Step {
  name: string;
  cmd: string;
  args: string[];
}

const steps: Step[] = [
  { name: 'build', cmd: 'npm', args: ['run', 'build'] },
  { name: 'unit-tests', cmd: 'npm', args: ['test'] },
  { name: 'e2e-db', cmd: 'npx', args: ['tsx', 'scripts/test-pipeline-e2e.ts'] },
  { name: 'delivery-email', cmd: 'npx', args: ['tsx', 'scripts/test-delivery-email.ts'] },
  { name: 'verify-pipelines', cmd: 'npm', args: ['run', 'verify'] },
];

function runStep(step: Step): boolean {
  console.log(`\n--- ${step.name} ---`);
  const result = spawnSync(step.cmd, step.args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const ok = result.status === 0;
  console.log(ok ? `[PASS] ${step.name}` : `[FAIL] ${step.name}`);
  return ok;
}

function main(): void {
  console.log('=== Vérification finale Preframe (objectif 100%) ===\n');
  const results: { name: string; ok: boolean }[] = [];

  for (const step of steps) {
    results.push({ name: step.name, ok: runStep(step) });
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  console.log('\n=== Bilan final ===');
  for (const r of results) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}`);
  }
  console.log(`\nScore: ${score}% (${passed}/${total})`);

  if (score < 100) {
    console.error('\n❌ Vérification incomplète — corrigez les étapes en échec.');
    process.exit(1);
  }

  console.log('\n✅ 100% — Tous les contrôles sont passés.');
  process.exit(0);
}

main();
