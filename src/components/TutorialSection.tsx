'use client';

import { useState } from 'react';
import Link from 'next/link';
import './tutorials.css';

export function TutorialSection() {
  const tutorials = [
    {
      id: 'tutorial-1',
      title: 'Passkey Authentication Setup',
      slug: 'tutorial-1-passkey-setup',
      duration: '5 min',
      difficulty: 'Beginner',
      steps: [
        'Install Lazorkit SDK: npm install @lazorkit/wallet',
        'Wrap your app with LazorkitProvider',
        'Use the useWallet hook in components',
        'Call connect() with passkey options',
        'Handle authentication state',
      ],
      code: `import { LazorkitProvider } from '@lazorkit/wallet';

function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
    >
      <YourApp />
    </LazorkitProvider>
  );
}`,
      description: 'Learn to set up biometric authentication with passkeys',
      hasFile: true
    },
    {
      id: 'tutorial-2',
      title: 'Gasless Transactions',
      slug: 'tutorial-2-gasless-transfer',
      duration: '8 min',
      difficulty: 'Intermediate',
      steps: [
        'Configure paymaster for gasless mode',
        'Create gasless transaction instructions',
        'Send transactions without paying fees',
        'Handle transaction confirmation',
        'Monitor gasless transaction status',
      ],
      code: `import { useWallet } from '@lazorkit/wallet';

function GaslessTransfer() {
  const { signAndSendTransaction } = useWallet();

  const handleGaslessTransfer = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL
    });

    // Gasless transaction
    await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: { 
        feeMode: 'paymaster',
        paymaster: 'lazorkit'
      }
    });
  };

  return <button onClick={handleGaslessTransfer}>Send Gasless</button>;
}`,
      description: 'Send transactions without gas fees using paymaster',
      hasFile: true
    },
    {
      id: 'tutorial-3',
      title: 'Multi-Device Sync',
      slug: 'architecture',
      duration: '10 min',
      difficulty: 'Advanced',
      steps: [
        'Understand passkey cross-device architecture',
        'Configure session persistence',
        'Implement device switching',
        'Secure session management',
        'Handle session timeouts',
      ],
      code: `// Passkeys sync automatically across devices via platform authenticators

const { connect, isConnected, session } = useWallet();

// Session persists across user devices
await connect({ 
  feeMode: 'paymaster',
  sessionOptions: {
    persist: true,
    timeout: 3600000 // 1 hour
  }
});`,
      description: 'Understand how passkeys sync across multiple devices',
      hasFile: true
    },
    {
      id: 'tutorial-4',
      title: 'Contributing & Development',
      slug: 'contributing',
      duration: '15 min',
      difficulty: 'Advanced',
      steps: [
        'Set up development environment',
        'Understand project structure',
        'Run the development server',
        'Make changes and test',
        'Submit pull requests',
      ],
      code: `# Clone the repository
git clone https://github.com/lazor-kit/lazor-kit.git
cd lazor-kit

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build`,
      description: 'Learn how to contribute to the Lazorkit project',
      hasFile: true
    },
  ];

  const [activeTutorials, setActiveTutorials] = useState([0, 1]); // Default: Show first 2 tutorials
  const [showCodeLeft, setShowCodeLeft] = useState(false);
  const [showCodeRight, setShowCodeRight] = useState(false);

  const leftTutorial = tutorials[activeTutorials[0]];
  const rightTutorial = tutorials[activeTutorials[1]];

  const selectTutorial = (index: number, position: 'left' | 'right') => {
    if (position === 'left') {
      setActiveTutorials([index, activeTutorials[1]]);
      setShowCodeLeft(false);
    } else {
      setActiveTutorials([activeTutorials[0], index]);
      setShowCodeRight(false);
    }
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'tutorial-badge tutorial-badge-beginner';
      case 'Intermediate': return 'tutorial-badge tutorial-badge-intermediate';
      case 'Advanced': return 'tutorial-badge tutorial-badge-advanced';
      default: return 'tutorial-badge';
    }
  };

  return (
    <div className="tutorial-section w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="tutorial-header">
        <h2 className="tutorial-title">
          Documentation & Tutorials
        </h2>
        <p className="tutorial-subtitle">
          Complete guides to integrate Lazorkit into your Solana applications
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 fade-in">
        
        {/* Left Column: Tutorial List */}
        <div className="lg:col-span-1">
          <div className="tutorial-list-container">
            <h3 className="tutorial-list-title">
              Available Docs
            </h3>
            
            <div className="space-y-3">
              {tutorials.map((tutorial, index) => {
                const isActiveLeft = index === activeTutorials[0];
                const isActiveRight = index === activeTutorials[1];
                const isActive = isActiveLeft || isActiveRight;

                return (
                  <div key={tutorial.id} className="relative">
                    <button
                      onClick={() => {
                        if (isActiveLeft) {
                          selectTutorial(index, 'right');
                        } else if (isActiveRight) {
                          selectTutorial(index, 'left');
                        } else {
                          const lessRecent = activeTutorials[0] < activeTutorials[1] ? 0 : 1;
                          selectTutorial(index, lessRecent === 0 ? 'left' : 'right');
                        }
                      }}
                      className={`tutorial-item ${isActive ? 'active' : ''}`}
                    >
                      <div className="tutorial-item-header">
                        <h4 className="tutorial-item-title">
                          {tutorial.title}
                        </h4>
                        <span className={getDifficultyClass(tutorial.difficulty)}>
                          {tutorial.difficulty}
                        </span>
                      </div>
                      
                      <div className="tutorial-item-meta">
                        <span>⏱️ {tutorial.duration}</span>
                        <span>•</span>
                        <span>{tutorial.steps.length} steps</span>
                      </div>
                      
                      {/* File indicator */}
                      <div className="tutorial-file-indicator">
                        {tutorial.hasFile ? '📄' : '📝'}
                      </div>
                      
                      {/* Active indicators */}
                      {isActiveLeft && (
                        <div className="active-indicator active-indicator-left" title="Left Panel" />
                      )}
                      {isActiveRight && (
                        <div className="active-indicator active-indicator-right" title="Right Panel" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Pro Tips */}
            <div className="pro-tips mt-6">
              <p>
                <strong className="text-white">Quick Tip:</strong> Click a tutorial to select it, click again to swap panels
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTutorials([activeTutorials[1], activeTutorials[0]]);
                  setShowCodeLeft(showCodeRight);
                  setShowCodeRight(showCodeLeft);
                }}
                className="control-btn w-full text-center"
              >
                ↕️ Swap Panels
              </button>
              <button
                onClick={() => {
                  setActiveTutorials([0, 1]);
                  setShowCodeLeft(false);
                  setShowCodeRight(false);
                }}
                className="control-btn w-full text-center"
              >
                🔄 Reset View
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Two Tutorial Panels */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Tutorial Panel */}
            <div className="tutorial-panel">
              <div className="tutorial-panel-header tutorial-panel-header-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="panel-badge panel-badge-left">
                        Panel 1
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyClass(leftTutorial.difficulty)}`}>
                        {leftTutorial.difficulty}
                      </span>
                    </div>
                    <h3 className="panel-title">
                      {leftTutorial.title}
                    </h3>
                    <p className="panel-description">
                      {leftTutorial.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCodeLeft(!showCodeLeft)}
                    className="toggle-btn shrink-0"
                  >
                    {showCodeLeft ? '📝 Show Steps' : '💻 Show Code'}
                  </button>
                </div>
              </div>
              
              <div className="tutorial-content">
                {showCodeLeft ? (
                  <div className="space-y-4">
                    <div className="code-container">
                      <div className="code-header">
                        <span className="code-language">TypeScript</span>
                        <span className="text-xs text-gray-400">
                          {leftTutorial.duration} • {leftTutorial.steps.length} steps
                        </span>
                      </div>
                      <pre className="code-block">
                        <code>{leftTutorial.code}</code>
                      </pre>
                    </div>
                    <div className="code-tip">
                      <span>💡</span>
                      <span>This example uses Lazorkit SDK v1.0+</span>
                    </div>
                  </div>
                ) : (
                  <ol className="tutorial-steps">
                    {leftTutorial.steps.map((step, index) => (
                      <li key={index} className="tutorial-step">
                        <span className="step-number step-number-left">
                          {index + 1}
                        </span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              
              <div className="tutorial-actions">
                <div className="actions-grid">
                  {leftTutorial.slug ? (
                    <Link
                      href={`/docs/${leftTutorial.slug}`}
                      className="btn-primary btn-primary-left"
                    >
                      📄 View Documentation
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="btn-primary btn-primary-left opacity-50 cursor-not-allowed"
                    >
                      📄 Documentation Coming Soon
                    </button>
                  )}
                  <Link
                    href="https://docs.lazorkit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    🌐 Official Docs
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Tutorial Panel */}
            <div className="tutorial-panel">
              <div className="tutorial-panel-header tutorial-panel-header-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="panel-badge panel-badge-right">
                        Panel 2
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyClass(rightTutorial.difficulty)}`}>
                        {rightTutorial.difficulty}
                      </span>
                    </div>
                    <h3 className="panel-title">
                      {rightTutorial.title}
                    </h3>
                    <p className="panel-description">
                      {rightTutorial.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCodeRight(!showCodeRight)}
                    className="toggle-btn shrink-0"
                  >
                    {showCodeRight ? '📝 Show Steps' : '💻 Show Code'}
                  </button>
                </div>
              </div>
              
              <div className="tutorial-content">
                {showCodeRight ? (
                  <div className="space-y-4">
                    <div className="code-container">
                      <div className="code-header">
                        <span className="code-language">
                          {rightTutorial.slug === 'contributing' ? 'Bash/Terminal' : 'TypeScript'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {rightTutorial.duration} • {rightTutorial.steps.length} steps
                        </span>
                      </div>
                      <pre className="code-block">
                        <code>{rightTutorial.code}</code>
                      </pre>
                    </div>
                    <div className="code-tip">
                      <span>💡</span>
                      <span>
                        {rightTutorial.slug === 'contributing' 
                          ? 'Development setup for Lazorkit SDK' 
                          : 'Works with Lazorkit SDK v1.0+'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <ol className="tutorial-steps">
                    {rightTutorial.steps.map((step, index) => (
                      <li key={index} className="tutorial-step">
                        <span className="step-number step-number-right">
                          {index + 1}
                        </span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              
              <div className="tutorial-actions">
                <div className="actions-grid">
                  {rightTutorial.slug ? (
                    <Link
                      href={`/docs/${rightTutorial.slug}`}
                      className="btn-primary btn-primary-right"
                    >
                      📄 View Documentation
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="btn-primary btn-primary-right opacity-50 cursor-not-allowed"
                    >
                      📄 Documentation Coming Soon
                    </button>
                  )}
                  <Link
                    href="https://docs.lazorkit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    🌐 Official Docs
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls Section */}
          <div className="controls-section">
            <div className="controls-info">
              <span>Currently viewing: </span>
              <strong>
                "{leftTutorial.title}" (Left) & "{rightTutorial.title}" (Right)
              </strong>
            </div>
            <div className="controls-buttons">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const nextLeft = (activeTutorials[0] + 1) % tutorials.length;
                    setActiveTutorials([nextLeft, activeTutorials[1]]);
                    setShowCodeLeft(false);
                  }}
                  className="control-btn"
                >
                  ⏭️ Next Left
                </button>
                <button
                  onClick={() => {
                    const nextRight = (activeTutorials[1] + 1) % tutorials.length;
                    setActiveTutorials([activeTutorials[0], nextRight]);
                    setShowCodeRight(false);
                  }}
                  className="control-btn"
                >
                  ⏭️ Next Right
                </button>
              </div>
              <Link
                href="/docs"
                className="control-btn control-btn-primary"
              >
                📚 All Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialSection;