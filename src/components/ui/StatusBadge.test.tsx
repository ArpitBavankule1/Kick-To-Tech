import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge UI Component (Rule 4: Never rely on color alone: status = icon + text)', () => {
  it('renders "Not Assessed" with text and icon for unassessed status (Rule 3)', () => {
    const { container } = render(<StatusBadge status="not_assessed" />);

    // Must have text
    expect(screen.getByText('Not Assessed')).toBeDefined();
    // Must NOT be labeled weak (Rule 3)
    expect(screen.queryByText('Weak')).toBeNull();

    // Must have an SVG icon
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).not.toBeNull();
  });

  it('renders "Weak" with text and icon when status is weak (Rule 3 & 4)', () => {
    const { container } = render(<StatusBadge status="weak" accuracy={33} />);

    expect(screen.getByText('Weak')).toBeDefined();
    expect(screen.getByText('(33%)')).toBeDefined();

    const svgIcon = container.querySelector('svg');
    expect(svgIcon).not.toBeNull();
  });

  it('renders "Developing" with text and icon', () => {
    const { container } = render(<StatusBadge status="developing" accuracy={65} />);

    expect(screen.getByText('Developing')).toBeDefined();
    expect(screen.getByText('(65%)')).toBeDefined();

    const svgIcon = container.querySelector('svg');
    expect(svgIcon).not.toBeNull();
  });

  it('renders "Strong" with text and icon', () => {
    const { container } = render(<StatusBadge status="strong" accuracy={90} />);

    expect(screen.getByText('Strong')).toBeDefined();
    expect(screen.getByText('(90%)')).toBeDefined();

    const svgIcon = container.querySelector('svg');
    expect(svgIcon).not.toBeNull();
  });
});
