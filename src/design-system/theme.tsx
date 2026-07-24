import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeId = 'daylight' | 'night-shift' | 'blueprint' | 'high-contrast';
export type AccentId = 'cobalt' | 'teal' | 'amber' | 'violet';
export type DensityId = 'compact' | 'comfortable' | 'touch';
export type ContrastId = 'standard' | 'enhanced';
export type MotionId = 'system' | 'full' | 'reduced';

export interface UiPreferences {
  themeMode: 'system' | 'fixed';
  themeId: ThemeId;
  accentId: AccentId;
  density: DensityId;
  contrast: ContrastId;
  motion: MotionId;
  fontScale: 0.9 | 1 | 1.1 | 1.25;
}

export const THEME_OPTIONS: Array<{ id: ThemeId; name: string; description: string }> = [
  { id: 'daylight', name: 'Daylight', description: 'Neutral high-readability light workspace' },
  { id: 'night-shift', name: 'Night Shift', description: 'Low-glare dark workspace for long sessions' },
  { id: 'blueprint', name: 'Blueprint', description: 'Deep navy technical workspace with cyan accents' },
  { id: 'high-contrast', name: 'High Contrast', description: 'Strong boundaries and maximum legibility' }
];

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  themeMode: 'system',
  themeId: 'daylight',
  accentId: 'cobalt',
  density: 'comfortable',
  contrast: 'standard',
  motion: 'system',
  fontScale: 1
};

export const UI_PREFERENCES_STORAGE_KEY = 'cpm.ui.preferences.v1';

interface AppearanceContextValue {
  preferences: UiPreferences;
  resolvedTheme: ThemeId;
  updatePreferences: (changes: Partial<UiPreferences>) => void;
  resetPreferences: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

function isThemeId(value: unknown): value is ThemeId {
  return THEME_OPTIONS.some((theme) => theme.id === value);
}

export function readUiPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_UI_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      themeMode: parsed.themeMode === 'fixed' ? 'fixed' : 'system',
      themeId: isThemeId(parsed.themeId) ? parsed.themeId : DEFAULT_UI_PREFERENCES.themeId,
      accentId: ['cobalt', 'teal', 'amber', 'violet'].includes(String(parsed.accentId)) ? parsed.accentId as AccentId : DEFAULT_UI_PREFERENCES.accentId,
      density: ['compact', 'comfortable', 'touch'].includes(String(parsed.density)) ? parsed.density as DensityId : DEFAULT_UI_PREFERENCES.density,
      contrast: parsed.contrast === 'enhanced' ? 'enhanced' : 'standard',
      motion: ['system', 'full', 'reduced'].includes(String(parsed.motion)) ? parsed.motion as MotionId : 'system',
      fontScale: [0.9, 1, 1.1, 1.25].includes(Number(parsed.fontScale)) ? parsed.fontScale as UiPreferences['fontScale'] : 1
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

function resolveTheme(preferences: UiPreferences, prefersDark: boolean): ThemeId {
  if (preferences.themeMode === 'fixed') return preferences.themeId;
  return prefersDark ? 'night-shift' : 'daylight';
}

function applyUiPreferences(preferences: UiPreferences, prefersDark: boolean): ThemeId {
  const resolvedTheme = resolveTheme(preferences, prefersDark);
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = preferences.themeMode;
  root.dataset.accent = preferences.accentId;
  root.dataset.density = preferences.density;
  root.dataset.contrast = preferences.contrast;
  root.dataset.motion = preferences.motion;
  root.style.setProperty('--user-font-scale', String(preferences.fontScale));
  root.style.colorScheme = resolvedTheme === 'daylight' ? 'light' : 'dark';
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = resolvedTheme === 'daylight' ? '#f3f5f8' : resolvedTheme === 'high-contrast' ? '#000000' : '#08111f';
  return resolvedTheme;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UiPreferences>(() => readUiPreferences());
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const resolvedTheme = resolveTheme(preferences, prefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    applyUiPreferences(preferences, prefersDark);
    localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, prefersDark]);

  const value = useMemo<AppearanceContextValue>(() => ({
    preferences,
    resolvedTheme,
    updatePreferences: (changes) => setPreferences((current) => ({ ...current, ...changes })),
    resetPreferences: () => setPreferences(DEFAULT_UI_PREFERENCES)
  }), [preferences, resolvedTheme]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider.');
  return value;
}
