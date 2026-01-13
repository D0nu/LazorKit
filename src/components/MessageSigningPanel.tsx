'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import './MessageSigning.css';

/**
 * MESSAGE SIGNING PANEL COMPONENT
 * 
 * PURPOSE:
 * This component allows users to cryptographically sign messages using their wallet's private key.
 * 
 * WHAT IS MESSAGE SIGNING:
 * - A way to prove you own a wallet without revealing the private key
 * - Creates a unique signature that can be verified by anyone
 * - Like signing a document, but cryptographically secure
 * 
 * COMMON USE CASES:
 * - Authentication: "Sign this message to prove you own this wallet"
 * - Agreements: Sign terms and conditions
 * - Verification: Prove identity in web3 communities
 * - Timestamps: Create dated attestations
 * - Access Control: Grant permissions without exposing keys
 * 
 * HOW IT WORKS:
 * 1. User enters a message (any text)
 * 2. Clicks "Sign Message"
 * 3. Biometric prompt appears (Face ID/Touch ID)
 * 4. User approves
 * 5. Signature is generated and displayed
 * 6. Signature + message + wallet address can be shared for verification
 * 
 * SECURITY:
 * - Private key never leaves the device
 * - Signature can only be created with the private key
 * - But signature doesn't reveal the private key
 * - Anyone can verify the signature is valid
 */
export function MessageSigningPanel() {
  /**
   * WALLET HOOK - Access to signing functionality
   * 
   * WHAT WE NEED:
   * - signMessage: Function to sign text with private key
   * - isConnected: Check if user is authenticated
   * - smartWalletPubkey: User's wallet address (for display)
   */
  const { signMessage, isConnected, smartWalletPubkey } = useWallet();
  
  /**
   * COMPONENT STATE
   * 
   * Managing all the data and UI states for this component
   */
  
  // The message to be signed
  const [message, setMessage] = useState('Hello from Lazorkit! This message proves I own this wallet.');

  
  
  // The cryptographic signature (result of signing)
  const [signature, setSignature] = useState<string>('');
  
  // Loading state during signing process
  const [isLoading, setIsLoading] = useState(false);
  
  // Error messages
  const [error, setError] = useState<string | boolean>(false);

   const [success, setSuccess] = useState<string | boolean>(false);
  
  // Tracks which field was recently copied (for UI feedback)
  const [copiedField, setCopiedField] = useState<string>('');

  // Character count for the message
  const characterCount = message.length;
  const characterCountClass = characterCount > 500 ? 'text-red-400' : 'text-gray-400';

  /**
   * SAMPLE MESSAGES
   * 
   * WHY PROVIDE SAMPLES:
   * - Helps users understand what to write
   * - Quick testing without typing
   * - Shows different use cases
   * 
   * BEST PRACTICES FOR MESSAGES:
   * - Include context (what you're signing for)
   * - Add timestamps to prevent replay attacks
   * - Be specific about what you're authorizing
   * - Keep it human-readable (no just hashes)
   */
  const sampleMessages = [
    'Hello from Lazorkit! This message proves I own this wallet.',
    'Sign this message to authenticate with our dApp.',
    'I authorize this transaction on ' + new Date().toLocaleDateString(),
    'Verify ownership of wallet: ' + (smartWalletPubkey?.toString().slice(0, 8) || ''),
    'Signing this message to access premium features.'
  ];

  /**
   * SIGN MESSAGE HANDLER
   * 
   * This is the main function that handles the signing process.
   * 
   * FLOW:
   * 1. Validate inputs (wallet connected, message not empty)
   * 2. Set loading state (show spinner)
   * 3. Call signMessage from Lazorkit
   * 4. Browser prompts for biometric authentication
   * 5. User approves with Face ID/Touch ID/Windows Hello
   * 6. Signature is returned
   * 7. Display signature + success message
   * 8. Handle any errors
   */
  const handleSignMessage = async () => {
    /**
     * VALIDATION 1: Check wallet connection
     * 
     * WHY:
     * - Can't sign without a wallet
     * - Prevents cryptic errors
     * - Provides clear user feedback
     */
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    /**
     * VALIDATION 2: Check message not empty
     * 
     * WHY:
     * - Empty messages are meaningless
     * - Wastes user's time (biometric prompt for nothing)
     * - Better to catch early
     */
    if (!message.trim()) {
      setError('Please enter a message to sign');
      return;
    }

    /**
     * VALIDATION 3: Check wallet is properly initialized
     * 
     * EDGE CASE:
     * - Wallet might disconnect mid-session
     * - Or context not properly set up
     * - Rare, but better safe than crashed
     */
    if (!smartWalletPubkey) {
      setError('Wallet not properly initialized');
      return;
    }

    /**
     * START SIGNING PROCESS
     * 
     * UI FEEDBACK:
     * - Show loading spinner
     * - Clear previous results
     * - Reset copy feedback
     */
    setIsLoading(true);
    setError(false);
    setSuccess(false);
    setSignature('');
    setCopiedField('');

    try {

      //adding a delay to show loading state

      await new Promise(resolve => setTimeout(resolve, 500));

      /**
       * CALL SIGN MESSAGE FUNCTION
       * 
       * WHAT HAPPENS INTERNALLY:
       * 
       * 1. MESSAGE PREPARATION:
       *    - Message is converted to bytes
       *    - A standard prefix is added (prevents certain attacks)
       *    - Message is hashed using SHA-256
       * 
       * 2. BIOMETRIC PROMPT:
       *    - Browser shows native biometric UI
       *    - "Authenticate to sign message with wallet"
       *    - User uses Face ID/Touch ID/Windows Hello
       * 
       * 3. SIGNING:
       *    - Private key (stored in passkey) is accessed
       *    - Hash is encrypted with private key
       *    - This creates the signature
       * 
       * 4. RETURN:
       *    - Signature is returned as base58 string
       *    - Same format as Solana uses
       *    - Can be verified by anyone with: message + signature + public key
       * 
       * WHY THIS IS SECURE:
       * - Private key never exposed or transmitted
       * - Signature proves you have the private key
       * - But signature doesn't reveal the private key
       * - Mathematically impossible to forge
       */
     const signed = await signMessage(message);
      
      // Extract signature from result
      if (signed && signed.signature) {
        setSignature(signed.signature);
        setSuccess(`Message signed successfully!`);
      } else {
        setError('Failed to sign message - no signature returned');
      }
  
      
    } catch (err: any) {
      /**
       * ERROR HANDLING
       * 
       * COMMON ERRORS:
       * - User cancelled biometric prompt
       * - Biometric authentication failed
       * - Wallet disconnected during process
       * - Invalid message format (rare)
       * 
       * WHY LOG TO CONSOLE:
       * - Helps developers debug
       * - Error messages might contain useful details
       * - Can see full error object
       */
      console.error('Signing failed:', err);
      setError(err.message || 'Failed to sign message');
    } finally {
      /**
       * CLEANUP
       * 
       * finally block runs regardless of success or failure
       * - Stops loading spinner
       * - Ensures UI returns to normal state
       * - Prevents stuck loading indicators
       */
      setIsLoading(false);
    }
  };

  /**
   * COPY TO CLIPBOARD HELPER
   * 
   * PURPOSE:
   * Copy signature, message, or wallet address to clipboard.
   * 
   * WHY ASYNC:
   * - navigator.clipboard is an async API
   * - Needs user permission on first use
   * - Can fail (need to handle errors)
   * 
   * PARAMETERS:
   * - text: The string to copy
   * - field: Which field this is (for UI feedback)
   * 
   * USER EXPERIENCE:
   * 1. User clicks "Copy" button
   * 2. Text is copied to clipboard
   * 3. Button briefly shows "Copied!" with checkmark
   * 4. After 2 seconds, reverts to "Copy"
   */
  const copyToClipboard = async (text: string, field: string) => {
    try {
      // Modern clipboard API (requires HTTPS or localhost)
      await navigator.clipboard.writeText(text);
      
      // Update UI to show success
      setCopiedField(field);
      
      /**
       * RESET FEEDBACK AFTER DELAY
       * 
       * WHY 2 SECONDS:
       * - Long enough for user to notice
       * - Not so long it's annoying
       * - Standard UX pattern
       */
      setTimeout(() => setCopiedField(''), 2000);
      
    } catch (err) {
      /**
       * ERROR HANDLING
       * 
       * COMMON CAUSES:
       * - Browser doesn't support clipboard API
       * - User denied clipboard permission
       * - Page not served over HTTPS
       * 
       * FALLBACK:
       * - Show alert (not ideal, but works)
       * - Could add manual copy instruction
       */
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  /**
   * SELECT SAMPLE MESSAGE HELPER
   * 
   * WHY:
   * - Quick testing without typing
   * - Shows examples of good messages
   * - Educational for users
   */
  const selectSampleMessage = (sample: string) => {
    setMessage(sample);
  };

  /**
   * CLEAR ALL HELPER
   * 
   * PURPOSE:
   * Reset the form to initial state.
   * 
   * WHEN USEFUL:
   * - After signing, user wants to sign something new
   * - Clear previous results
   * - Fresh start
   */
  const clearAll = () => {
    setMessage('');
    setSignature('');
    setError(false);
    setCopiedField('');
  };

  /**
   * RENDER THE COMPONENT
   * 
   * STRUCTURE:
   * 1. Header with title and clear button
   * 2. Quick sample messages
   * 3. Message input textarea
   * 4. Sign button
   * 5. Error display (if any)
   * 6. Success display with signature details (if signed)
   * 7. Info box explaining message signing
   */
  return (
    <div className="message-signing-panel">
      
      <div className="signing-header">
        <div className="signing-title-section">
          <h2 className="signing-title">Message Signing</h2>
          <p className="signing-subtitle">
            Cryptographically sign messages to prove wallet ownership
          </p>
        </div>
        <button onClick={clearAll} className="clear-button">
          Clear All
        </button>
      </div>

      {/* 
        QUICK MESSAGE SAMPLES SECTION
        
        WHY PROVIDE SAMPLES:
        - Faster testing
        - Educational (shows what good messages look like)
        - Lowers barrier to entry
      */}
        <div className="quick-messages-section">
        <div className="quick-messages-label">Quick Messages:</div>
        <div className="quick-messages-grid">
          {sampleMessages.map((sample, index) => (
            <button
              key={index}
              onClick={() => selectSampleMessage(sample)}
              className="quick-message-btn"
            >
              Sample {index + 1}
            </button>
          ))}
        </div>
      </div>
      {/* MAIN FORM SECTION */}
      <div className="space-y-6">
        
        {/* 
          MESSAGE INPUT
          
          <textarea> vs <input>:
          - textarea allows multiple lines
          - Better for longer messages
          - Auto-resizing with rows={4}
          
          resize-none:
          - Prevents user from dragging to resize
          - Maintains consistent layout
          - rows={4} provides enough space
        */}
        <div className="message-input-section">
        <div className="message-label-row">
          <label className="message-label">Message to Sign *</label>
          <span className={`character-count ${characterCountClass}`}>
            {characterCount} characters
          </span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter any message to sign..."
          className={`message-textarea ${characterCount > 500 ? 'error' : ''}`}
        />
        <div className="message-hint">
          Tip: Include timestamps or specific details to prevent replay attacks
        </div>
      </div>


        {/* 
          SIGN BUTTON
          
          DISABLED WHEN:
          - isLoading: Currently signing (prevents double-submit)
          - !isConnected: Wallet not connected
          - !message.trim(): No message entered
          
          WHY MULTIPLE CONDITIONS:
          - Prevents errors
          - Provides visual feedback
          - Forces proper workflow
        */}
       <div className="sign-button-wrapper">
        <button
          onClick={handleSignMessage}
          disabled={isLoading || !isConnected || !message.trim()}
          className="sign-button"
        >
          {isLoading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing...
            </>
          ) : (
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sign Message with Passkey
            </>
          )}
        </button>
      </div>

        {/* ERROR DISPLAY - Only shows if error exists */}
       {error && (
        <div className="error-message">
          <div className="error-content">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="error-text-wrapper">
              <div className="error-title">Signing Failed</div>
              <div className="error-description">{error.toString()}</div>
            </div>
          </div>
        </div>
      )}

        {/* 
          SUCCESS DISPLAY - Only shows if signature exists
          
          CONTAINS:
          1. Success banner
          2. Grid with 3 copyable fields (address, message, signature)
          3. Link to verification tool
          
          WHY SHOW ALL THREE:
          - Need all three to verify signature
          - Address: who signed it
          - Message: what was signed
          - Signature: proof of signing
        */}
      {signature && (
        <div className="signature-result">
          <div className="signature-header">
            <div className="signature-title">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Message Signed Successfully!
            </div>
            <a
              href="https://www.solanatools.xyz/verify"
              target="_blank"
              rel="noopener noreferrer"
              className="copy-signature-btn"
            >
              Verify Online
            </a>
          </div>
          <div className="signature-content">
            <div className="signature-text">
              <strong>Signature:</strong> {signature}
            </div>
          </div>
        </div>
      )}

        {/* 
          EDUCATIONAL INFO BOX
          
          WHY INCLUDE THIS:
          - Educates users about message signing
          - Explains use cases
          - Builds trust (transparency about what's happening)
          - Helps developers understand the feature
        */}
      <div className="info-section">
        <div className="info-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          About Message Signing
        </div>
        <ul className="info-list">
          <li className="info-item">
            <span className="info-bullet">•</span>
            <span><strong>Non-Repudiation:</strong> Proves you control the private key without revealing it</span>
          </li>
          <li className="info-item">
            <span className="info-bullet">•</span>
            <span><strong>Authentication:</strong> Used by dApps to verify user identity</span>
          </li>
          <li className="info-item">
            <span className="info-bullet">•</span>
            <span><strong>Signing is Free:</strong> No blockchain transaction required</span>
          </li>
          <li className="info-item">
            <span className="info-bullet">•</span>
            <span><strong>Security:</strong> Messages are signed locally, never sent to servers</span>
          </li>
        </ul>
      </div>

      <div className="signature-explanation">
        <div className="explanation-title">How Message Signing Works</div>
        <div className="explanation-text">
          Your message is signed with your wallet's private key using biometric authentication (Face ID/Touch ID/Windows Hello).
          The signature proves you own the wallet without revealing your private key.
        </div>
        <div className="explanation-text">
          Anyone can verify this signature using your wallet address, the original message, and the signature.
        </div>
      </div>
    </div>

    </div>
  );
}













      






      
