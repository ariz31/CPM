import { useEffect, useRef, useState } from 'react';

type FullscreenMode = 'native' | 'fallback' | null;

function findWorkspace(button: HTMLButtonElement | null): HTMLElement | null {
  return button?.closest<HTMLElement>('.modern-workspace') ?? null;
}

export function WorkspaceFullscreenToggle() {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [mode, setMode] = useState<FullscreenMode>(null);
  const isActive = mode !== null;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const workspace = findWorkspace(buttonRef.current);
      if (workspace && document.fullscreenElement === workspace) {
        setMode('native');
        return;
      }
      setMode((current) => current === 'fallback' ? current : null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const workspace = findWorkspace(buttonRef.current);
    const fallbackActive = mode === 'fallback';
    workspace?.classList.toggle('workspace-app-fullscreen', fallbackActive);
    document.body.classList.toggle('workspace-fullscreen-active', fallbackActive);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fallbackActive) setMode(null);
    };
    if (fallbackActive) window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (fallbackActive) {
        workspace?.classList.remove('workspace-app-fullscreen');
        document.body.classList.remove('workspace-fullscreen-active');
      }
    };
  }, [mode]);

  useEffect(() => () => {
    const workspace = findWorkspace(buttonRef.current);
    workspace?.classList.remove('workspace-app-fullscreen');
    document.body.classList.remove('workspace-fullscreen-active');
    if (workspace && document.fullscreenElement === workspace) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  async function toggleFullscreen(): Promise<void> {
    const workspace = findWorkspace(buttonRef.current);
    if (!workspace) return;

    if (mode === 'fallback') {
      setMode(null);
      return;
    }

    if (document.fullscreenElement === workspace) {
      await document.exitFullscreen();
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }

    try {
      if (typeof workspace.requestFullscreen === 'function') {
        await workspace.requestFullscreen();
        return;
      }
    } catch {
      // Mobile browsers may expose the API but reject non-media elements.
    }

    setMode('fallback');
  }

  return (
    <button
      ref={buttonRef}
      className="button button-small workspace-fullscreen-toggle"
      type="button"
      onClick={() => void toggleFullscreen()}
      aria-label={isActive ? 'Exit full screen' : 'Enter full screen'}
      aria-pressed={isActive}
      title={isActive ? 'Exit full screen' : 'Enter full screen'}
    >
      <span className="workspace-fullscreen-icon" aria-hidden="true">{isActive ? '↙' : '⛶'}</span>
      <span className="workspace-fullscreen-label">{isActive ? 'Exit full screen' : 'Full screen'}</span>
    </button>
  );
}
