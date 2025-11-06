import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpModal from './HelpModal';

describe('HelpModal', () => {
  it('should not render when isOpen is false', () => {
    const mockOnClose = vi.fn();
    const { container } = render(<HelpModal isOpen={false} onClose={mockOnClose} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    const mockOnClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('How to use BabelPod')).toBeInTheDocument();
  });

  it('should display all help sections', () => {
    const mockOnClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('🎧 Getting Started')).toBeInTheDocument();
    expect(screen.getByText('🎮 Player Controls')).toBeInTheDocument();
    expect(screen.getByText('🌍 Translation Feature')).toBeInTheDocument();
    expect(screen.getByText('💾 Recent Podcasts')).toBeInTheDocument();
    expect(screen.getByText('📚 Finding Podcasts')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Known Limitations')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const mockOnClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByText('How to use BabelPod').closest('.modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    const mockOnClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen.getByText('How to use BabelPod').closest('.modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show translation feature details', () => {
    const mockOnClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Rewind 15s & Translate/i)).toBeInTheDocument();
    expect(screen.getByText(/When you hear something you don't understand/i)).toBeInTheDocument();
  });
});
