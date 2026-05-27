import { render, screen, fireEvent, act } from '@testing-library/react';
import MemoryMatchGame from '@/components/games/MemoryMatchGame';

jest.mock('framer-motion', () => {
  const React = require('react');
  type MotionButtonProps = React.PropsWithChildren<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }
  >;
  return {
    motion: {
      button: React.forwardRef(({ children, whileTap: _wt, ...props }: MotionButtonProps, ref: React.Ref<HTMLButtonElement>) =>
        React.createElement('button', { ...props, ref }, children)
      ),
    },
  };
});

jest.mock('@/lib/gamification', () => ({
  recordGamePlayed: jest.fn(),
}));

jest.mock('@/lib/sounds', () => ({
  sounds: { play: jest.fn() },
}));

// Make shuffle deterministic: sort(() => 0.5 - 0.5) = sort(() => 0)
// Stable sort preserves original order: ['🍛','🍜','🍣','🍧','🫓','☕','🍛','🍜','🍣','🍧','🫓','☕']
beforeEach(() => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('MemoryMatchGame', () => {
  it('renders 12 face-down cards', () => {
    render(<MemoryMatchGame />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
  });

  it('shows moves counter starting at 0', () => {
    render(<MemoryMatchGame />);
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
  });

  it('flips a card face-up when clicked', () => {
    render(<MemoryMatchGame />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // flip card 0 → 🍛
    expect(buttons[0]).toHaveTextContent('🍛');
  });

  it('keeps a matched pair revealed after correct match', () => {
    render(<MemoryMatchGame />);
    const buttons = screen.getAllByRole('button');
    // cards[0] and cards[6] are both 🍛 with deterministic shuffle
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[6]);
    expect(buttons[0]).toHaveTextContent('🍛');
    expect(buttons[6]).toHaveTextContent('🍛');
  });

  it('flips non-matching cards back after 700ms', () => {
    render(<MemoryMatchGame />);
    const buttons = screen.getAllByRole('button');
    // cards[0]=🍛, cards[1]=🍜 → no match
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    // Still flipped before timeout
    expect(buttons[0]).toHaveTextContent('🍛');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    // Flipped back after timeout
    expect(buttons[0]).not.toHaveTextContent('🍛');
  });

  it('increments moves counter after each pair attempt', () => {
    render(<MemoryMatchGame />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[6]); // match
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('shows Play again button after winning', () => {
    render(<MemoryMatchGame />);
    const buttons = screen.getAllByRole('button');
    // Click all 6 matching pairs in order
    const pairs: [number, number][] = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
    pairs.forEach(([a, b]) => {
      fireEvent.click(buttons[a]);
      fireEvent.click(buttons[b]);
    });
    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
  });
});
