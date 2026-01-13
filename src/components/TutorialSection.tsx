'use client';

import { useState } from 'react';

/**
 * TUTORIAL SECTION COMPONENT
 * 
 * PURPOSE:
 * Interactive tutorials for developers learning Lazorkit SDK.
 * 
 * STRUCTURE:
 * - List of 4 tutorials (beginner to advanced)
 * - Each tutorial has:
 *   * Title and difficulty badge
 *   * Duration estimate
 *   * Step-by-step instructions
 *   * Working code example
 * 
 * INTERACTION:
 * - Click tutorial to select it
 * - Toggle between "Steps" and "Code" view
 * - Links to full tutorial docs
 * - Links to official Lazorkit documentation
 * 
 * WHY THIS PATTERN:
 * - Combines documentation with working examples
 * - Progressive difficulty (easy → hard)
 * - Covers most common use cases
 * - Helps developers learn by doing
 * 
 * TUTORIAL TOPICS:
 * 1. Passkey Auth Setup (Beginner, 5 min)
 *    - Basic SDK installation and configuration
 * 
 * 2. Gasless USDC Transfer (Intermediate, 8 min)
 *    - Using paymaster for fee-free transactions
 * 
 * 3. Multi-Device Sync (Advanced, 10 min)
 *    - How passkeys work across devices
 * 
 * 4. Payment Widget (Intermediate, 12 min)
 *    - Building reusable components
 */


export function TutorialSection() {
  const tutorials = [
    {
      id: 'tutorial-1',
      title: 'Passkey Authentication Setup',
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
    },
    {
      id: 'tutorial-2',
      title: 'Gasless USDC Transfer',
      duration: '8 min',
      difficulty: 'Intermediate',
      steps: [
        'Set up paymaster configuration',
        'Create transfer instruction',
        'Use signAndSendTransaction with gasless option',
        'Handle transaction confirmation',
        'Display transaction status to user',
      ],
      code: `import { useWallet } from '@lazorkit/wallet';

function TransferButton() {
  const { signAndSendTransaction } = useWallet();

  const handleTransfer = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL
    });

    await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: { feeToken: 'USDC' }
    });
  };

  return <button onClick={handleTransfer}>Send Gasless</button>;
}`,
    },
    {
      id: 'tutorial-3',
      title: 'Multi-Device Session Persistence',
      duration: '10 min',
      difficulty: 'Advanced',
      steps: [
        'Configure cross-device passkey sync',
        'Implement session key management',
        'Handle device switching',
        'Secure session persistence',
        'Add session timeout features',
      ],
      code: `// Passkeys sync automatically across devices

const { connect, isConnected } = useWallet();

await connect({ feeMode: 'paymaster' });

// Session persists across devices`,
    },
    {
      id: 'tutorial-4',
      title: 'Building a Payment Widget',
      duration: '12 min',
      difficulty: 'Intermediate',
      steps: [
        'Create reusable payment component',
        'Add amount validation',
        'Implement recipient validation',
        'Add loading and error states',
        'Integrate with checkout flow',
      ],
      code: `function PaymentWidget({ amount, recipient }) {
  const { signAndSendTransaction, isConnected } = useWallet();

  const handlePayment = async () => {
    const instruction = createTransferInstruction(recipient, amount);
    await signAndSendTransaction({ instructions: [instruction] });
  };

  return isConnected
    ? <button onClick={handlePayment}>Pay</button>
    : <AuthButton />;
}`,
    },
  ];

  const [activeTutorial, setActiveTutorial] = useState(0);
  const [showCode, setShowCode] = useState(false);

  const active = tutorials[activeTutorial];

  return (
    <div className="tutorial-section">
      {/* Header */}
      <div className="tutorial-header">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          Step-by-Step Tutorials
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Practical guides to integrate Lazorkit into real applications
        </p>
      </div>

      <div className="tutorial-content">
        {/* Tutorial List */}
        <div className="tutorial-list">
          {tutorials.map((t, index) => {
            const isActive = index === activeTutorial;
            
            // Determine badge class based on difficulty
            const badgeClass = 
              t.difficulty === 'Beginner' 
                ? 'tutorial-badge-beginner' 
                : t.difficulty === 'Intermediate' 
                ? 'tutorial-badge-intermediate' 
                : 'tutorial-badge-advanced';

            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTutorial(index);
                  setShowCode(false);
                }}
                className={`tutorial-item ${isActive ? 'active' : ''}`}
              >
                <div className="tutorial-item-header">
                  <h3 className="font-semibold">
                    {t.title}
                  </h3>
                  <span className={`tutorial-badge ${badgeClass}`}>
                    {t.difficulty}
                  </span>
                </div>

                <div className="tutorial-item-meta">
                  <span>{t.duration}</span>
                  <span>•</span>
                  <span>{t.steps.length} steps</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tutorial Detail */}
        <div className="tutorial-detail">
          <div className="tutorial-detail-header">
            <h3 className="text-xl sm:text-2xl font-bold">
              {active.title}
            </h3>
            <button
              onClick={() => setShowCode(!showCode)}
              className="tutorial-toggle-btn"
            >
              {showCode ? 'Show Steps' : 'Show Code'}
            </button>
          </div>

          {showCode ? (
            <div className="tutorial-code">
              <pre className="bg-black/40 rounded-xl p-4 text-sm overflow-x-auto">
                <code className="text-gray-300">{active.code}</code>
              </pre>
            </div>
          ) : (
            <ol className="tutorial-steps">
              {active.steps.map((step, i) => (
                <li key={i} className="tutorial-step">
                  <span className="tutorial-step-number">
                    {i + 1}
                  </span>
                  <p className="text-gray-300">{step}</p>
                </li>
              ))}
            </ol>
          )}

          {/* Actions */}
          <div className="tutorial-actions">
            <a
              href={`/docs/tutorial-${activeTutorial + 1}.md`}
              className="btn btn-primary text-center"
            >
              View Full Tutorial
            </a>
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-center"
            >
              Official Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}