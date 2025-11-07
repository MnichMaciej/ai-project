import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../helpers/react-testing-helpers';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import userEvent from '@testing-library/user-event';

describe('AIGenerateButton', () => {
  describe('AIGenerateButton_should_render_with_correct_props', () => {
    it('should render button with correct text and icon', () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      render(<AIGenerateButton onClick={onClick} disabled={false} queryCount={0} />);

      // Assert - button should be accessible by aria-label or text content
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Check that button contains the text
      expect(button).toHaveTextContent(/generuj z ai/i);
    });

    it('should call onClick when clicked', async () => {
      // Arrange
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<AIGenerateButton onClick={onClick} disabled={false} queryCount={0} />);

      // Act
      const button = screen.getByRole('button');
      await user.click(button);

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      render(<AIGenerateButton onClick={onClick} disabled={true} queryCount={0} />);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('AIGenerateButton_should_show_tooltip_when_disabled', () => {
    it('should show tooltip when disabled due to query limit', async () => {
      // Arrange
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<AIGenerateButton onClick={onClick} disabled={true} queryCount={5} />);

      // Act
      const button = screen.getByRole('button');
      await user.hover(button);

      // Assert - wait for tooltip to appear, use getAllByText and check first one
      const tooltips = await screen.findAllByText(/osiągnięto limit.*5.*zapytań/i);
      expect(tooltips.length).toBeGreaterThan(0);
      expect(tooltips[0]).toBeInTheDocument();
    });

    it('should not show tooltip when not disabled', async () => {
      // Arrange
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<AIGenerateButton onClick={onClick} disabled={false} queryCount={0} />);

      // Act
      const button = screen.getByRole('button');
      await user.hover(button);

      // Assert
      expect(screen.queryByText(/osiągnięto limit/i)).not.toBeInTheDocument();
    });
  });

  describe('AIGenerateButton_should_have_proper_accessibility', () => {
    it('should have aria-label attribute', () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      render(<AIGenerateButton onClick={onClick} disabled={false} queryCount={0} />);

      // Assert
      const button = screen.getByRole('button', {
        name: /generuj opis i technologie za pomocą ai/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-expanded attribute', () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      render(<AIGenerateButton onClick={onClick} disabled={false} queryCount={0} />);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should be keyboard accessible', async () => {
      // Arrange
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<AIGenerateButton onClick={onClick} disabled={false} queryCount={0} />);

      // Act
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});

