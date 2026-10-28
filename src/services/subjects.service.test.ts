import { describe, it, expect } from 'vitest';
import { subjectsService } from './subjects.service';

describe('subjectsService', () => {
  it('returns fallback subjects when database client is in offline fallback mode', async () => {
    const subjects = await subjectsService.getAvailableSubjects();
    expect(subjects.length).toBeGreaterThan(0);
    expect(subjects[0].code).toBe('CS101');
    expect(subjects[0].name).toBe('Programming in C');
  });

  it('validates a correct subject code case-insensitively', async () => {
    const result = await subjectsService.validateSubjectCode('cs101');
    expect(result.valid).toBe(true);
    expect(result.subject?.code).toBe('CS101');
  });

  it('rejects an empty subject code', async () => {
    const result = await subjectsService.validateSubjectCode('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects an unknown subject code with a helpful message', async () => {
    const result = await subjectsService.validateSubjectCode('MATH999');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('CS101');
  });
});
