import { useMemo } from 'react';
import { createReleaseGate, qualifyRelease, REQUIRED_RELEASE_GATES } from '../domain/release/releaseQualification';
import { getReleaseRequirementBlockers, REQUIREMENT_COVERAGE } from '../domain/release/requirementCoverage';
import type { ReleaseEvidencePackage } from '../domain/release/types';

const RELEASE_VERSION = '1.0.0-rc.1';

export function ReleaseQualificationPanel() {
  const blockers = getReleaseRequirementBlockers();
  const evidence = useMemo<ReleaseEvidencePackage>(() => ({
    releaseVersion: RELEASE_VERSION,
    generatedAt: new Date().toISOString(),
    projectSchemaVersion: 4,
    indexedDbVersion: 6,
    portableEnvelopeVersion: 1,
    gates: REQUIRED_RELEASE_GATES.map(({ id }) => {
      if (id === 'requirements') return createReleaseGate(id, blockers.length === 0 ? 'pass' : 'fail', `${REQUIREMENT_COVERAGE.length} requirements mapped; ${blockers.length} remain partial.`, ['docs/02_FUNCTIONAL_REQUIREMENTS.md', 'src/domain/release/requirementCoverage.ts']);
      if (id === 'documentation') return createReleaseGate(id, 'pass', 'User, administrator, support, and formula guidance are bundled with the release candidate.', ['docs/24_USER_ONBOARDING.md', 'docs/25_ADMINISTRATOR_AND_SUPPORT_GUIDE.md', 'docs/26_FORMULA_HANDBOOK.md']);
      return createReleaseGate(id, 'not-run', 'This gate is measured by the GitHub Release Qualification workflow.', ['.github/workflows/release-qualification.yml']);
    }),
    findings: []
  }), [blockers.length]);
  const qualification = qualifyRelease(evidence);

  function downloadEvidence(): void {
    const payload = { evidence, qualification, requirementBlockers: blockers };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cpm-${RELEASE_VERSION}-local-release-evidence.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="surface" aria-labelledby="release-qualification-title">
      <div className="surface-heading">
        <div><p className="eyebrow">Phase 10 · Version 1 qualification</p><h2 id="release-qualification-title">Enterprise offline release evidence</h2></div>
        <span className={`engine-badge ${qualification.qualified ? '' : 'warning'}`}>{qualification.qualified ? 'Qualified' : 'Release candidate blocked'}</span>
      </div>
      <p>{qualification.summary} Automated CI evidence is authoritative; this local view shows the current requirement mapping and gate contract.</p>
      <div className="analysis-summary">
        <strong>{REQUIREMENT_COVERAGE.length} mapped requirements</strong>
        <span>{blockers.length} partial mandatory capabilities</span>
        <span>Schema 4 · IndexedDB 6</span>
      </div>
      <div className="compact-table" role="table" aria-label="Release qualification gates">
        {evidence.gates.map((gate) => (
          <div className="compact-row wide" role="row" key={gate.id}>
            <strong role="cell">{gate.title}</strong>
            <span role="cell">{gate.status}</span>
            <span role="cell">{gate.summary}</span>
          </div>
        ))}
      </div>
      <details>
        <summary>{blockers.length} functional release blockers</summary>
        <div className="snapshot-list">
          {blockers.map((blocker) => <article key={blocker.id}><strong>{blocker.id}</strong><span>{blocker.evidence}</span></article>)}
        </div>
      </details>
      <button className="button button-secondary" type="button" onClick={downloadEvidence}>Download local evidence</button>
    </section>
  );
}
