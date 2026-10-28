/**
 * RecallLoop AI v2 - Pure Deterministic Engine
 *
 * Rules:
 * 1. Pure deterministic TypeScript, 100% tested. No LLM in recommendations.
 * 2. Mastery and trends are DERIVED from the attempts table, never stored.
 * 3. Zero attempts = "Not Assessed"; 0% with attempts = "Weak".
 * 4. Never rely on color alone: status = icon + text.
 */

export * from '../utils/mastery';
export * from '../utils/recommender';
