import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const artifacts = join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const qualifiedRun = process.env.CPM_RELEASE_GATES_PASSED === 'true';
const status = qualifiedRun ? 'pass' : 'not-run';
const generatedAt = new Date().toISOString();

const gateDefinitions = [
  ['requirements', 'Mandatory requirement traceability', ['src/traceability.test.ts', 'docs/20_IMPLEMENTATION_STATUS.md']],
  ['migrations', 'Schema migration matrix', ['src/infrastructure/projectMigration.test.ts']],
  ['security', 'Security and malicious corpus', ['src/infrastructure/untrustedJson.test.ts', 'artifacts/npm-audit.json']],
  ['data-integrity', 'Silent data-loss prevention', ['src/infrastructure/projectRepository.test.ts', 'src/infrastructure/releaseRecovery.test.ts']],
  ['performance', 'Performance and soak budgets', ['src/domain/release/releaseSoak.test.ts', 'src/domain/schedule/cpm.performance.test.ts']],
  ['accessibility', 'WCAG 2.2 AA core workflows', ['tests/e2e/release-smoke.spec.ts', 'artifacts/playwright-report']],
  ['compatibility', 'Browser and device compatibility', ['playwright.config.ts', 'artifacts/playwright-report']],
  ['offline-recovery', 'Offline install, update, rollback, and recovery', ['tests/e2e/release-smoke.spec.ts', 'src/infrastructure/releaseRecovery.test.ts']],
  ['documentation', 'User, administrator, and support guidance', ['docs/24_USER_ONBOARDING.md', 'docs/25_ADMINISTRATOR_AND_SUPPORT_GUIDE.md', 'docs/26_FORMULA_HANDBOOK.md']],
  ['provenance', 'SBOM and build provenance', ['artifacts/sbom.cdx.json', 'artifacts/provenance.json']]
];

const findings = await readAuditFindings(join(artifacts, 'npm-audit.json'));
const buildDigest = await digestDirectory(join(root, 'dist'));
const sbomDigest = await digestFile(join(artifacts, 'sbom.cdx.json'));

const evidence = {
  releaseVersion: packageJson.version,
  commitSha: process.env.GITHUB_SHA || undefined,
  generatedAt,
  projectSchemaVersion: 4,
  indexedDbVersion: 6,
  portableEnvelopeVersion: 1,
  gates: gateDefinitions.map(([id, title, files]) => ({
    id,
    title,
    status,
    mandatory: true,
    summary: qualifiedRun ? `${title} passed in the release qualification workflow.` : `${title} has not been executed by a qualifying workflow.`,
    evidence: files,
    measuredAt: qualifiedRun ? generatedAt : undefined
  })),
  findings,
  sbomDigest,
  buildDigest
};

const provenance = {
  subject: 'CPM Enterprise Project Controls',
  version: packageJson.version,
  commitSha: process.env.GITHUB_SHA || null,
  workflow: process.env.GITHUB_WORKFLOW || null,
  runId: process.env.GITHUB_RUN_ID || null,
  generatedAt,
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  buildDigest,
  sbomDigest
};

await writeFile(join(artifacts, 'release-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(join(artifacts, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ qualifiedRun, buildDigest, sbomDigest, findings: findings.length }, null, 2));

async function readAuditFindings(path) {
  try {
    const audit = JSON.parse(await readFile(path, 'utf8'));
    return Object.entries(audit.vulnerabilities || {}).map(([name, finding]) => ({
      id: `NPM-${name}`,
      severity: finding.severity || 'informational',
      title: `${name}: ${finding.via?.[0]?.title || 'dependency advisory'}`,
      resolved: false,
      evidence: finding.fixAvailable ? 'A fix is available.' : 'No automated fix is currently available.'
    }));
  } catch {
    return [];
  }
}

async function digestFile(path) {
  try {
    return createHash('sha256').update(await readFile(path)).digest('hex');
  } catch {
    return undefined;
  }
}

async function digestDirectory(directory) {
  try {
    const files = await walk(directory);
    const hash = createHash('sha256');
    for (const file of files.sort()) {
      hash.update(relative(directory, file));
      hash.update(await readFile(file));
    }
    return hash.digest('hex');
  } catch {
    return undefined;
  }
}

async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}
