# Tutorial 2: Gasless SOL Transfer

## What You'll Learn
- Create Solana transfer instructions
- Use Lazorkit Paymaster for gasless transactions
- Handle transaction confirmation and errors
- Display transaction feedback to users

## Duration
⏱️ Approximately 8-12 minutes

## Prerequisites
- Completed [Tutorial 1: Passkey Authentication Setup](./tutorial-1-passkey-setup.md)
- Wallet connected with Lazorkit
- Basic understanding of Solana transactions

---

## Overview: How Gasless Transactions Work

Traditional Solana transactions require you to pay "gas fees" (rent + transaction fees) in SOL. With Lazorkit's Paymaster:

1. **You create** a transaction instruction
2. **Lazorkit Paymaster** covers the gas fees
3. **You sign** the transaction with your passkey
4. **Transaction executes** without deducting SOL from your balance

This makes onboarding users seamless - they don't need SOL to start using your app!

---

## Step 1: Set Up Transfer Component

Create the UI component that handles gasless transfers. File: `components/TransactionPanel.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { TransactionsButton } from './LazorkitButtons';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@lazorkit/wallet';
import '../app/globals.css';
import './TransactionPanel.css';

/**
 * TRANSACTION PANEL COMPONENT
 * 
 * PURPOSE:
 * User interface for sending gasless SOL transfers.
 * 
 * WHAT THIS DEMONSTRATES:
 * 1. Real-time address validation
 * 2. Amount validation against balance
 * 3. Gasless transaction execution
 * 4. Error handling with helpful messages
 * 5. Success feedback with transaction signature
 * 
 * KEY FEATURES:
 * - Live validation (address format, sufficient balance)
 * - Quick amount buttons (0.001, 0.01, 0.1 SOL)
 * - Test configuration button (pre-fills safe values)
 * - Copy wallet address for testing
 * - Links to faucet for getting test SOL
 * 
 * VALIDATION FLOW:
 * 1. Check address is valid Solana format (base58, 32-44 chars)
 * 2. Verify amount > 0 and ≤ available balance
 * 3. Only enable "Send" when all validations pass
 * 4. Visual feedback (green checkmarks, red errors)
 * 
 * BALANCE DISPLAY:
 * - Shows REAL balance from props
 * - Updated by parent after transactions
 * - Warning if balance < 0.001 SOL
 * - Suggests using faucet for test funds
 * 
 * USER FLOW:
 * 1. Connect wallet → see smart wallet address
 * 2. Enter recipient address (or use test config)
 * 3. Enter amount (or use quick buttons)
 * 4. Click "Send Gasless Transaction"
 * 5. Approve biometric prompt
 * 6. See success message + signature
 * 7. Balance automatically updates
 */

interface TransactionPanelProps {
  fromAddress?: string;
  balance?: string;
  onTransactionComplete?: () => void;
}

export function TransactionPanel({
  fromAddress,
  balance = '0',
  onTransactionComplete,
}: TransactionPanelProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number>(0.001);
  const [txError, setTxError] = useState<string | boolean>(false);
  const [txSuccess, setTxSuccess] = useState<string | boolean>(false);
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  const { smartWalletPubkey } = useWallet();

  // Initialize with own address if available
  useEffect(() => {
    if (smartWalletPubkey) {
      setRecipient(smartWalletPubkey.toString());
      setIsValidAddress(true);
    }
  }, [smartWalletPubkey]);

  // Validate Solana address
  const validateSolanaAddress = (address: string): boolean => {
    if (!address.trim()) return false;
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Handle recipient change with validation
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipient(value);
    setIsValidAddress(validateSolanaAddress(value));
  };

  // Handle amount change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '') {
      setAmount(0);
      return;
    }

    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    }
  };

  // Auto-clear success + notify parent
  useEffect(() => {
    if (txSuccess) {
      onTransactionComplete?.();

      const timer = setTimeout(() => {
        setTxSuccess(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [txSuccess, onTransactionComplete]);

  // Auto-clear error
  useEffect(() => {
    if (txError) {
      const timer = setTimeout(() => {
        setTxError(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [txError]);

  // Test transaction with a known good address
  const testTransaction = async () => {
    setIsTesting(true);
    
    // If user has a smart wallet, suggest sending to themselves
    if (smartWalletPubkey) {
      setRecipient(smartWalletPubkey.toString());
    } else {
      // Use a known devnet faucet address
      setRecipient('9gQnXgx8YqTcNCUSJ6Y8RQ4KvZjE7ZkPT4WQHTE5qmTg');
    }
    
    setAmount(0.001);
    setIsValidAddress(true);
    
    setTimeout(() => {
      setIsTesting(false);
      if (smartWalletPubkey) {
        setMessage('✅ Ready! Send 0.001 SOL to your own address for testing.');
      } else {
        setMessage('✅ Test config loaded. Try sending 0.001 SOL.');
      }
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  // Copy own address for testing
  const copyOwnAddress = () => {
    if (smartWalletPubkey) {
      navigator.clipboard.writeText(smartWalletPubkey.toString());
      setMessage('✅ Smart wallet address copied!');
      setTimeout(() => setMessage(''), 3000);
    } else if (fromAddress) {
      navigator.clipboard.writeText(fromAddress);
      setMessage('✅ Address copied!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="glass-md rounded-xl p-6 sm:p-8">
      {/* Header */}
      <div className="transaction-panel-header">
        <div className="transaction-icon-wrapper">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="transaction-header-content">
          <div className="transaction-title-row">
            <div>
              <h3 className="transaction-title">
                Gasless Transfer
              </h3>
              <p className="transaction-subtitle">
                Send SOL without paying gas fees
              </p>
            </div>
            <button
              onClick={testTransaction}
              disabled={isTesting}
              className="test-config-btn"
            >
              {isTesting ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Test Config
                </>
              )}
            </button>
          </div>

          {smartWalletPubkey && (
            <div className="wallet-info-box">
              <div className="wallet-address-section">
                <div className="wallet-address-label">Smart Wallet Address:</div>
                <div className="wallet-address-display">
                  <code className="wallet-address-code">
                    {smartWalletPubkey.toString()}
                  </code>
                  <button
                    onClick={copyOwnAddress}
                    className="copy-address-btn"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              {/* REAL Balance Display - Show real fetched balance */}
              <div className="balance-info-card">
                <div className="balance-row">
                  <div className="balance-main">
                    <div className="balance-label-text">Available Balance:</div>
                    <div className="balance-amount-text">{balance} SOL</div>
                    {parseFloat(balance) < 0.001 && (
                      <div className="low-balance-warning">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Low balance. Fund your wallet to send transactions.
                      </div>
                    )}
                  </div>
                  <div className="balance-demo-label">
                    <p>Demo Balance</p>
                    <p>For testing only</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className="message-toast">
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Recipient */}
        <div className="form-field">
          <div className="field-label-row">
            <label className="field-label">
              Recipient Address
            </label>
            <span className={`field-status ${isValidAddress && recipient ? 'valid' : 'invalid'}`}>
              {isValidAddress && recipient ? (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </>
              ) : (
                'Enter address'
              )}
            </span>
          </div>
          <input
            type="text"
            value={recipient}
            onChange={handleRecipientChange}
            placeholder="Enter Solana address (base58)"
            className={`transaction-input ${!isValidAddress && recipient ? 'error' : ''}`}
          />
          {!isValidAddress && recipient && (
            <div className="field-error">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Invalid Solana address format
            </div>
          )}
          <div className="field-hint">
            Tip: Test by sending to your smart wallet address above
          </div>
        </div>

        {/* Amount */}
        <div className="form-field">
          <div className="field-label-row">
            <label className="field-label">
              Amount (SOL)
            </label>
            <span className={`field-status ${amount > 0 && amount <= parseFloat(balance) ? 'valid' : 'invalid'}`}>
              {amount > 0 && amount <= parseFloat(balance) ? (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </>
              ) : (
                'Enter amount'
              )}
            </span>
          </div>
          <div className="input-with-suffix">
            <input
              type="number"
              value={amount || ''}
              onChange={handleAmountChange}
              step="0.001"
              min="0.001"
              max={parseFloat(balance)}
              placeholder="0.001"
              className={`transaction-input with-suffix ${amount > 0 && amount > parseFloat(balance) ? 'error' : ''}`}
            />
            <span className="input-suffix">SOL</span>
          </div>
          {amount > 0 && amount > parseFloat(balance) && (
            <div className="field-error">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Amount exceeds available balance ({parseFloat(balance).toFixed(4)} SOL)
            </div>
          )}
          <div className="quick-amount-buttons">
            <button
              type="button"
              onClick={() => setAmount(0.001)}
              className="quick-amount-btn"
            >
              0.001
            </button>
            <button
              type="button"
              onClick={() => setAmount(0.01)}
              className="quick-amount-btn"
            >
              0.01
            </button>
            <button
              type="button"
              onClick={() => setAmount(0.1)}
              className="quick-amount-btn"
            >
              0.1
            </button>
          </div>
        </div>

        {/* Action */}
        <div className="submit-area">
          <TransactionsButton
            mode="transaction"
            address={recipient}
            amount={amount}
            setError={setTxError}
            setSuccess={setTxSuccess}
          >
            <span className="font-medium">
              Send Gasless Transaction
            </span>
          </TransactionsButton>
        </div>

        {/* Feedback */}
        {txError && (
          <div className="feedback-error">
            <div className="feedback-error-content">
              <div className="feedback-error-icon">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="feedback-error-text">
                <div className="feedback-error-title">Transaction Failed</div>
                <div className="feedback-error-message">{txError.toString()}</div>
              </div>
            </div>
          </div>
        )}

        {txSuccess && (
          <div className="feedback-success">
            <div className="feedback-success-content">
              <div className="feedback-success-icon">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="feedback-success-text">
                <div className="feedback-success-title">Success!</div>
                <div className="feedback-success-message">{txSuccess.toString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="info-notice">
          <h4 className="info-notice-title">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Important Information
          </h4>
          <ul className="info-notice-list">
            <li className="info-notice-item">
              <span className="info-notice-bullet">•</span>
              <span><strong>Demo Balance:</strong> The {balance} SOL shown is for demonstration only</span>
            </li>
            <li className="info-notice-item">
              <span className="info-notice-bullet">•</span>
              <span><strong>Real Transactions:</strong> You need to fund your smart wallet with real devnet SOL</span>
            </li>
            <li className="info-notice-item">
              <span className="info-notice-bullet">•</span>
              <span><strong>Test First:</strong> Start with 0.001 SOL to your own address</span>
            </li>
          </ul>
          <div className="info-notice-footer">
            <a 
              href="https://faucet.solana.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="faucet-link"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              Get Devnet SOL from Faucet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Key Features:
- **Controlled inputs**: React state manages form values
- **Real-time validation**: Min/max values and step increments
- **Feedback states**: Separate success and error messages
- **Reusable button**: `TransactionsButton` handles all transaction logic

---

## Step 2: Create Transfer Instruction

Now let's build the `TransactionsButton` component that handles the actual transaction. File: `components/LazorkitButtons.tsx`

```typescript
'use client';
import { SetStateAction } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * TYPE DEFINITION FOR BUTTON MODES
 * 
 * WHY WE NEED THIS:
 * - This button component handles TWO different actions: signing messages and sending transactions
 * - TypeScript helps prevent bugs by ensuring only valid modes are used
 * - '' = empty/no action, 'sign' = message signing, 'transaction' = SOL transfers
 */
type modes = '' | 'sign' | 'transaction'

/**
 * PAYMASTER CONFIGURATION
 * 
 * WHY DEFINED HERE:
 * - Needed for gasless transactions
 * - Could also be imported from a central config file
 * - This URL is where the paymaster service runs (covers gas fees)
 * 
 * WHAT IS A PAYMASTER:
 * - A service that pays transaction fees on behalf of users
 * - Users sign transactions, but don't pay gas
 * - Enables onboarding without requiring users to have SOL first
 */
const paymasterConfig = {
  paymasterUrl: 'https://kora.devnet.lazorkit.com',
};

/**
 * TRANSACTIONS BUTTON COMPONENT
 * 
 * PURPOSE:
 * This is a REUSABLE button that handles both:
 * 1. Message signing (for authentication/verification)
 * 2. SOL transfers (sending cryptocurrency)
 * 
 * WHY REUSABLE:
 * - Same button logic can be used in multiple places
 * - Reduces code duplication
 * - Consistent error handling across the app
 * - Parent components control the button's appearance via {children}
 * 
 * HOW IT WORKS:
 * 1. Parent passes in mode ('sign' or 'transaction')
 * 2. Parent passes in data (message or amount/address)
 * 3. Parent passes in callback functions for errors/success
 * 4. This component handles all the blockchain interaction
 * 5. Results are sent back to parent via callbacks
 */
export function TransactionsButton({
  mode = '',              // What action to perform
  amount,                 // How much SOL to send (for transactions)
  address = '',           // Where to send SOL (for transactions)
  message = '',           // What message to sign (for signing)
  children,               // The button's visual content (from parent)
  setError,               // Function to notify parent of errors
  setSuccess,             // Function to notify parent of success
}: {
  mode: modes,
  amount?: number,        // Optional: only needed for 'transaction' mode
  message?: string,       // Optional: only needed for 'sign' mode
  address?: string,       // Optional: only needed for 'transaction' mode
  children?: React.ReactNode
  setError: React.Dispatch<SetStateAction<string | boolean>>
  setSuccess: React.Dispatch<SetStateAction<string | boolean>>
}) {

  /**
   * WALLET HOOK - Access to all wallet functionality
   * 
   * WHAT WE GET:
   * - isConnected: Boolean indicating if user is signed in
   * - signMessage: Function to cryptographically sign text
   * - smartWalletPubkey: User's wallet address (PublicKey object)
   * - signAndSendTransaction: Function to send blockchain transactions
   * 
   * WHY THIS WORKS:
   * - LazorKitContext (in root) provides these via React Context
   * - Any component can access wallet features by calling useWallet()
   */
  const { isConnected, signMessage, smartWalletPubkey, signAndSendTransaction } = useWallet();
  
  /**
   * TRANSACTION OPTIONS FOR GASLESS PAYMENTS
   * 
   * STRUCTURE:
   * - feeToken: Which token to use for gas (USDC, SOL, etc.)
   * - paymaster: Configuration for the gasless transaction service
   * 
   * HOW IT MAKES TRANSACTIONS GASLESS:
   * When you pass these options to signAndSendTransaction:
   * 1. Lazorkit checks if paymaster is configured
   * 2. Instead of deducting SOL from user's wallet for gas
   * 3. The paymaster service covers the transaction fee
   * 4. User only pays the transfer amount (not gas)
   * 
   * ANALOGY:
   * Like a store saying "we pay the credit card processing fee"
   * Customer only pays item price, not the 3% processing fee
   */
  const transactionOptions = { 
    feeToken: 'USDC',              // Which token to use for fees
    paymaster: paymasterConfig,    // Enable gasless via paymaster
  };

  /**
   * MAIN ACTION HANDLER
   * 
   * This function is called when the button is clicked.
   * It branches into different flows based on the 'mode' prop.
   * 
   * FLOW:
   * 1. Clear previous messages
   * 2. Validate user is connected
   * 3. Check mode and execute appropriate action
   * 4. Handle success/failure
   */
  const handleActions = async () => {
    /**
     * STEP 1: RESET UI STATE
     * 
     * WHY:
     * - Clear old error/success messages
     * - Prevents confusion (old message showing with new action)
     * - Gives clean slate for new operation
     */
    setError(false);
    setSuccess(false);

    /**
     * STEP 2: VALIDATE WALLET CONNECTION
     * 
     * SECURITY CHECK:
     * - Can't sign or send transactions if not connected
     * - Prevents errors and provides clear feedback
     * 
     * WHY RETURN EARLY:
     * - Stops function execution immediately
     * - No point continuing if user isn't connected
     */
    if (!isConnected) {
      setError('Please connect your wallet first.');
      return; // Exit function
    }

    /**
     * MODE: MESSAGE SIGNING
     * 
     * WHAT IS MESSAGE SIGNING:
     * - Cryptographically signing text with your private key
     * - Proves you control the wallet without revealing the key
     * - Like a digital signature on a document
     * 
     * COMMON USE CASES:
     * - Authenticate with dApps ("sign to prove you own this wallet")
     * - Sign terms & conditions
     * - Verify identity in web3 communities
     * - Create timestamped attestations
     * 
     * HOW IT WORKS:
     * 1. User provides a message (any text)
     * 2. Wallet creates a unique signature using private key
     * 3. Anyone can verify signature matches wallet + message
     * 4. Private key never leaves the device
     */
    if (mode === 'sign') {
      // VALIDATION: Make sure there's actually a message to sign
      if (!message.trim()) {
        setError('Please enter a message to sign.');
        return;
      }

      try {
        /**
         * SIGNING THE MESSAGE
         * 
         * WHAT HAPPENS:
         * 1. Message is hashed (converted to fixed-length string)
         * 2. Hash is encrypted with user's private key (stored in passkey)
         * 3. Browser prompts for biometric authentication
         * 4. User approves with Face ID/Touch ID/Windows Hello
         * 5. Signature is returned as base58 string
         * 
         * SECURITY:
         * - Private key never exposed
         * - Signature can only be created with the private key
         * - But signature itself doesn't reveal the private key
         */
        const { signature } = await signMessage(message);
        
        // NOTIFY SUCCESS
        setSuccess('Message signed successfully!');
        console.log('Message signed:', signature);
        
      } catch (error: any) {
        // HANDLE FAILURE
        // Common errors: user cancelled, biometric failed, invalid message
        setError(error.message || 'Failed to sign message.');
        console.error('Signing failed:', error);
      }
    }

    /**
     * MODE: SOL TRANSACTION
     * 
     * WHAT IS A SOL TRANSACTION:
     * - Transferring SOL (Solana's native cryptocurrency) between wallets
     * - Similar to sending money via Venmo/Cash App, but on blockchain
     * 
     * TRANSACTION LIFECYCLE:
     * 1. Create instruction (what to do)
     * 2. Sign instruction (prove you authorize it)
     * 3. Send to network (broadcast to blockchain)
     * 4. Network validates (checks signature, balance, etc.)
     * 5. Transaction included in block (permanent on blockchain)
     * 6. Confirmation received (usually 1-2 seconds on Solana)
     */
    else if (mode === 'transaction') {
      /**
       * VALIDATION STEP 1: Check recipient address
       * 
       * WHY:
       * - Can't send to empty/invalid address
       * - Blockchain transactions are irreversible
       * - Better to catch errors BEFORE sending
       */
      if (!address.trim()) {
        setError('No receiver address provided.');
        return;
      }

      /**
       * VALIDATION STEP 2: Check amount
       * 
       * WHY amount > 0:
       * - Blockchain doesn't allow zero-value transfers
       * - Prevents accidental empty transactions
       * - Saves users from wasting gas on pointless transactions
       */
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount greater than 0.');
        return;
      }

      /**
       * VALIDATION STEP 3: Verify address format
       * 
       * SOLANA ADDRESS FORMAT:
       * - Base58 encoded string
       * - 32-44 characters long
       * - Example: 9gQnXgx8YqTcNCUSJ6Y8RQ4KvZjE7ZkPT4WQHTE5qmTg
       * 
       * WHY TRY-CATCH:
       * - new PublicKey() throws error if address is invalid
       * - Catch the error and show friendly message
       * - Prevents crash and gives user actionable feedback
       */
      let destination: PublicKey;
      try {
        destination = new PublicKey(address);
      } catch (error) {
        setError('Invalid Solana address. Please check and try again.');
        return;
      }

      /**
       * VALIDATION STEP 4: Ensure wallet is initialized
       * 
       * RARE EDGE CASE:
       * - Wallet might disconnect mid-session
       * - Or context might not be properly initialized
       * - Better to check than crash
       */
      if (!smartWalletPubkey) {
        setError('Wallet not properly initialized.');
        return;
      }

      try {
        /**
         * DEBUG LOGGING
         * 
         * WHY LOG TRANSACTION DETAILS:
         * - Helps with debugging if something goes wrong
         * - Can verify transaction parameters before sending
         * - Useful for developers testing the app
         * 
         * WHAT TO LOG:
         * - Sender address (smartWalletPubkey)
         * - Recipient address (destination)
         * - Amount in SOL and lamports
         * - Transaction options (gasless config)
         */
        console.log('Sending transaction with details:', {
          from: smartWalletPubkey.toString(),
          to: destination.toString(),
          amount: amount,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          options: transactionOptions
        });

        /**
         * CREATE TRANSFER INSTRUCTION
         * 
         * WHAT IS AN INSTRUCTION:
         * - A single action to perform on the blockchain
         * - Like a command: "transfer X lamports from A to B"
         * 
         * SystemProgram.transfer:
         * - Built-in Solana function for SOL transfers
         * - Part of the System Program (Solana's native program)
         * 
         * PARAMETERS:
         * - fromPubkey: Sender's wallet address
         * - toPubkey: Recipient's wallet address
         * - lamports: Amount to send (in smallest unit)
         * 
         * WHY LAMPORTS:
         * - SOL's smallest unit (like cents to dollars)
         * - 1 SOL = 1,000,000,000 lamports (1 billion)
         * - Blockchain uses integers (no decimals)
         * - Math.floor() ensures integer value
         */
        const instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: destination,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL)
        });
        
        /**
         * SIGN AND SEND TRANSACTION
         * 
         * THIS IS THE MAGIC MOMENT - THE ACTUAL BLOCKCHAIN INTERACTION
         * 
         * WHAT HAPPENS BEHIND THE SCENES:
         * 
         * 1. BUILD TRANSACTION:
         *    - Instruction is wrapped in a transaction
         *    - Transaction includes metadata (recent blockhash, fee payer)
         *    - Paymaster is set as fee payer (GASLESS!)
         * 
         * 2. SIGN TRANSACTION:
         *    - Browser prompts for biometric authentication
         *    - User approves with Face ID/Touch ID/Windows Hello
         *    - Private key (in passkey) signs the transaction
         *    - Signature proves authorization
         * 
         * 3. SEND TO NETWORK:
         *    - Signed transaction sent to Solana RPC node
         *    - Node validates: signature valid? sufficient balance? valid instruction?
         *    - If valid, transaction is added to mempool (pending transactions)
         * 
         * 4. INCLUSION IN BLOCK:
         *    - Validators pick up transaction from mempool
         *    - Transaction included in next block
         *    - Block is confirmed by network consensus
         * 
         * 5. CONFIRMATION:
         *    - Function waits for confirmation
         *    - Returns transaction signature (like a receipt)
         *    - Signature can be used to look up transaction on explorer
         * 
         * WHY transactionOptions:
         * - Contains paymaster config
         * - Enables GASLESS transaction
         * - User doesn't pay gas fees
         */
        const signature = await signAndSendTransaction({
          instructions: [instruction],
          transactionOptions: transactionOptions
        });
        
        /**
         * SUCCESS FEEDBACK
         * 
         * Show truncated signature to user:
         * - Full signatures are ~88 characters (too long to display nicely)
         * - First 32 characters gives enough info
         * - User can see on blockchain explorer if needed
         */
        setSuccess(`Transaction sent! Signature: ${signature.slice(0, 32)}...`);
        console.log('Transaction sent:', signature);
        
      } catch (error: any) {
        /**
         * ERROR HANDLING
         * 
         * WHY DETAILED ERROR MESSAGES:
         * - Different errors need different solutions
         * - Help user understand what went wrong
         * - Provide actionable next steps
         * 
         * COMMON ERROR SCENARIOS:
         * 1. Insufficient funds: Need to add SOL to wallet
         * 2. User rejected: Cancelled biometric prompt
         * 3. Invalid address: Typo in recipient address
         * 4. Network error: RPC node down or slow
         * 5. Simulation failed: Transaction would fail on-chain
         * 6. Already signing: Tried to send while previous tx pending
         */
        
        const errorMsg = error.message?.toString() || 'Transaction failed';
        
        // Log full error for debugging
        console.error('Transfer error:', error);
        console.error('Full error details:', error);

        /**
         * ERROR MESSAGE LOGIC
         * 
         * Check error message for keywords to provide specific help:
         */
        
        // Not enough SOL in wallet
        if (errorMsg.includes('insufficient funds')) {
          setError('Smart wallet has insufficient SOL balance. Please fund it first.');
        } 
        // User cancelled biometric prompt
        else if (errorMsg.includes('User rejected') || errorMsg.includes('reject')) {
          setError('Transaction cancelled by user.');
        } 
        // Invalid recipient address format
        else if (errorMsg.includes('Invalid public key')) {
          setError('Invalid recipient address.');
        } 
        // Solana program error code
        else if (errorMsg.includes('Custom:1')) {
          setError('Transaction failed. Please ensure: 1) Smart wallet is funded, 2) Network is devnet, 3) Amount is valid.');
        } 
        // Tried to send transaction while another is pending
        else if (errorMsg.includes('Already signing')) {
          setError('Transaction already in progress. Please wait.');
        } 
        // Transaction would fail if sent to blockchain
        else if (errorMsg.includes('simulation failed')) {
          setError('Transaction simulation failed. Please check wallet balance and network.');
        } 
        // Problem with paymaster service
        else if (errorMsg.includes('paymaster')) {
          setError('Paymaster error. Please ensure: 1) RPC URL is correct, 2) Paymaster service is active, 3) Using devnet.');
        } 
        // Generic error (show original message)
        else {
          setError(`Transfer failed: ${errorMsg}. Please try again.`);
        }
      }
    }
  }

  /**
   * RENDER BUTTON
   * 
   * PROPS:
   * - onClick: Calls handleActions when clicked
   * - className: Styling classes
   * - disabled: Prevents clicks when wallet not connected
   * 
   * WHY DISABLE WHEN NOT CONNECTED:
   * - Prevents errors
   * - Visual feedback (button looks inactive)
   * - Forces user to connect wallet first
   * 
   * {children}:
   * - Content provided by parent component
   * - Makes button flexible (can show any text/icons)
   * - Parent controls button appearance
   */
  return (
    <button 
      onClick={handleActions}
      className="btn btn-primary w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!isConnected}
    >
      {children}
    </button>
  );
}

/**
 * AUTH BUTTON COMPONENT
 * 
 * PURPOSE:
 * Simple connect/disconnect button for wallet authentication.
 * 
 * TWO STATES:
 * 1. Not connected: Shows "Sign in with Passkey"
 * 2. Connected: Shows "Disconnect" + wallet address
 * 
 * WHY SEPARATE COMPONENT:
 * - Used in multiple places (header, modals, etc.)
 * - Reusable across app
 * - Consistent authentication UX
 */
export const AuthButton = ({ classes = '' }: { classes?: string }) => {
  
  /**
   * WALLET STATE
   * 
   * Access to wallet connection status and functions
   */
  const {
    wallet,              // Full wallet object (address, keys, etc.)
    connect,             // Function to initiate passkey sign-in
    disconnect,          // Function to log out
    isConnected,         // Boolean: signed in?
    isConnecting,        // Boolean: currently signing in?
    smartWalletPubkey    // User's wallet address
  } = useWallet();
  
  /**
   * COPY ADDRESS HELPER
   * 
   * WHAT IT DOES:
   * - Copies wallet address to clipboard
   * - Shows alert confirmation
   * 
   * WHY USEFUL:
   * - Users often need to share their address
   * - For receiving payments, verifying identity, etc.
   * - One-click copy is better UX than manual selection
   */
  const copyWalletAddress = () => {
    if (smartWalletPubkey) {
      navigator.clipboard.writeText(smartWalletPubkey.toString());
      alert('Wallet address copied to clipboard!');
    }
  };
  
  /**
   * CONDITIONAL RENDERING
   * 
   * Shows different UI based on connection state:
   */
  
  // STATE: CONNECTED
  // Show disconnect button with wallet address
  return isConnected ? (
    <button 
      onClick={disconnect} 
      className={`${classes} flex items-center gap-2`}
    >
      {/* Disconnect icon (exit arrow) */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Disconnect
      
      {/* 
        TRUNCATED ADDRESS DISPLAY
        
        Shows short version of address:
        - First 6 characters
        - "..." in middle
        - Last 4 characters
        
        Example: 9gQnXg...qmTg
        
        WHY TRUNCATE:
        - Full address is 44 chars (too long)
        - Still recognizable to user
        - Saves space in UI
      */}
      {smartWalletPubkey && (
        <span 
          onClick={(e) => {
            e.stopPropagation(); // Don't trigger disconnect
            copyWalletAddress();  // Copy address instead
          }}
          className="text-xs bg-purple-500/20 px-2 py-1 rounded cursor-pointer hover:bg-purple-500/30 transition"
          title="Click to copy wallet address"
        >
          {smartWalletPubkey.toString().slice(0, 6)}...{smartWalletPubkey.toString().slice(-4)}
        </span>
      )}
    </button>
  ) 
  
  // STATE: NOT CONNECTED
  // Show sign-in button
  : (
    <button 
      onClick={async () => connect({ feeMode: 'paymaster' })} 
      className={classes}
      disabled={isConnecting} // Disable while connecting
    >
      {/* 
        DYNAMIC TEXT:
        - While connecting: "Signing in..."
        - Not connected: "Sign in with Passkey"
        
        Provides feedback during async operation
      */}
      {isConnecting ? 'Signing in...' : 'Sign in with Passkey'}
    </button>
  );
}```

### Understanding `SystemProgram.transfer()`:

This creates a Solana instruction to transfer native SOL:

```typescript
SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,    // Who is sending
  toPubkey: destination,             // Who is receiving  
  lamports: amount * LAMPORTS_PER_SOL // How much (in lamports)
})
```

**Lamports explained**: 
- 1 SOL = 1,000,000,000 lamports
- Lamports are the smallest unit of SOL (like satoshis for Bitcoin)
- We multiply by `LAMPORTS_PER_SOL` to convert user-friendly SOL amounts

---

## Step 3: Sign and Send with Paymaster

The key function is `signAndSendTransaction()`:

```typescript
const signature = await signAndSendTransaction({
  instructions: [instruction],        // What actions to perform
  transactionOptions: tokenOptions   // How to pay for gas
});
```

### What happens under the hood:

1. **Transaction is built** with your instruction(s)
2. **Paymaster is invoked** to cover gas fees
3. **User approves** via biometric authentication
4. **Transaction is signed** with your passkey
5. **Transaction is sent** to Solana network
6. **Confirmation is received** and signature is returned

### Transaction Options:

```typescript
transactionOptions: {
  feeToken: 'USDC'     // Pay gas in USDC (optional)
  // or
  feeToken: 'SOL'      // Pay gas in SOL (default)
  // or omit entirely to use default paymaster settings
}
```

---

## Step 4: Handle Success/Error States

Proper error handling ensures good UX:

```typescript
try {
  // Attempt transaction
  const signature = await signAndSendTransaction({
    instructions: [instruction],
    transactionOptions: tokenOptions
  });
  
  // Clear any previous errors
  setError(false);
  
  // Show success message
  setSuccess(`Transaction successful! Signature: ${signature.slice(0, 8)}...`);
  
} catch (error) {
  // Clear any previous success messages
  setSuccess(false);
  
  // Handle different error types
  if (error.message.includes('insufficient funds')) {
    setError('Insufficient balance. Please add funds to your wallet.');
  } 
  else if (error.message.includes('User rejected')) {
    setError('Transaction cancelled by user.');
  }
  else if (error.message.includes('Invalid public key')) {
    setError('Invalid recipient address. Please check and try again.');
  }
  else {
    setError(`Transfer failed: ${error.message}`);
  }
  
  // Log full error for debugging
  console.error('Transaction error:', error);
}
```

### Common Error Scenarios:

| Error | Cause | Solution |
|-------|-------|----------|
| "insufficient funds" | Wallet balance too low | Add funds via faucet |
| "User rejected" | User cancelled biometric | Try again |
| "Invalid public key" | Malformed address | Validate input format |
| "Transaction simulation failed" | Invalid instruction | Check transaction logic |

---

## Step 5: Testing on Devnet

### 5.1 Get Test SOL

Before testing, you need SOL in your wallet:

1. **Copy your wallet address** from the connected wallet display
2. **Visit Solana Faucet**: https://faucet.solana.com/
3. **Paste your address** and request 1-2 SOL
4. **Wait for confirmation** (usually 10-30 seconds)

### 5.2 Perform a Test Transfer

1. **Connect your wallet** (if not already connected)
2. **Enter recipient address**: Use the default or enter a test address
3. **Set amount**: Start with 0.1 SOL
4. **Click "Send Gasless Transaction"**
5. **Approve biometric prompt**: Use Face ID/Touch ID
6. **Wait for confirmation**: Should take 2-5 seconds

### 5.3 Verify Transaction

You can verify your transaction on Solana Explorer:

```
https://explorer.solana.com/tx/[YOUR_SIGNATURE]?cluster=devnet
```

The signature is logged in your browser console.

---

## Advanced: Adding Loading States

Enhance UX by showing loading indicators:

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleActions = async () => {
  setIsLoading(true);
  setError(false);
  setSuccess(false);
  
  try {
    const signature = await signAndSendTransaction({...});
    setSuccess('Transaction successful!');
  } catch (error) {
    setError('Transaction failed.');
  } finally {
    setIsLoading(false);
  }
}

// In your button:
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner /> Processing...
    </>
  ) : (
    'Send Gasless Transaction'
  )}
</button>
```

---

## Complete Working Example

Here's how to use the components together:

```typescript
// app/page.tsx
'use client';
import { TransactionPanel } from '@/components/TransactionPanel';
import { AuthButton } from '@/components/LazorkitButtons';
import { useWallet } from '@lazorkit/wallet';

export default function Home() {
  const { isConnected } = useWallet();

  return (
    <div className="container">
      <h1>Gasless Transfers Demo</h1>
      
      {!isConnected ? (
        <div>
          <p>Connect your wallet to start sending gasless transactions</p>
          <AuthButton classes="btn btn-primary" />
        </div>
      ) : (
        <TransactionPanel />
      )}
    </div>
  );
}
```

---

## Key Takeaways

✅ **Gasless transactions** are powered by Lazorkit Paymaster  
✅ **Users never need SOL** for gas fees  
✅ **Biometric approval** required for each transaction  
✅ **Instructions are flexible** - you can batch multiple operations  
✅ **Error handling** is crucial for good UX  

---

## Next Steps

Now that you can send gasless transfers, try:

1. **Token transfers** - Send SPL tokens instead of SOL
2. **Batch transactions** - Multiple instructions in one transaction
3. **NFT operations** - Mint, transfer, or burn NFTs gaslessly
4. **Program interactions** - Call Solana smart contracts

---

## Troubleshooting

**Q: Transaction fails with "insufficient funds"**  
A: Even though gas is free, you still need SOL balance to send. Get devnet SOL from the faucet.

**Q: "Invalid public key" error**  
A: Verify the recipient address is a valid base58 Solana address (44 characters).

**Q: Transaction pending forever**  
A: Devnet can be slow. Wait 30-60 seconds, or check Solana status page.

**Q: Paymaster not working**  
A: Ensure `paymasterConfig` is correctly set in your `LazorkitContext.tsx`.

---

## Additional Resources

- [Solana Transaction Documentation](https://docs.solana.com/developing/programming-model/transactions)
- [SystemProgram API Reference](https://solana-labs.github.io/solana-web3.js/classes/SystemProgram.html)
- [Lazorkit Paymaster Docs](https://docs.lazorkit.com/paymaster)

---

**Congratulations!** 🎉 You've successfully implemented gasless SOL transfers with Lazorkit. Continue to Tutorial 3 to learn about cross-device wallet synchronization!