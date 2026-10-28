import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';
import { ToastProvider } from '../../components/ui/Toast';
import { QuizSessionPage } from './QuizSessionPage';

describe('QuizSessionPage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders assignment quiz, AI label banner, accessible radio group, and allows submission', async () => {
    render(
      <MemoryRouter initialEntries={['/student/quiz/asgn-test-1']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/student/quiz/:assignmentId" element={<QuizSessionPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify AI-generated label
    await waitFor(() => {
      expect(screen.getByText('AI-generated, reviewed by your teacher')).toBeDefined();
    });

    // Check Question counter and topic
    expect(screen.getByText(/Question 1 of/i)).toBeDefined();

    // Verify accessible radiogroup
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeDefined();

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(4);

    // Initial state: radios are enabled
    expect((screen.getByRole('button', { name: /submit answer/i }) as HTMLButtonElement).disabled).toBe(true);

    // Select option A (index 0)
    fireEvent.click(radios[0]);

    // Re-query active submit button
    const submitBtn = screen.getByRole('button', { name: /submit answer/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

    // Submit answer
    fireEvent.click(submitBtn);

    // Wait for submission and post-submit state:
    await waitFor(() => {
      // 1. Radio buttons must be locked (disabled)
      screen.getAllByRole('radio').forEach((r) => {
        expect((r as HTMLInputElement).disabled).toBe(true);
      });

      // 2. Result feedback: either "Correct! Great job." or "Not quite." with icon + text
      const feedback = screen.getByTestId('feedback-status');
      expect(feedback.textContent).toMatch(/Correct! Great job\.|Not quite\./i);

      // 3. Explanation must be displayed
      expect(screen.getByText(/Pedagogical Explanation:/i)).toBeDefined();

      // 4. Concept Review link must be present
      expect(screen.getByRole('button', { name: /concept review/i })).toBeDefined();

      // 5. Screen reader announcement container must have aria-live
      const liveRegion = screen.getByTestId('aria-live-result');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.textContent).toMatch(/Result:/i);
    });
  });
});
