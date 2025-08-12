import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TicTacToe from '../components/ui/TicTacToe';

describe('TicTacToe', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnBack.mockClear();
  });

  describe('Initial State', () => {
    it('should render the game board with 9 empty cells', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      expect(cells).toHaveLength(9);
      
      cells.forEach(cell => {
        expect(cell).toBeEnabled();
        expect(cell).toHaveTextContent('');
      });
    });

    it('should display current player as X initially', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      expect(screen.getByText('Current Player: X')).toBeInTheDocument();
    });

    it('should render back button and new game button', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      expect(screen.getByRole('button', { name: '← Back to Menu' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🔄 New Game' })).toBeInTheDocument();
    });

    it('should render game title', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      expect(screen.getByText('🎮 Tic Tac Toe')).toBeInTheDocument();
    });
  });

  describe('Game Play', () => {
    it('should place X when first cell is clicked', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      fireEvent.click(cells[0]);
      
      expect(cells[0]).toHaveTextContent('X');
      expect(cells[0]).toBeDisabled();
      expect(screen.getByText('Current Player: O')).toBeInTheDocument();
    });

    it('should alternate between X and O players', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // X plays
      fireEvent.click(cells[0]);
      expect(cells[0]).toHaveTextContent('X');
      expect(screen.getByText('Current Player: O')).toBeInTheDocument();
      
      // O plays
      fireEvent.click(cells[1]);
      expect(cells[1]).toHaveTextContent('O');
      expect(screen.getByText('Current Player: X')).toBeInTheDocument();
      
      // X plays again
      fireEvent.click(cells[2]);
      expect(cells[2]).toHaveTextContent('X');
      expect(screen.getByText('Current Player: O')).toBeInTheDocument();
    });

    it('should not allow clicking on occupied cells', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // X plays first cell
      fireEvent.click(cells[0]);
      expect(cells[0]).toHaveTextContent('X');
      
      // Try to click the same cell again
      fireEvent.click(cells[0]);
      expect(cells[0]).toHaveTextContent('X'); // Should still be X
      expect(screen.getByText('Current Player: O')).toBeInTheDocument(); // Should still be O's turn
    });
  });

  describe('Win Conditions', () => {
    it('should detect horizontal win in first row', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // X wins first row: X X X
      fireEvent.click(cells[0]); // X
      fireEvent.click(cells[3]); // O
      fireEvent.click(cells[1]); // X
      fireEvent.click(cells[4]); // O
      fireEvent.click(cells[2]); // X - wins!
      
      expect(screen.getByText('🎉 Player X Wins!')).toBeInTheDocument();
      
      // All cells should be disabled after win
      cells.forEach(cell => {
        expect(cell).toBeDisabled();
      });
    });

    it('should detect vertical win in first column', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // X wins first column: positions 0, 3, 6
      fireEvent.click(cells[0]); // X
      fireEvent.click(cells[1]); // O
      fireEvent.click(cells[3]); // X
      fireEvent.click(cells[2]); // O
      fireEvent.click(cells[6]); // X - wins!
      
      expect(screen.getByText('🎉 Player X Wins!')).toBeInTheDocument();
    });

    it('should detect diagonal win', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // X wins diagonal: positions 0, 4, 8
      fireEvent.click(cells[0]); // X
      fireEvent.click(cells[1]); // O
      fireEvent.click(cells[4]); // X
      fireEvent.click(cells[2]); // O
      fireEvent.click(cells[8]); // X - wins!
      
      expect(screen.getByText('🎉 Player X Wins!')).toBeInTheDocument();
    });

    it('should detect anti-diagonal win', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // X wins anti-diagonal: positions 2, 4, 6
      fireEvent.click(cells[2]); // X
      fireEvent.click(cells[0]); // O
      fireEvent.click(cells[4]); // X
      fireEvent.click(cells[1]); // O
      fireEvent.click(cells[6]); // X - wins!
      
      expect(screen.getByText('🎉 Player X Wins!')).toBeInTheDocument();
    });

    it('should detect O player win', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // O wins first row
      fireEvent.click(cells[3]); // X
      fireEvent.click(cells[0]); // O
      fireEvent.click(cells[4]); // X
      fireEvent.click(cells[1]); // O
      fireEvent.click(cells[6]); // X
      fireEvent.click(cells[2]); // O - wins!
      
      expect(screen.getByText('🎉 Player O Wins!')).toBeInTheDocument();
    });
  });

  describe('Draw Condition', () => {
    it('should detect a draw when board is full with no winner', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      // Play a draw game
      // X O X
      // X O O
      // O X X
      fireEvent.click(cells[0]); // X at 0
      fireEvent.click(cells[1]); // O at 1
      fireEvent.click(cells[2]); // X at 2
      fireEvent.click(cells[4]); // O at 4 (center)
      fireEvent.click(cells[3]); // X at 3
      fireEvent.click(cells[5]); // O at 5
      fireEvent.click(cells[7]); // X at 7
      fireEvent.click(cells[6]); // O at 6
      fireEvent.click(cells[8]); // X at 8 - draw!
      
      expect(screen.getByText("🤝 It's a Draw!")).toBeInTheDocument();
      
      // All cells should be disabled after draw
      cells.forEach(cell => {
        expect(cell).toBeDisabled();
      });
    });
  });

  describe('Game Reset', () => {
    it('should reset the game when new game button is clicked', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      const newGameButton = screen.getByRole('button', { name: '🔄 New Game' });
      
      // Play some moves
      fireEvent.click(cells[0]); // X
      fireEvent.click(cells[1]); // O
      
      expect(cells[0]).toHaveTextContent('X');
      expect(cells[1]).toHaveTextContent('O');
      expect(screen.getByText('Current Player: X')).toBeInTheDocument();
      
      // Reset game
      fireEvent.click(newGameButton);
      
      // All cells should be empty and enabled
      cells.forEach(cell => {
        expect(cell).toHaveTextContent('');
        expect(cell).toBeEnabled();
      });
      
      // Should be X's turn again
      expect(screen.getByText('Current Player: X')).toBeInTheDocument();
    });

    it('should reset after a win', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      const newGameButton = screen.getByRole('button', { name: '🔄 New Game' });
      
      // X wins
      fireEvent.click(cells[0]); // X
      fireEvent.click(cells[3]); // O
      fireEvent.click(cells[1]); // X
      fireEvent.click(cells[4]); // O
      fireEvent.click(cells[2]); // X - wins!
      
      expect(screen.getByText('🎉 Player X Wins!')).toBeInTheDocument();
      
      // Reset game
      fireEvent.click(newGameButton);
      
      // Game should be reset
      expect(screen.getByText('Current Player: X')).toBeInTheDocument();
      cells.forEach(cell => {
        expect(cell).toHaveTextContent('');
        expect(cell).toBeEnabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const backButton = screen.getByRole('button', { name: '← Back to Menu' });
      fireEvent.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes to cells with X', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      fireEvent.click(cells[0]);
      
      expect(cells[0]).toHaveClass('game-cell', 'filled', 'player-x');
    });

    it('should apply correct CSS classes to cells with O', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      fireEvent.click(cells[0]); // X
      fireEvent.click(cells[1]); // O
      
      expect(cells[1]).toHaveClass('game-cell', 'filled', 'player-o');
    });

    it('should not have filled classes for empty cells', () => {
      render(<TicTacToe onBack={mockOnBack} />);
      
      const cells = screen.getAllByRole('button', { name: '' });
      
      expect(cells[0]).toHaveClass('game-cell');
      expect(cells[0]).not.toHaveClass('filled', 'player-x', 'player-o');
    });
  });
});