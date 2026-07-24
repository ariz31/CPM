const AREA_BASES = ['mm', 'cm', 'dm', 'm', 'km', 'in', 'ft', 'yd'];
const VOLUME_BASES = AREA_BASES;

export function normalizeEngineeringText(value: string): string {
  let normalized = value.normalize('NFC');

  normalized = normalized
    .replace(/\b(?:sq\.?\s*m|sqm|square\s+met(?:er|re)s?)\b/gi, 'm²')
    .replace(/\b(?:cu\.?\s*m|cubic\s+met(?:er|re)s?)\b/gi, 'm³');

  for (const base of AREA_BASES) {
    const escaped = escapeRegExp(base);
    normalized = normalized.replace(
      new RegExp(`\\b${escaped}\\s*(?:\\^\\s*)?(?:2|²)(?=$|[\\s/·,;:)\\]])`, 'gi'),
      `${base}²`
    );
  }

  for (const base of VOLUME_BASES) {
    const escaped = escapeRegExp(base);
    normalized = normalized.replace(
      new RegExp(`\\b${escaped}\\s*(?:\\^\\s*)?(?:3|³)(?=$|[\\s/·,;:)\\]])`, 'gi'),
      `${base}³`
    );
  }

  return normalized;
}

export function normalizeEngineeringUnit(value: string): string {
  return normalizeEngineeringText(value.trim()).replace(/\s+/g, ' ');
}

export function containsAsciiEngineeringExponent(value: string): boolean {
  return /\b(?:mm|cm|dm|m|km|in|ft|yd)\s*(?:\^\s*)?[23](?=$|[\s/·,;:)\]])/i.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
