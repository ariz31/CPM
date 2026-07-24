import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const artifacts = join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const workflowPassed = process.env.CPM_RELEASE_GATES_PASSED === 'true';
const generatedAt = new Date().toISOString();
const requirementBlockers = await readRequirementBlockers();

const gateDefinitions = [
  ['requirements', 'Mandatory requirement traceability', ['src/domain/release/requirementCoverage.ts', 'docs/20_IMPLEMENTATION_STATUS.md']],
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

const gates = gateDefinitions.map(([id, title, files]) => {
  if (!workflowPassed) return {
    id, title, status: 'not-run', mandatory: true,
    summary: `${title} has not been executed by a qualifying workflow.`, evidence: files
  };
  if (id === 'requirements' && requirementBlockers.length > 0) return {
    id, title, status: 'fail', mandatory: true,
    summary: `${requirementBlockers.length} mapped mandatory capabilities remain partial.`,
    evidence: [...files, ...requirementBlockers.map((id) => `blocker:${id}`)], measuredAt: generatedAt
  };
  return {
    id, title, status: 'pass', mandatory: true,
    summary: `${title} passed in the release qualification workflow.`, evidence: files, measuredAt: generatedAt
  };
});

const qualified = workflowPassed
  && gates.every((gate) => gate.status === 'pass')
  && findings.every((finding) => finding.resolved || !['critical', 'high'].includes(finding.severity));

const evidence = {
  releaseVersion: packageJson.version,
  commitSha: process.env.GITHUB_SHA || undefined,
  generatedAt,
  projectSchemaVersion: 4,
  indexedDbVersion: 6,
  portableEnvelopeVersion: 1,
  qualified,
  gates,
  requirementBlockers,
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
  sbomDigest,
  qualified
};

await writeFile(join(artifacts, 'release-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(join(artifacts, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ workflowPassed, qualified, requirementBlockers: requirementBlockers.length, buildDigest, sbomDigest, findings: findings.length }, null, 2));

async function readRequirementBlockers() {
  const source = await readFile(join(root, 'src/domain/release/requirementCoverage.ts'), 'utf8');
  const body = source.match(/const blockers:[\s\S]*?=\s*\{([\s\S]*?)\n\};/)?.[1] || '';
  return [...body.matchAll(/^\s*'([A-Z]+-\d{3})':/gm)].map((match) => match[1]);
}

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
  try { return createHash('sha256').update(await readFile(path)).digest('hex'); }
  catch { return undefined; }
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
  } catch { return undefined; }
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
