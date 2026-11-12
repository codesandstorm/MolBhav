/**
 * Phase C1, the deterministic half of "plan the reply": S5 options (plan.ts, rules in
 * docs/product/18_planner_rules.md), S6 template drafts (templates.ts, draft.ts) and the A5 number
 * post-check (check.ts). Pure functions, no I/O. The LLM path (/v1/draft) is Phase C2: it will
 * take the same DraftRequest and its output goes through the same checkDraft.
 */
export * from './types.ts';
export * from './steps.ts';
export * from './plan.ts';
export * from './copy.ts';
export * from './templates.ts';
export * from './draft.ts';
export * from './check.ts';
