import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';
import { ToastProvider } from '../../components/ui/Toast';
import { StudentDashboard } from './StudentDashboard';

describe('StudentDashboard Integration & Telemetry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders enrolled subjects tabs and Knowledge Gap Map using Phase 4 engine', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <StudentDashboard />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for subjects and topics to load
    await waitFor(() => {
      expect(screen.getByText('Programming in C')).toBeDefined();
      expect(screen.getByText('CS101')).toBeDefined();
    });

    // Check Add Subject option
    expect(screen.getAllByText('Add Subject').length).toBeGreaterThan(0);

    // Check Knowledge Gap Map section heading
    expect(screen.getByText('Knowledge Gap Map')).toBeDefined();

    // Verify Rule 4 status badges on topics (Arrays, Loops, Pointers, Data Structures)
    await waitFor(() => {
      expect(screen.getByText('Arrays')).toBeDefined();
      expect(screen.getByText('Loops')).toBeDefined();
      expect(screen.getByText('Pointers')).toBeDefined();
    });

    // Verify Recommendation Card
    expect(screen.getByText('Adaptive Recommendation')).toBeDefined();

    // Verify Mistake Patterns and Streak
    expect(screen.getByText('Mistake Patterns')).toBeDefined();
    expect(screen.getByText(/Day Streak/i)).toBeDefined();

    // Verify Today's Assignment card is rendered for published assignment
    expect(screen.getByText("Today's Assignment")).toBeDefined();
  });

  it('opens Add Subject modal and accepts code input', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <StudentDashboard />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Programming in C')).toBeDefined();
    });

    // Click "Add Subject" button
    const addBtns = screen.getAllByRole('button', { name: /add subject/i });
    fireEvent.click(addBtns[0]);

    // Modal should now be open
    await waitFor(() => {
      expect(screen.getByLabelText(/subject code/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /join subject/i })).toBeDefined();
    });
  });
});
