/**
 * Message analyser (S4b): the amount parser and the rule baseline, written from
 * ml/gold/GUIDELINES.md v0.2 before any gold message exists. Runs on the device, in a Web
 * Worker (serve.ts on the worker side, client.ts on the main thread). The learned model (S4c)
 * is Phase B2.
 */
export * from './labels.ts';
export * from './format.ts';
export * from './amount.ts';
export * from './rules.ts';
export type { AnalyseRequest, AnalyseResponse, PortLike } from './serve.ts';
