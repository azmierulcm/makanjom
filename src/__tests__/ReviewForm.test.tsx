import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/ReviewForm';
import { checkRateLimit } from '@/lib/rateLimit';

jest.mock('framer-motion', () => {
  const React = require('react');
  type MotionDivProps = React.PropsWithChildren<
    React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; exit?: unknown }
  >;
  return {
    motion: {
      div: React.forwardRef(({ children, initial: _i, animate: _a, exit: _e, ...props }: MotionDivProps, ref: React.Ref<HTMLDivElement>) =>
        React.createElement('div', { ...props, ref }, children)
      ),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('@/lib/gamification', () => ({
  recordReview: jest.fn().mockReturnValue({ points: 50, badges: [] }),
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 2, resetInMs: 0 }),
  formatResetTime: jest.fn().mockReturnValue('1h'),
}));

describe('ReviewForm', () => {
  it('renders the restaurant name', () => {
    render(<ReviewForm restaurantId="r1" restaurantName="Nasi Lemak House" />);
    expect(screen.getByText(/Nasi Lemak House/)).toBeInTheDocument();
  });

  it('disables submit button when no rating is selected', () => {
    render(<ReviewForm restaurantId="r1" restaurantName="Test" />);
    expect(screen.getByRole('button', { name: /post review/i })).toBeDisabled();
  });

  it('enables submit button after selecting a star rating', () => {
    render(<ReviewForm restaurantId="r1" restaurantName="Test" />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // click first star
    expect(screen.getByRole('button', { name: /post review/i })).not.toBeDisabled();
  });

  it('shows rate-limit alert when review limit is exceeded', () => {
    (checkRateLimit as jest.Mock).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetInMs: 3_600_000,
    });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ReviewForm restaurantId="r1" restaurantName="Test" />);
    fireEvent.click(screen.getAllByRole('button')[0]); // select star
    fireEvent.click(screen.getByRole('button', { name: /post review/i }));

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('too many reviews'));
    alertSpy.mockRestore();
  });

  it('shows success state after a successful submission', async () => {
    render(<ReviewForm restaurantId="r1" restaurantName="Test" />);
    fireEvent.click(screen.getAllByRole('button')[0]); // select star
    fireEvent.click(screen.getByRole('button', { name: /post review/i }));

    await waitFor(() => {
      expect(screen.getByText('Review Shared!')).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback after a successful submission', async () => {
    const onSuccess = jest.fn();
    render(<ReviewForm restaurantId="r1" restaurantName="Test" onSuccess={onSuccess} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: /post review/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
