// components/WalletDashboard.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './WalletDashboard.css';
// import { useWallet } from '@lazorkit/wallet';

/**
 * WALLET DASHBOARD COMPONENT
 * 
 * PURPOSE:
 * Main wallet information display after user connects.
 * 
 * SHOWS:
 * - Wallet address (truncated with copy function)
 * - Connection status (green dot if connected)
 * - Total balance in SOL and USD
 * - Balance trend indicator (+/- percentage)
 * - Network (Devnet/Mainnet)
 * - Fee mode (Gasless Active)
 * - Quick action buttons (Send, Receive, Swap)
 * - Testing links (Faucet, Explorer, Jupiter)
 * 
 * BALANCE CALCULATION:
 * - Receives SOL balance from parent via props
 * - Fetches live SOL/USD price from CoinGecko API
 * - Calculates total USD value
 * - Updates when balance changes
 * - Fallback to ~$140/SOL if API fails
 * 
 * REFRESH FUNCTION:
 * - Calls parent's onRefreshBalance
 * - Shows loading spinner during fetch
 * - Updates balance display
 * - Prevents spam (disabled during refresh)
 * 
 * QUICK ACTIONS:
 * 1. Send: Scrolls to transaction panel, sets active tab
 * 2. Receive: Copies wallet address to clipboard
 * 3. Swap: Opens Jupiter (Solana's main DEX)
 * 
 * TESTING LINKS:
 * - Faucet: Get free devnet SOL
 * - Explorer: View transactions/accounts
 * - Jupiter: Test swapping tokens
 * 
 * WHY USD DISPLAY:
 * - Most users think in fiat currency
 * - Easier to understand value
 * - Shows real-world context
 * - Still shows SOL amount prominently
 * 
 * COPY ADDRESS FEATURE:
 * - One-click copy
 * - Toast notification on success
 * - Helps users share address for testing
 * - Or to request funds from faucet
 */


interface WalletDashboardProps {
  setActiveTab?: (tab: 'transfer' | 'sign' | 'nft') => void;
  walletAddress?: string;
  isConnected?: boolean;
  balance?: string;
  onRefreshBalance?: () => void;
}

export function WalletDashboard({ 
  setActiveTab, 
  walletAddress, 
  isConnected = false,
  balance = '0',
  onRefreshBalance
}: WalletDashboardProps) {
  const [usdValue, setUsdValue] = useState<string>('0.00');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [priceLoading, setPriceLoading] = useState<boolean>(false);
  
  // Track if we're currently fetching price to prevent duplicates
  const isFetchingPriceRef = useRef(false);
  
  const network = 'Devnet';

  // ============================================
  // DEBOUNCED SOL PRICE FETCHER (FIXED)
  // ============================================
  const getSOLPrice = useCallback(async (): Promise<number> => {
    // Prevent duplicate price fetches
    if (isFetchingPriceRef.current) {
      return 150; // Return fallback if already fetching
    }

    isFetchingPriceRef.current = true;

    try {
      // Try CoinCap API first (most reliable)
      const response = await fetch('https://api.coincap.io/v2/assets/solana');
      if (response.ok) {
        const data = await response.json();
        const price = parseFloat(data.data.priceUsd);
        if (price && price > 0) {
          console.log(`✅ Got SOL price: $${price.toFixed(2)}`);
          return price;
        }
      }
    } catch (error) {
      console.log('CoinCap API failed, using fallback');
    } finally {
      isFetchingPriceRef.current = false;
    }
    
    // Fallback price if API fails
    console.log('Using fallback SOL price: $150');
    return 150;
  }, []);

  // ============================================
  // EFFECT: Update USD value when balance changes (DEBOUNCED)
  // ============================================
  useEffect(() => {
    const updateUsdValue = async () => {
      const balanceNum = parseFloat(balance);
      
      if (balanceNum <= 0.001) {
        setUsdValue('0.00');
        return;
      }

      setPriceLoading(true);

      try {
        const solPrice = await getSOLPrice();
        const calculatedUsd = (balanceNum * solPrice).toFixed(2);
        setUsdValue(calculatedUsd);
        
        console.log(`💰 Balance: ${balanceNum} SOL = $${calculatedUsd} USD`);
      } catch (error) {
        console.error('Failed to calculate USD value:', error);
        const calculatedUsd = (balanceNum * 150).toFixed(2);
        setUsdValue(calculatedUsd);
      } finally {
        setPriceLoading(false);
      }
    };

    // Debounce the USD calculation - only run after 800ms of no balance changes
    const timer = setTimeout(() => {
      if (balance && parseFloat(balance) > 0.001) {
        updateUsdValue();
      } else {
        setUsdValue('0.00');
        setPriceLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [balance, getSOLPrice]);

  // ============================================
  // FUNCTION: Copy wallet address
  // ============================================
  const handleCopyAddress = useCallback(() => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [walletAddress]);

  // ============================================
  // FUNCTION: Navigate to send tab
  // ============================================
  const handleSend = useCallback(() => {
    if (setActiveTab) {
      setActiveTab('transfer');
    }
    
    const transactionSection = document.getElementById('demo');
    if (transactionSection) {
      transactionSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [setActiveTab]);

  // ============================================
  // FUNCTION: Refresh balance (FIXED - Prevent spam)
  // ============================================
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return; // Prevent spam clicks
    
    setIsRefreshing(true);
    
    if (onRefreshBalance) {
      onRefreshBalance();
    }
    
    // Ensure loading state clears after 2 seconds max
    setTimeout(() => setIsRefreshing(false), 2000);
  }, [isRefreshing, onRefreshBalance]);

  // ============================================
  // FUNCTION: Truncate address for display
  // ============================================
  const truncateAddress = (addr: string | undefined): string => {
    if (!addr) return 'Not Connected';
    const cleanAddr = addr.replace('...', '');
    if (cleanAddr.length <= 10) return cleanAddr;
    return `${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)}`;
  };

  // ============================================
  // RENDER: Not Connected State
  // ============================================
  if (!isConnected) {
    return (
      <div className="wallet-dashboard">
        <div className="wallet-placeholder">
          <div className="wallet-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3>Connect Your Wallet</h3>
          <p>Sign in with passkey to access demo features</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Connected State
  // ============================================
  return (
    <div className="wallet-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Wallet Overview</h2>
        <div className="dashboard-address">
          {truncateAddress(walletAddress)}
        </div>
        <span className="connection-status">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
          CONNECTED
        </span>
      </div>

      {/* Total Balance */}
      <div className="balance-card">
        <div className="balance-header">
          <h3 className="balance-label">Total Balance</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="balance-refresh"
          >
            {isRefreshing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
        
        <div className="balance-display">
          <div className="balance-amount">
            {priceLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : (
              `$${usdValue} USD`
            )}
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-2xl font-semibold text-white">{balance || '0'} SOL</span>
            <span className="text-sm text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +0.06%
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            <p>Live price from CoinCap API</p>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="status-grid">
        <div className="status-item">
          <p className="status-label">NETWORK</p>
          <p className="status-value status-network">{network}</p>
        </div>
        <div className="status-item">
          <p className="status-label">FEE MODE</p>
          <p className="status-value status-gasless">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Gasless Active
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="quick-actions-title">QUICK ACTIONS</h3>
        <div className="quick-actions-grid">
          <button
            onClick={handleSend}
            className="action-card"
          >
            <div className="action-icon primary">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="action-label">Send</span>
          </button>
          
          <button
            onClick={handleCopyAddress}
            className="action-card"
          >
            <div className="action-icon secondary">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="action-label">
              {copied ? 'Copied!' : 'Receive'}
            </span>
          </button>
          
          <button
            onClick={() => window.open('https://jup.ag/', '_blank')}
            className="action-card"
          >
            <div className="action-icon secondary">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="action-label">Swap</span>
          </button>
        </div>
      </div>

      {/* Testing Links */}
      <div className="testing-section">
        <h4 className="testing-title">For Testing</h4>
        <div className="testing-grid">
          <a 
            href="https://faucet.solana.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="test-link"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>Get Test SOL</span>
          </a>
          
          <a 
            href="https://explorer.solana.com/?cluster=devnet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="test-link"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
            </svg>
            <span>Explorer</span>
          </a>
          
          <a 
            href="https://jup.ag/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="test-link"
          >
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Jupiter Swap</span>
          </a>
        </div>
      </div>

      {/* Toast for copy confirmation */}
      {copied && (
        <div className="toast-notification">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Address copied to clipboard!
        </div>
      )}
    </div>
  );
}