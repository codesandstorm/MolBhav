/**
 * LLM second annotator, skeleton only (docs/product/04_research_integrity.md §2 step 7).
 * DO NOT RUN: no provider is chosen yet, and it fails closed before sending anything.
 *
 * Rules built in:
 * - provider and model come from the environment; the key comes from the environment only
 *   (MOLBHAV_LLM_API_KEY), is never written to disk, and is redacted from every message;
 * - temperature 0;
 * - the model sees the guidelines and the message text only: never the card, the intended
 *   move, or the author's pass-1 labels;
 * - every run stores the prompt template, its sha256, the guidelines' sha256, the provider,
 *   the model and version, and the date, next to the results.
 */
import { sha256 } from './split.ts';

export const ENV = {
  provider: 'MOLBHAV_LLM_PROVIDER',
  model: 'MOLBHAV_LLM_MODEL',
  key: 'MOLBHAV_LLM_API_KEY',
} as const;
export const TEMPERATURE = 0;

export class AnnotatorError extends Error {}

/** The request a provider adapter receives. It has no card, intent or pass-1 field by design. */
export interface AnnotationRequest {
  system: string;
  user: string;
  model: string;
  temperature: typeof TEMPERATURE;
}
export interface Adapter {
  /** returns the raw model text and the model version the provider reports */
  annotate(req: AnnotationRequest, key: string): Promise<{ text: string; modelVersion: string }>;
}

/**
 * Provider adapters. TODO(owner): empty until a provider is chosen (a decision listed in the
 * B1.1 report). Until then every run fails closed.
 */
export const ADAPTERS: Record<string, Adapter> = {};

export const PROMPT_TEMPLATE = `You are labelling one message for a research gold set, using only the labelling guidelines below.
The message was written by the project's author as a client message to a freelancer. Label only what the text says.
Reply with one JSON object and nothing else, with exactly these fields:
{"move": one of PRICE_POSITION|PUSHBACK|CONCESSION|INFO_REQUEST|ACCEPT|OTHER,
 "objection": one of BUDGET|SCOPE|TIMELINE|PAYMENT_TERMS|TRUST|COMPETITOR|NONE,
 "conditional": true or false if move is CONCESSION, otherwise null,
 "amount": {"rupees": whole rupees as a string of digits or null, "rupees_high": digits or null,
            "unit": fixed|hour|day|month|unspecified or null, "currency": INR|OTHER or null, "ambiguous": true|false},
 "unsure": true|false}

=== GUIDELINES ===
{{GUIDELINES}}
=== END GUIDELINES ===`;

export const buildPrompt = (guidelines: string, messageText: string) => {
  const system = PROMPT_TEMPLATE.replace('{{GUIDELINES}}', guidelines);
  return {
    system,
    user: `Message:\n${messageText}`,
    templateSha256: sha256(PROMPT_TEMPLATE),
    guidelinesSha256: sha256(guidelines),
  };
};

/** Replace every occurrence of the key with [REDACTED]. Every log line goes through this. */
export const redact = (text: string, key: string | undefined) =>
  key && key.length >= 4 ? text.split(key).join('[REDACTED]') : text;

export interface Config {
  provider: string;
  model: string;
  key: string;
  adapter: Adapter;
}

/** Reads the environment and resolves the adapter. Throws (fails closed) on anything missing. */
export const configFromEnv = (env: Record<string, string | undefined> = process.env): Config => {
  const provider = env[ENV.provider]?.trim();
  const model = env[ENV.model]?.trim();
  const key = env[ENV.key];
  const missing = [!provider && ENV.provider, !model && ENV.model, !key && ENV.key].filter(Boolean);
  if (missing.length)
    throw new AnnotatorError(
      `Set ${missing.join(', ')} in the environment (the key is read from the environment only).`,
    );
  const adapter = ADAPTERS[provider!];
  if (!adapter)
    throw new AnnotatorError(
      `No adapter for provider "${provider}". No LLM provider has been chosen yet, so the second annotator ` +
        `is not implemented and nothing was sent. Choose a provider, add its adapter to ADAPTERS in ` +
        `packages/gold/src/annotator.ts, and record the choice in docs/product/04_research_integrity.md §2 step 7.`,
    );
  return { provider: provider!, model: model!, key: key!, adapter };
};

/** The run record stored next to labels_llm.jsonl. */
export const runRecord = (
  c: Pick<Config, 'provider' | 'model'>,
  p: ReturnType<typeof buildPrompt>,
  modelVersion: string,
  date = new Date(),
) => ({
  provider: c.provider,
  model: c.model,
  model_version: modelVersion,
  date: date.toISOString(),
  temperature: TEMPERATURE,
  prompt_template: PROMPT_TEMPLATE,
  prompt_template_sha256: p.templateSha256,
  guidelines_sha256: p.guidelinesSha256,
  inputs: 'guidelines + message text only (no cards, no intended moves, no pass-1 labels)',
});
