import { describe, expect, it } from 'vitest';
import { parseUntrustedJson } from './untrustedJson';

describe('untrusted JSON security corpus', () => {
  it('accepts ordinary project envelope JSON', () => {
    expect(parseUntrustedJson('{"format":"CPMPROJ","version":1,"project":{"id":"P1"}}')).toEqual({
      format: 'CPMPROJ', version: 1, project: { id: 'P1' }
    });
  });

  it.each([
    ['prototype pollution key', '{"project":{"__proto__":{"polluted":true}}}'],
    ['constructor key', '{"project":{"constructor":{"prototype":{"polluted":true}}}}'],
    ['prototype key', '{"project":{"prototype":{}}}']
  ])('rejects %s', (_name, payload) => {
    expect(() => parseUntrustedJson(payload)).toThrow(/forbidden key/i);
  });

  it('rejects excessive nesting before JSON.parse materializes it', () => {
    const payload = `${'['.repeat(101)}0${']'.repeat(101)}`;
    expect(() => parseUntrustedJson(payload)).toThrow(/maximum JSON depth/i);
  });

  it('rejects incomplete and structurally invalid JSON', () => {
    expect(() => parseUntrustedJson('{"project":')).toThrow(/incomplete|invalid/i);
    expect(() => parseUntrustedJson(']')).toThrow(/invalid JSON structure/i);
  });

  it('does not mutate global object prototypes', () => {
    expect(() => parseUntrustedJson('{"__proto__":{"releasePolluted":true}}')).toThrow();
    expect(({} as Record<string, unknown>).releasePolluted).toBeUndefined();
  });
});
