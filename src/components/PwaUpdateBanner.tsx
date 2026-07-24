import { useEffect, useState } from 'react';
import { applyPendingPwaUpdate, subscribePwaReleaseState, type PwaReleaseState } from '../infrastructure/pwaUpdate';

export function PwaUpdateBanner() {
  const [state, setState] = useState<PwaReleaseState>('idle');
  const [error, setError] = useState<string>();
  useEffect(() => subscribePwaReleaseState(setState), []);
  if (state === 'idle') return null;
  if (state === 'offline-ready') return <div className="release-banner" role="status">The application shell is ready for offline use.</div>;
  if (state === 'failed') return <div className="release-banner release-banner-error" role="alert">The application update controller failed. Continue using the current cached release and export critical projects.</div>;
  return (
    <div className="release-banner" role={error ? 'alert' : 'status'}>
      <span>{state === 'preparing-update' ? 'Creating recovery snapshots before installing the update…' : 'A new application release is available. Local project recovery snapshots will be created first.'}</span>
      {state === 'update-available' ? <button className="button button-small" type="button" onClick={() => {
        setError(undefined);
        void applyPendingPwaUpdate().catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to prepare the update.'));
      }}>Prepare and install</button> : null}
      {error ? <strong>{error}</strong> : null}
    </div>
  );
}
