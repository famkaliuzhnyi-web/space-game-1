import React, { useState, useEffect } from 'react';
import { TutorialManager } from '../../systems/TutorialManager';
import { TutorialHighlight } from './TutorialHighlight';
import './NewPlayerGuide.css';

interface NewPlayerGuideProps {
  tutorialManager: TutorialManager;
  gameEngine?: any;
  onComplete: () => void;
}

/**
 * Comprehensive new player onboarding experience
 * This component provides a guided introduction to all major game systems
 */
export const NewPlayerGuide: React.FC<NewPlayerGuideProps> = ({
  tutorialManager,
  gameEngine,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  
  const welcomeSteps = [
    {
      title: "Welcome to Space Game!",
      description: "You're about to embark on an exciting journey through the galaxy as a space trader. This tutorial will guide you through the essential systems you need to know.",
      target: null,
      action: "Let's get started!"
    },
    {
      title: "Your Game Interface",
      description: "This is your main game view. You'll see your ship, nearby objects, and the user interface panels around the screen.",
      target: "canvas",
      action: "I understand"
    },
    {
      title: "Navigation Panel",
      description: "Click this button to open the Navigation panel. Here you can see your current location, nearby stations, and plan your travel routes.",
      target: "button:contains('Navigation')",
      action: "Open Navigation"
    },
    {
      title: "Ship Management",
      description: "This Ship button opens your ship management panel. Here you can view your ship's status, cargo capacity, and manage your fleet.",
      target: "button:contains('Ship')",
      action: "Check out my ship"
    },
    {
      title: "Market System",
      description: "The Market button opens trading interfaces where you can buy and sell commodities. This is how you'll make money in the game!",
      target: "button:contains('Market')",
      action: "Explore markets"
    },
    {
      title: "Character Development",
      description: "Your character has skills that improve over time. Access character information and skill progression through this panel.",
      target: "button:contains('Character')",
      action: "View character"
    },
    {
      title: "Tutorial System",
      description: "Access detailed tutorials for specific game systems anytime through this Tutorial button. Each tutorial provides step-by-step guidance.",
      target: "button:contains('Tutorial')",
      action: "Remember this"
    },
    {
      title: "Ready to Play!",
      description: "You now know the basics! Start with simple trading missions, explore different stations, and gradually master more complex systems. Good luck, trader!",
      target: null,
      action: "Start playing!"
    }
  ];

  useEffect(() => {
    // Check if this is a new player (no completed tutorials and no character progress)
    if (tutorialManager && gameEngine) {
      const tutorialState = tutorialManager.getTutorialState();
      const characterManager = gameEngine.getCharacterManager();
      const character = characterManager?.getCharacter();
      
      // Show guide for new players or if explicitly requested
      if (tutorialState.completedFlows.length === 0 && (!character || character.level === 1)) {
        setIsNewPlayer(true);
        setIsVisible(true);
      }
    }
  }, [tutorialManager, gameEngine]);

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    
    // Start the basic tutorial flow automatically
    if (tutorialManager) {
      tutorialManager.startTutorialFlow('basics');
    }
    
    onComplete();
  };

  const currentWelcomeStep = welcomeSteps[currentStep];

  if (!isVisible || !isNewPlayer) {
    return null;
  }

  return (
    <>
      <div className="new-player-guide-overlay" />
      
      <div className="new-player-guide">
        <div className="guide-header">
          <h2>🚀 New Player Guide</h2>
          <div className="step-indicator">
            Step {currentStep + 1} of {welcomeSteps.length}
          </div>
        </div>

        <div className="guide-content">
          <h3>{currentWelcomeStep.title}</h3>
          <p>{currentWelcomeStep.description}</p>
        </div>

        <div className="guide-actions">
          <button onClick={handleNext} className="guide-btn primary">
            {currentWelcomeStep.action}
          </button>
          <button onClick={handleSkip} className="guide-btn secondary">
            Skip Guide
          </button>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Highlight target elements when specified */}
      {currentWelcomeStep.target && (
        <TutorialHighlight
          target={currentWelcomeStep.target}
          title={currentWelcomeStep.title}
          description={currentWelcomeStep.description}
          onNext={handleNext}
          onSkip={handleSkip}
          enabled={true}
          position="bottom"
        />
      )}
    </>
  );
};