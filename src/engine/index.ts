/**
 * RecallLoop AI v2 - Pure Deterministic Engine Index
 *
 * Rules:
 * 1. Pure deterministic TypeScript, 100% tested. No LLM in recommendations.
 * 2. Mastery, status, and trends are DERIVED from the attempts table, never stored.
 * 3. Zero attempts = "not-assessed"; 0% with attempts = "weak".
 * 4. Never rely on color alone: status = icon + text.
 */

export * from './mastery';
export * from './recommend';
export * from './insights';
export * from './quizValidator';
