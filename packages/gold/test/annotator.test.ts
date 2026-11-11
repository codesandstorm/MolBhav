import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ADAPTERS,
  AnnotatorError,
  buildPrompt,
  configFromEnv,
  PROMPT_TEMPLATE,
  redact,
  runRecord,
  TEMPERATURE,
} from '../src/annotator.ts';
import { sha256 } from '../src/split.ts';

const KEY = 'sk-test-0000-FAKE-KEY-never-real';

afterEach(() => vi.restoreAllMocks());

describe('LLM second annotator (skeleton)', () => {
  it('no provider adapter exists yet', () => expect(Object.keys(ADAPTERS)).toEqual([]));

  it('fails closed with a clear message when nothing is configured', () => {
    expect(() => configFromEnv({})).toThrow(AnnotatorError);
    expect(() => configFromEnv({})).toThrow(
      /MOLBHAV_LLM_PROVIDER, MOLBHAV_LLM_MODEL, MOLBHAV_LLM_API_KEY/,
    );
  });

  it('fails closed for any provider, sends nothing, and never echoes the key', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    let message = '';
    try {
      configFromEnv({
        MOLBHAV_LLM_PROVIDER: 'some-provider',
        MOLBHAV_LLM_MODEL: 'some-model',
        MOLBHAV_LLM_API_KEY: KEY,
      });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/No LLM provider has been chosen yet/);
    expect(message).toMatch(/nothing was sent/);
    expect(message).not.toContain(KEY);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the script exits 1 before reading data, and the key is not in its output', () => {
    const r = spawnSync(
      process.execPath,
      [join(import.meta.dirname, '..', 'scripts', 'annotate.ts')],
      {
        env: {
          ...process.env,
          MOLBHAV_LLM_PROVIDER: 'x',
          MOLBHAV_LLM_MODEL: 'y',
          MOLBHAV_LLM_API_KEY: KEY,
        },
        encoding: 'utf8',
      },
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/No LLM provider has been chosen yet/);
    expect(r.stdout + r.stderr).not.toContain(KEY);
  });

  it('redacts the key from any text', () =>
    expect(redact(`bad key ${KEY} rejected (${KEY})`, KEY)).toBe(
      'bad key [REDACTED] rejected ([REDACTED])',
    ));

  it('the prompt carries only the guidelines and the message text, and its hash is recorded', () => {
    const p = buildPrompt('GUIDELINES TEXT', '[FIXTURE, not gold] can you do 30k?');
    expect(p.system).toContain('GUIDELINES TEXT');
    expect(p.user).toBe('Message:\n[FIXTURE, not gold] can you do 30k?');
    for (const leak of ['card', 'intended', 'pass-1', 'v1'])
      expect(p.system.toLowerCase() + p.user.toLowerCase()).not.toContain(leak);
    expect(p.templateSha256).toBe(sha256(PROMPT_TEMPLATE));
    const rec = runRecord(
      { provider: 'p', model: 'm' },
      p,
      'm-2026-01',
      new Date('2026-11-11T00:00:00Z'),
    );
    expect(rec).toMatchObject({
      provider: 'p',
      model: 'm',
      model_version: 'm-2026-01',
      date: '2026-11-11T00:00:00.000Z',
      temperature: 0,
      prompt_template_sha256: p.templateSha256,
    });
    expect(TEMPERATURE).toBe(0);
  });
});
