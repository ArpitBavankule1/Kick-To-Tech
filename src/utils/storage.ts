import type { UserAnswer } from '../types';

const STORAGE_KEY = 'recall_loop_ai_answers_v1';

export function loadAnswersFromStorage(): UserAnswer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          typeof item?.questionId === 'string' &&
          typeof item?.topic === 'string' &&
          typeof item?.isCorrect === 'boolean'
      );
    }
    return [];
  } catch (err) {
    console.error('Error loading answers from localStorage:', err);
    return [];
  }
}

export function saveAnswersToStorage(answers: UserAnswer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (err) {
    console.error('Error saving answers to localStorage:', err);
  }
}

export function clearAnswersFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
}
