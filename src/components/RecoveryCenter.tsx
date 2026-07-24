import type { JournalEntry, ProjectSnapshot } from '../domain/project/types';

interface RecoveryCenterProps {
  snapshots: ProjectSnapshot[];
  journal: JournalEntry[];
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
}

export function RecoveryCenter({ snapshots, journal, onCreateSnapshot, onRestoreSnapshot }: RecoveryCenterProps) {
  return (
    <section className="surface panel-stack" aria-labelledby="recovery-title">
      <div className="surface-heading">
        <div>
          <p className="eyebrow">Data protection</p>
          <h2 id="recovery-title">Recovery center</h2>
        </div>
        <button className="button button-primary" type="button" onClick={onCreateSnapshot}>Create snapshot</button>
      </div>
      <div className="two-column-list">
        <div>
          <h3>Snapshots</h3>
          {snapshots.length === 0 ? <p className="muted">No snapshots yet.</p> : null}
          <ul className="simple-list">
            {snapshots.slice(0, 12).map((snapshot) => (
              <li key={snapshot.id}>
                <div><strong>{snapshot.name}</strong><span>{new Date(snapshot.createdAt).toLocaleString()} · {snapshot.kind}</span></div>
                <button className="button button-small" type="button" onClick={() => onRestoreSnapshot(snapshot.id)}>Restore copy</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recent journal</h3>
          {journal.length === 0 ? <p className="muted">No commands recorded.</p> : null}
          <ul className="simple-list journal-list">
            {journal.slice(0, 12).map((entry) => (
              <li key={entry.id ?? entry.commandId}>
                <div><strong>{entry.commandType}</strong><span>{entry.summary}</span></div>
                <time>{new Date(entry.createdAt).toLocaleTimeString()}</time>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
