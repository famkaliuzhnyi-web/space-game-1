import React, { useEffect, useState } from 'react';
import './TutorialHighlight.css';

interface TutorialHighlightProps {
  target: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
  description?: string;
  onNext?: () => void;
  onSkip?: () => void;
  enabled: boolean;
}

export const TutorialHighlight: React.FC<TutorialHighlightProps> = ({
  target,
  position = 'bottom',
  title,
  description,
  onNext,
  onSkip,
  enabled
}) => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled || !target) {
      setTargetElement(null);
      setHighlightRect(null);
      return;
    }

    // Handle special selectors like text content matching
    let element: HTMLElement | null = null;
    
    if (target.includes(':contains(')) {
      // Extract text from :contains() selector
      const match = target.match(/button:contains\(['"]([^'"]+)['"]\)/);
      if (match) {
        const searchText = match[1];
        const buttons = Array.from(document.querySelectorAll('button'));
        element = buttons.find(btn => btn.textContent?.trim() === searchText) as HTMLElement || null;
      }
    } else {
      element = document.querySelector(target) as HTMLElement;
    }
    if (element) {
      setTargetElement(element);
      setHighlightRect(element.getBoundingClientRect());

      // Update rect on scroll/resize
      const updateRect = () => {
        setHighlightRect(element.getBoundingClientRect());
      };

      window.addEventListener('scroll', updateRect);
      window.addEventListener('resize', updateRect);

      return () => {
        window.removeEventListener('scroll', updateRect);
        window.removeEventListener('resize', updateRect);
      };
    }
  }, [target, enabled]);

  if (!enabled || !targetElement || !highlightRect) {
    return null;
  }

  const getTooltipStyle = () => {
    const padding = 20;
    let top = highlightRect.top;
    let left = highlightRect.left;

    switch (position) {
      case 'top':
        top = highlightRect.top - padding;
        left = highlightRect.left + highlightRect.width / 2;
        break;
      case 'bottom':
        top = highlightRect.bottom + padding;
        left = highlightRect.left + highlightRect.width / 2;
        break;
      case 'left':
        top = highlightRect.top + highlightRect.height / 2;
        left = highlightRect.left - padding;
        break;
      case 'right':
        top = highlightRect.top + highlightRect.height / 2;
        left = highlightRect.right + padding;
        break;
    }

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      transform: position === 'top' || position === 'bottom' 
        ? 'translateX(-50%)'
        : position === 'left' || position === 'right'
        ? 'translateY(-50%)'
        : 'none',
      zIndex: 10000
    };
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="tutorial-overlay" />
      
      {/* Highlighted element outline */}
      <div 
        className="tutorial-highlight"
        style={{
          position: 'fixed',
          top: `${highlightRect.top - 4}px`,
          left: `${highlightRect.left - 4}px`,
          width: `${highlightRect.width + 8}px`,
          height: `${highlightRect.height + 8}px`,
          zIndex: 9999
        }}
      />
      
      {/* Tooltip */}
      {(title || description) && (
        <div 
          className={`tutorial-tooltip ${position}`}
          style={getTooltipStyle()}
        >
          {title && <h4>{title}</h4>}
          {description && <p>{description}</p>}
          
          {(onNext || onSkip) && (
            <div className="tooltip-actions">
              {onNext && (
                <button onClick={onNext} className="tooltip-btn primary">
                  Continue
                </button>
              )}
              {onSkip && (
                <button onClick={onSkip} className="tooltip-btn secondary">
                  Skip
                </button>
              )}
            </div>
          )}
          
          {/* Arrow */}
          <div className={`tooltip-arrow ${position}`} />
        </div>
      )}
    </>
  );
};