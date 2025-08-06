import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders space game title', () => {
    render(<App />);
    expect(screen.getByText('🚀 Space Game')).toBeInTheDocument();
  });

  test('renders welcome message', () => {
    render(<App />);
    expect(screen.getByText('Welcome to the Space Adventure!')).toBeInTheDocument();
  });

  test('renders launch game button', () => {
    render(<App />);
    expect(screen.getByText('🚀 Launch Game')).toBeInTheDocument();
  });

  test('score increases when collect star button is clicked', () => {
    render(<App />);
    const button = screen.getByText(/Collect Star ⭐/);
    
    expect(button).toHaveTextContent('Score: 0');
    
    fireEvent.click(button);
    expect(button).toHaveTextContent('Score: 10');
    
    fireEvent.click(button);
    expect(button).toHaveTextContent('Score: 20');
  });
});