import { useEffect, useRef } from 'react';
import { THEME_OPTIONS, useAppearance, type AccentId, type ContrastId, type DensityId, type MotionId, type UiPreferences } from '../design-system/theme';

export function AppearancePanel() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { preferences, resolvedTheme, updatePreferences, resetPreferences } = useAppearance();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', closeOnBackdrop);
    return () => dialog.removeEventListener('click', closeOnBackdrop);
  }, []);

  return (
    <>
      <button className="app-header-action" type="button" onClick={() => dialogRef.current?.showModal()} aria-label="Open appearance settings">
        <span className="appearance-swatch" data-preview-theme={resolvedTheme} aria-hidden="true" />
        <span>Appearance</span>
      </button>
      <dialog className="appearance-dialog" ref={dialogRef} aria-labelledby="appearance-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Workspace preferences</p>
            <h2 id="appearance-title">Appearance</h2>
            <p>Choose a professional theme and tune density, contrast, motion, and scale for this device.</p>
          </div>
          <button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close appearance settings">×</button>
        </div>

        <fieldset className="appearance-section">
          <legend>Theme</legend>
          <label className="system-theme-toggle">
            <input
              type="checkbox"
              checked={preferences.themeMode === 'system'}
              onChange={(event) => updatePreferences({ themeMode: event.target.checked ? 'system' : 'fixed' })}
            />
            <span><strong>Follow system</strong><small>Automatically use Daylight or Night Shift.</small></span>
          </label>
          <div className="theme-grid" role="radiogroup" aria-label="Theme selection">
            {THEME_OPTIONS.map((theme) => (
              <label className={`theme-option ${preferences.themeId === theme.id ? 'selected' : ''}`} key={theme.id}>
                <input
                  type="radio"
                  name="theme"
                  value={theme.id}
                  checked={preferences.themeId === theme.id}
                  onChange={() => updatePreferences({ themeMode: 'fixed', themeId: theme.id })}
                />
                <span className="theme-preview" data-preview-theme={theme.id} aria-hidden="true"><i /><i /><i /></span>
                <span><strong>{theme.name}</strong><small>{theme.description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="appearance-form-grid">
          <PreferenceSelect<AccentId>
            label="Accent"
            value={preferences.accentId}
            options={[['cobalt', 'Cobalt'], ['teal', 'Teal'], ['amber', 'Amber'], ['violet', 'Violet']]}
            onChange={(accentId) => updatePreferences({ accentId })}
          />
          <PreferenceSelect<DensityId>
            label="Density"
            value={preferences.density}
            options={[['compact', 'Compact'], ['comfortable', 'Comfortable'], ['touch', 'Touch']]}
            onChange={(density) => updatePreferences({ density })}
          />
          <PreferenceSelect<ContrastId>
            label="Contrast"
            value={preferences.contrast}
            options={[['standard', 'Standard'], ['enhanced', 'Enhanced']]}
            onChange={(contrast) => updatePreferences({ contrast })}
          />
          <PreferenceSelect<MotionId>
            label="Motion"
            value={preferences.motion}
            options={[['system', 'Follow system'], ['full', 'Full'], ['reduced', 'Reduced']]}
            onChange={(motion) => updatePreferences({ motion })}
          />
          <PreferenceSelect<UiPreferences['fontScale']>
            label="Interface scale"
            value={preferences.fontScale}
            options={[[0.9, '90%'], [1, '100%'], [1.1, '110%'], [1.25, '125%']]}
            onChange={(fontScale) => updatePreferences({ fontScale })}
          />
        </div>

        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={resetPreferences}>Reset defaults</button>
          <button className="button button-primary" type="button" onClick={() => dialogRef.current?.close()}>Done</button>
        </div>
      </dialog>
    </>
  );
}

function PreferenceSelect<T extends string | number>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="appearance-field">
      <span>{label}</span>
      <select value={String(value)} onChange={(event) => {
        const option = options.find(([candidate]) => String(candidate) === event.target.value);
        if (option) onChange(option[0]);
      }}>
        {options.map(([optionValue, optionLabel]) => <option key={String(optionValue)} value={String(optionValue)}>{optionLabel}</option>)}
      </select>
    </label>
  );
}
