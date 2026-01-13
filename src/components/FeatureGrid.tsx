'use client';

import { useState } from 'react';


/**
 * FEATURE GRID COMPONENT
 * 
 * PURPOSE:
 * This is a showcase component that displays Lazorkit's key features
 * in an interactive grid layout.
 * 
 * USER EXPERIENCE:
 * - Hover over a feature card to see code examples
 * - Provides quick visual overview of capabilities
 * - Educational for developers learning the SDK
 * 
 * WHY THIS PATTERN:
 * - Demonstrates features + implementation in one place
 * - Makes documentation more engaging and interactive
 * - Helps developers understand what's possible with Lazorkit
 */
export function FeatureGrid() {
  
  /**
   * FEATURES DATA ARRAY
   * 
   * Each feature object contains:
   * - icon: SVG illustration of the feature
   * - title: Feature name
   * - description: What the feature does and why it matters
   * - codeExample: Real, working code snippet showing how to use it
   * 
   * WHY STRUCTURED THIS WAY:
   * - Separates data from presentation (easy to add/edit features)
   * - Each feature is self-contained
   * - Code examples show ACTUAL usage (not just descriptions)
   */
  const features = [
    {
      // FEATURE 1: PASSKEY AUTHENTICATION
      // The core innovation of Lazorkit - no seed phrases needed
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>,
      title: 'Passkey Authentication',
      description: 'No seed phrases, no browser extensions. Biometric sign in with Face ID, Touch ID, or Windows Hello.',
      // CODE EXAMPLE: Shows the simplest way to connect with passkeys
      // feeMode: 'paymaster' enables gasless transactions from the start
      codeExample: `const { connect } = useWallet();
connect({ feeMode: 'paymaster' });`,
    },
    {
      // FEATURE 2: GASLESS TRANSACTIONS
      // Users don't need SOL to pay for gas - Paymaster covers it
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>,
      title: 'Gasless Transactions',
      description: 'Send SOL or tokens without paying gas fees. Powered by Lazorkit Paymaster.',
      // CODE EXAMPLE: Shows transaction with feeToken option
      // You can choose to pay gas in USDC, SOL, or have paymaster cover it
      codeExample: `const signature = await signAndSendTransaction({
  instructions: [transferInstruction],
  transactionOptions: { feeToken: 'USDC' }
});`,
    },
    {
      // FEATURE 3: BIOMETRIC SUPPORT
      // Passkeys automatically use device biometrics - no extra setup
      icon:  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>,
      title: 'Biometric Support',
      description: 'Built-in support for Face ID, Touch ID, and Android biometric authentication.',
      // CODE EXAMPLE: Shows that biometrics work automatically
      // No special configuration or additional libraries needed
      codeExample: `// No extra code needed!
// Passkeys automatically use device biometrics`,
    },
    {
      // FEATURE 4: CROSS-DEVICE SYNC
      // Passkeys sync via iCloud (iOS/Mac) or Google Password Manager (Android/Chrome)
      icon: '',
      title: 'Cross-Device Sync',
      description: 'Access your wallet from any device. Passkeys sync via iCloud or Google Password Manager.',
      // CODE EXAMPLE: Sync happens automatically through OS-level features
      // Users can sign in on phone, then seamlessly use laptop without re-setup
      codeExample: `const wallet = await connect({
  feeMode: 'paymaster',
  // Auto-syncs across devices
});`,
    },
    {
      // FEATURE 5: SMART WALLETS
      // Advanced feature: Programmable wallets with custom rules and permissions
      icon: '🔧',
      title: 'Smart Wallets',
      description: 'Programmable wallet abstraction with session keys and transaction policies.',
      // CODE EXAMPLE: Shows advanced smart wallet configuration
      // sessionKeys: Allow temporary access without full wallet control
      // transactionLimit: Set spending limits for security
      codeExample: `const wallet = new SmartWallet({
  sessionKeys: true,
  transactionLimit: '5 SOL'
});`,
    },
    {
      // FEATURE 6: EASY INTEGRATION
      // Developer experience - fast setup, TypeScript support, React hooks
      icon: '📦',
      title: 'Easy Integration',
      description: 'Get started in minutes with React hooks and full TypeScript support.',
      // CODE EXAMPLE: Just one npm install and you're ready
      // SDK provides typed hooks out of the box
      codeExample: `npm install @lazorkit/wallet
// Ready to use`,
    },
  ];

  /**
   * ACTIVE FEATURE STATE
   * 
   * Tracks which feature card is currently being hovered.
   * 
   * WHY: number | null
   * - number: Index of the active feature (0-5)
   * - null: No feature is active (no hover)
   * 
   * INTERACTION FLOW:
   * 1. User hovers over card -> setActiveFeature(index)
   * 2. Code example slides into view for that feature
   * 3. User moves mouse away -> setActiveFeature(null)
   * 4. Code example hides
   */
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  /**
   * RENDER THE GRID
   * 
   * STRUCTURE:
   * - Outer div: Grid container with responsive columns
   * - Map through features array to create cards
   * - Each card shows icon, title, description
   * - On hover, code example appears below
   * 
   * CSS CLASSES:
   * - feature-grid: Sets up the grid layout
   * - feature-card: Individual card styling
   * - active: Applied when card is hovered (triggers animation)
   */
  return (
    <div className="feature-grid">
      {features.map((feature, index) => {
        // Check if THIS card is the one being hovered
        const isActive = activeFeature === index;

        return (
          <div
            key={index}
            className={`feature-card ${isActive ? 'active' : ''}`}
            
            // MOUSE EVENTS: Track hover state
            // onMouseEnter: Fires when mouse enters the card area
            onMouseEnter={() => setActiveFeature(index)}
            // onMouseLeave: Fires when mouse leaves the card area
            onMouseLeave={() => setActiveFeature(null)}
          >
            {/* CARD HEADER - Always visible */}
            <div className="feature-card-header">
              {/* Icon section */}
              <div className="feature-icon">
                {feature.icon}
              </div>
              
              {/* Text content */}
              <div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>

            {/* 
              CODE EXAMPLE SECTION - Only shows when hovered
              
              CONDITIONAL RENDERING:
              {isActive && <div>...</div>}
              
              This is React's way of saying:
              "Only render this div if isActive is true"
              
              WHY: Keeps DOM clean and improves performance
              Code blocks only exist in DOM when needed
            */}
            {isActive && (
              <div className="feature-code">
                {/* Label to indicate this is example code */}
                <div className="code-label">Example</div>
                
                {/* 
                  CODE BLOCK
                  
                  <pre>: Preserves whitespace and formatting
                  This makes code readable with proper indentation
                  
                  CSS class 'code-block' adds:
                  - Syntax highlighting colors
                  - Dark background
                  - Monospace font
                  - Horizontal scroll if needed
                */}
                <pre className="code-block">{feature.codeExample}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * USAGE IN PARENT COMPONENT:
 * 
 * Simply import and use:
 * 
 * import { FeatureGrid } from './components/FeatureGrid';
 * 
 * function FeaturesSection() {
 *   return (
 *     <section>
 *       <h2>Key Features</h2>
 *       <FeatureGrid />
 *     </section>
 *   );
 * }
 * 
 * The component handles all interactivity internally
 * No props needed - fully self-contained
 */