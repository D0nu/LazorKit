'use client';

import { useCallback, useEffect, useState } from 'react';
import { TransactionsButton } from './LazorkitButtons';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@lazorkit/wallet';
import '../app/globals.css';
import './TransactionPanel.css';

interface TransactionPanelProps {
  fromAddress?: string;
  balance?: string;
  onTransactionComplete?: () => void;
  isRefreshingBalance?: boolean;
  onRefreshBalance?: () => void;
}

export function TransactionPanel({
  fromAddress,
  balance = '0',
  onTransactionComplete,
  isRefreshingBalance = false,
  onRefreshBalance,
}: TransactionPanelProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number>(0.001);
  const [txError, setTxError] = useState<string | boolean>(false);
  const [txSuccess, setTxSuccess] = useState<string | boolean>(false);
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  
  const { smartWalletPubkey } = useWallet();

  // Initialize with empty recipient - user can input any address
  useEffect(() => {
    // Only set if user hasn't typed anything yet
    if (smartWalletPubkey && recipient === '') {
      setRecipient('');
    }
  }, [smartWalletPubkey]);

  const validateSolanaAddress = useCallback((address: string): boolean => {
    if (!address.trim()) return false;
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // ============================================
  // FUNCTION: Handle recipient change
  // ============================================
  const handleRecipientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipient(value);
    setIsValidAddress(validateSolanaAddress(value));
  }, [validateSolanaAddress]);

  // ============================================
  // FUNCTION: Handle amount change
  // ============================================
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '') {
      setAmount(0);
      return;
    }

    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    }
  }, []);

  // ============================================
  // EFFECT: Auto-clear success and trigger parent callback
  // ============================================
  useEffect(() => {
    if (txSuccess) {
      console.log('✅ Transaction succeeded! Notifying parent...');
      
      // Call parent's callback to refresh balance
      if (onTransactionComplete) {
        onTransactionComplete();
      }

      // Clear success message after 10 seconds
      const timer = setTimeout(() => {
        setTxSuccess(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [txSuccess, onTransactionComplete]);

  // ============================================
  // EFFECT: Auto-clear error
  // ============================================
  useEffect(() => {
    if (txError) {
      const timer = setTimeout(() => {
        setTxError(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [txError]);

  // ============================================
  // FUNCTION: Test transaction setup
  // ============================================
  const testTransaction = useCallback(async () => {
    setIsTesting(true);
    
    if (smartWalletPubkey) {
      setRecipient(smartWalletPubkey.toString());
    } else {
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
  }, [smartWalletPubkey]);

  // ============================================
  // FUNCTION: Copy address
  // ============================================
  const copyOwnAddress = useCallback(() => {
    if (smartWalletPubkey) {
      navigator.clipboard.writeText(smartWalletPubkey.toString());
      setMessage('✅ Smart wallet address copied!');
      setTimeout(() => setMessage(''), 3000);
    } else if (fromAddress) {
      navigator.clipboard.writeText(fromAddress);
      setMessage('✅ Address copied!');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [smartWalletPubkey, fromAddress]);

  // ============================================
  // FUNCTION: Amount slider change
  // ============================================
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    }
  }, []);

  // ============================================
  // FUNCTION: Refresh balance manually
  // ============================================
  const handleRefreshBalance = useCallback(() => {
    if (onRefreshBalance) {
      onRefreshBalance();
      setMessage('🔄 Refreshing balance...');
      setTimeout(() => setMessage(''), 2000);
    }
  }, [onRefreshBalance]);

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
            <div className="flex gap-2">
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
              
              {/* Balance Refresh Button */}
              <button
                onClick={handleRefreshBalance}
                disabled={isRefreshingBalance}
                className="refresh-balance-btn"
              >
                {isRefreshingBalance ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
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
              
              <div className={`balance-info-card ${isRefreshingBalance ? 'is-refreshing' : ''}`}>
              <div className="balance-row">
                <div className="balance-main">
                  <div className="balance-label-text">Available Balance:</div>
                  <div className="flex items-center gap-2">
                    <div className="balance-amount-text" title={`${balance} SOL`}>
                      {balance} SOL
                    </div>
                    {isRefreshingBalance && (
                      <div className="refresh-indicator" title="Updating...">
                        <svg className="w-3 h-3 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {parseFloat(balance) < 0.001 && (
                    <div className="low-balance-warning">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Low balance. </span>
                      <a 
                        href="https://faucet.solana.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-400 ml-1"
                      >
                        Get test SOL from faucet →
                      </a>
                    </div>
                  )}
                </div>
                <div className="balance-demo-label">
                  <p>Live Balance</p>
                  <p>Updates after transactions</p>
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
            placeholder="Enter any Solana devnet address (base58)"
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
            Tip: You can send to your own address above or any devnet address
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
          
          {/* Amount Slider (0.001 - 0.05 SOL) */}
          <div className="amount-slider-container">
            <div className="slider-header">
              <span className="slider-value">{amount.toFixed(3)} SOL</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={amount}
              onChange={handleSliderChange}
              className="amount-slider"
            />
            <div className="slider-ticks">
              <span>0.001</span>
              <span>0.025</span>
              <span>0.05</span>
            </div>
          </div>

          <div className="input-with-suffix">
            <input
              type="number"
              value={amount || ''}
              onChange={handleAmountChange}
              step="0.001"
              min="0.001"
              max={Math.min(0.05, parseFloat(balance))}
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
              <span>Amount exceeds available balance ({parseFloat(balance).toFixed(4)} SOL)</span>
              {parseFloat(balance) < 0.01 && (
                <a 
                  href="https://faucet.solana.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-400 ml-2"
                >
                  Get test SOL →
                </a>
              )}
            </div>
          )}

          {/* Quick Amount Buttons */}
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
              onClick={() => setAmount(0.05)}
              className="quick-amount-btn"
            >
              0.05
            </button>
          </div>

          {/* Warning for amounts > 0.05 SOL */}
          {amount > 0.05 && parseFloat(balance) >= amount && (
            <div className="warning-notice">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ⚠️ Amounts over 0.05 SOL may fail due to a known bug in Lazorkit v2.0.1. 
              Will be split into multiple transactions automatically.
            </div>
          )}

          {/* Transaction Progress */}
          {progress && (
            <div className="transaction-progress">
              <div className="progress-header">
                <span>Sending in chunks: {progress.current}/{progress.total}</span>
                <span className="progress-percentage">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
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
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="font-medium">
                {amount > 0.05 ? `Send ${amount} SOL (in chunks)` : `Send ${amount} SOL`}
              </span>
            )}
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
                <div className="feedback-success-title">Success! 🎉</div>
                <div className="feedback-success-message">
                  {txSuccess.toString()}
                  <div className="mt-2 text-sm opacity-90">
                    Your balance will update in 2-5 seconds...
                    {isRefreshingBalance && ' (refreshing now)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice with Enhanced Faucet Info */}
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
              <span><strong>Current Limit:</strong> Max 0.05 SOL per transaction due to Lazorkit v2.0.1 bug</span>
            </li>
            <li className="info-notice-item">
              <span className="info-notice-bullet">•</span>
              <span><strong>Auto-chunking:</strong> Amounts over 0.05 SOL will be split automatically</span>
            </li>
            <li className="info-notice-item">
              <span className="info-notice-bullet">•</span>
              <span><strong>Real Balance:</strong> Balance updates automatically after transactions (2-5 seconds)</span>
            </li>
            <li className="info-notice-item">
              <span className="info-notice-bullet">•</span>
              <span><strong>Need Test SOL?</strong> Use the faucet below</span>
            </li>
          </ul>
          <div className="info-notice-footer">
            <div className="faucet-container">
              <div className="faucet-info">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <div>
                  <h5 className="font-medium">Get Test SOL for Free</h5>
                </div>
              </div>
              <a 
                href="https://faucet.solana.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="faucet-link-button"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                Open Solana Faucet
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}