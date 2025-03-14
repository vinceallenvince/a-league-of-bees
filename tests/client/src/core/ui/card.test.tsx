import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../../../client/src/core/ui/card';

describe('Card Component', () => {
  it('should render Card with all sub-components', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="card-header">
          <CardTitle data-testid="card-title">Card Title</CardTitle>
          <CardDescription data-testid="card-description">This is a description of the card</CardDescription>
        </CardHeader>
        <CardContent data-testid="card-content">
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter data-testid="card-footer">
          <button>Action Button</button>
        </CardFooter>
      </Card>
    );

    // Check if all components are rendered
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-description')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    
    // Check content
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('This is a description of the card')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('should render Card with custom className', () => {
    render(<Card className="custom-class" data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('should render CardDescription with custom className', () => {
    render(<CardDescription className="custom-description" data-testid="description">Description</CardDescription>);
    const description = screen.getByTestId('description');
    expect(description).toHaveClass('custom-description');
    expect(description).toHaveClass('text-sm');
  });

  it('should render CardFooter with custom className', () => {
    render(<CardFooter className="custom-footer" data-testid="footer">Footer content</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('custom-footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
  });
}); 