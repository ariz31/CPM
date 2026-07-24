const MAX_JSON_DEPTH = 100;
const MAX_JSON_NODES = 250_000;
const MAX_JSON_KEYS = 100_000;
const MAX_STRING_BYTES = 10 * 1024 * 1024;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function parseUntrustedJson(text: string): unknown {
  assertTextEnvelope(text);
  const value = JSON.parse(text, (key, item: unknown) => {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Project file contains forbidden key: ${key}`);
    return item;
  }) as unknown;
  inspectValue(value);
  return value;
}

function assertTextEnvelope(text: string): void {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (const character of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{' || character === '[') {
      depth += 1;
      if (depth > MAX_JSON_DEPTH) throw new Error(`Project file exceeds the maximum JSON depth of ${MAX_JSON_DEPTH}.`);
    } else if (character === '}' || character === ']') {
      depth -= 1;
      if (depth < 0) throw new Error('Project file has invalid JSON structure.');
    }
  }
  if (depth !== 0 || inString) throw new Error('Project file has incomplete JSON structure.');
}

function inspectValue(root: unknown): void {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }];
  let nodes = 0;
  let keys = 0;
  let stringBytes = 0;
  while (queue.length > 0) {
    const current = queue.pop()!;
    nodes += 1;
    if (nodes > MAX_JSON_NODES) throw new Error(`Project file exceeds the maximum JSON node count of ${MAX_JSON_NODES}.`);
    if (current.depth > MAX_JSON_DEPTH) throw new Error(`Project file exceeds the maximum JSON depth of ${MAX_JSON_DEPTH}.`);
    if (typeof current.value === 'string') {
      stringBytes += new TextEncoder().encode(current.value).byteLength;
      if (stringBytes > MAX_STRING_BYTES) throw new Error('Project file contains excessive string data.');
      continue;
    }
    if (Array.isArray(current.value)) {
      for (const item of current.value) queue.push({ value: item, depth: current.depth + 1 });
      continue;
    }
    if (current.value && typeof current.value === 'object') {
      const prototype = Object.getPrototypeOf(current.value);
      if (prototype !== Object.prototype && prototype !== null) throw new Error('Project file contains a non-plain object.');
      for (const [key, item] of Object.entries(current.value as Record<string, unknown>)) {
        keys += 1;
        if (keys > MAX_JSON_KEYS) throw new Error(`Project file exceeds the maximum JSON key count of ${MAX_JSON_KEYS}.`);
        if (FORBIDDEN_KEYS.has(key)) throw new Error(`Project file contains forbidden key: ${key}`);
        queue.push({ value: item, depth: current.depth + 1 });
      }
    }
  }
}
