'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, PublicKey } from '@solana/web3.js';

// Component imports
import { AuthButton } from '../components/LazorkitButtons';
import { TransactionPanel } from '../components/TransactionPanel';
import { MessageSigningPanel } from '../components/MessageSigningPanel';
import { NFTMintingPanel } from '../components/NFTMintingPanel';
import { WalletDashboard } from '../components/WalletDashboard';
import { FeatureGrid } from '../components/FeatureGrid';
import { TutorialSection } from '../components/TutorialSection';

// ============================================
// GLOBAL TYPE DECLARATION
// ============================================
declare global {
  interface Window {
    __balanceTimeouts: NodeJS.Timeout[];
  }
}

// ============================================
// INITIALIZE GLOBAL TIMEOUT ARRAY
// ============================================
if (typeof window !== 'undefined' && !window.__balanceTimeouts) {
  window.__balanceTimeouts = [];
}

export default function Home() {
  // Wallet connection state from Lazorkit
  const { isConnected, smartWalletPubkey } = useWallet();
  
  // Tab navigation state for demo section
  const [activeTab, setActiveTab] = useState<'transfer' | 'sign' | 'nft'>('transfer');
  
  // Wallet balance state
  const [balance, setBalance] = useState<string>('0.0000');
  
  // Loading state for async operations
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Solana connection instance
  const [connection, setConnection] = useState<Connection | null>(null);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Ref for mobile menu to detect outside clicks
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Refs to track state changes
  const hasFetchedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const lastFetchedAddressRef = useRef<string>('');
  const lastFetchTimeRef = useRef<number>(0);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  
  // WebSocket subscription ref
  const wsSubscriptionRef = useRef<number | null>(null);
  
  // Stable refs for connection and wallet
  const connectionRef = useRef<Connection | null>(null);
  const walletAddressRef = useRef<string>('');

  // ============================================
  // EFFECT: Initialize Solana connection (ONCE)
  // ============================================
  useEffect(() => {
    if (!connection) {
      console.log('🔗 Initializing Solana connection...');
      const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
      setConnection(conn);
      connectionRef.current = conn;
    }
  }, []);

  // ============================================
  // EFFECT: Update wallet address ref when it changes
  // ============================================
  useEffect(() => {
    if (smartWalletPubkey) {
      walletAddressRef.current = smartWalletPubkey.toString();
    } else {
      walletAddressRef.current = '';
    }
  }, [smartWalletPubkey]);

  // ============================================
  // EFFECT: Close mobile menu when clicking outside
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking the mobile menu button itself
      const menuButton = document.querySelector('.mobile-menu-btn');
      if (menuButton?.contains(target)) {
        return;
      }
      
      // Close if clicking outside the menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      // Add a small delay to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // ============================================
  // FUNCTION: Setup WebSocket subscription (STABLE)
  // ============================================
  const setupWebSocket = useCallback(() => {
    const conn = connectionRef.current;
    const address = walletAddressRef.current;
    
    if (!conn || !address) {
      console.log('⏸️ Skipping WebSocket setup - no connection or address');
      return;
    }
    
    // Clean up existing subscription first
    if (wsSubscriptionRef.current !== null) {
      console.log('🧹 Cleaning up existing WebSocket subscription...');
      try {
        conn.removeAccountChangeListener(wsSubscriptionRef.current);
      } catch (error) {
        console.log('Error removing existing subscription:', error);
      }
      wsSubscriptionRef.current = null;
    }
    
    const pubkey = new PublicKey(address);
    
    console.log('📡 Setting up WebSocket subscription for:', address);
    
    const subscriptionId = conn.onAccountChange(
      pubkey,
      (accountInfo) => {
        const newBalance = (accountInfo.lamports / 1000000000).toFixed(4);
        console.log('🔔 WebSocket balance update:', newBalance, 'SOL');
        setBalance(newBalance);
        lastFetchTimeRef.current = Date.now();
      },
      'confirmed' 
    );
    
    wsSubscriptionRef.current = subscriptionId;
    console.log('✅ WebSocket subscription active:', subscriptionId);
  }, []); // NO dependencies - uses refs only

  // ============================================
  // EFFECT: Manage WebSocket subscription
  // ============================================
  useEffect(() => {
    const address = walletAddressRef.current;
    const conn = connectionRef.current;
    
    if (!conn || !address) {
      // Clean up if no connection or wallet
      if (wsSubscriptionRef.current !== null) {
        console.log('🧹 Cleaning up WebSocket - no wallet');
        try {
          conn?.removeAccountChangeListener(wsSubscriptionRef.current);
        } catch (error) {
          console.log('Error cleaning up WebSocket:', error);
        }
        wsSubscriptionRef.current = null;
      }
      return;
    }
    
    // Only setup if we don't have an active subscription
    if (wsSubscriptionRef.current === null) {
      setupWebSocket();
    }
    
    // Cleanup function
    return () => {
      if (wsSubscriptionRef.current !== null) {
        console.log('🧹 Component unmounting - cleaning up WebSocket');
        try {
          conn.removeAccountChangeListener(wsSubscriptionRef.current);
        } catch (error) {
          console.log('Error cleaning up on unmount:', error);
        }
        wsSubscriptionRef.current = null;
      }
    };
  }, [isConnected, setupWebSocket]); // Only depend on connection status, not wallet pubkey

  // ============================================
  // FUNCTION: Fetch wallet balance (Memoized)
  // ============================================
  const fetchBalance = useCallback(async (address: string, forceRefresh = false) => {
    const conn = connectionRef.current;
    
    // Don't fetch if no connection
    if (!conn) {
      console.log('❌ No connection available');
      return;
    }
    
    // Check if we're already fetching (debounce)
    if (fetchInProgressRef.current && !forceRefresh) {
      console.log('⏸️ Fetch skipped - already in progress');
      return;
    }
    
    // Debounce non-forced requests (1 second minimum between fetches)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (!forceRefresh && timeSinceLastFetch < 1000) {
      console.log('⏸️ Fetch skipped - fetched recently (within 1 second)');
      return;
    }
    
    console.log('🔄 Fetching balance for:', address);
    fetchInProgressRef.current = true;
    setIsRefreshingBalance(true);
    
    try {
      const pubkey = new PublicKey(address);
      const balanceInLamports = await conn.getBalance(pubkey);
      const solBalance = (balanceInLamports / 1000000000).toFixed(4);
      
      console.log('✅ Balance fetched:', solBalance, 'SOL');
      setBalance(solBalance);
      lastFetchTimeRef.current = Date.now();
      hasFetchedRef.current = true;
      lastFetchedAddressRef.current = address;
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
      // Don't set to 0 on error - keep previous balance
    } finally {
      // Delay the loading state removal to prevent UI flicker
      setTimeout(() => {
        setIsRefreshingBalance(false);
        fetchInProgressRef.current = false;
      }, 500);
    }
  }, []); // No dependencies - uses refs only

  // ============================================
  // EFFECT: Auto-fetch balance when wallet connects
  // ============================================
  useEffect(() => {
    let mounted = true;
    let fetchTimeout: NodeJS.Timeout;
    
    const fetchIfNeeded = async () => {
      if (!mounted) return;
      
      if (isConnected && smartWalletPubkey && connection && !hasFetchedRef.current) {
        const address = smartWalletPubkey.toString();
        console.log('🔑 Wallet connected, fetching balance for:', address);
        await fetchBalance(address);
      } else if (!isConnected) {
        // Reset when disconnected
        console.log('🔌 Wallet disconnected, resetting balance');
        setBalance('0.0000');
        hasFetchedRef.current = false;
        lastFetchedAddressRef.current = '';
      }
    };

    // Use a small timeout to ensure state is stable
    fetchTimeout = setTimeout(() => {
      fetchIfNeeded();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(fetchTimeout);
    };
  }, [isConnected, smartWalletPubkey, connection, fetchBalance]);

  // ============================================
  // FUNCTION: Manual balance refresh (Memoized)
  // ============================================
  const handleRefreshBalance = useCallback(() => {
    if (smartWalletPubkey && !isLoading) {
      console.log('🔄 Manual refresh requested');
      fetchBalance(smartWalletPubkey.toString(), true);
    }
  }, [smartWalletPubkey, isLoading, fetchBalance]);

  // ============================================
  // FUNCTION: Handle transaction completion (Memoized)
  // ============================================
  const handleTransactionComplete = useCallback(() => {
    console.log('🔄 Transaction completed, scheduling balance refresh...');
    
    const address = walletAddressRef.current;
    
    if (!address) {
      console.log('❌ No wallet connected');
      return;
    }
    
    // ============================================
    // WHY WE USE window.__balanceTimeouts:
    // ============================================
    // 1. Prevents multiple simultaneous refresh attempts that could cause race conditions
    // 2. Allows us to cancel pending refreshes if user disconnects or navigates away
    // 3. Ensures cleanup happens properly to prevent memory leaks
    // 4. Stores timeout IDs globally so they survive component re-renders
    // ============================================
    
    // Clear any existing timeouts first to prevent duplicate refreshes
    const timeoutIds = window.__balanceTimeouts || [];
    timeoutIds.forEach(id => clearTimeout(id));
    window.__balanceTimeouts = [];
    
    // First check immediately (WebSocket might have already updated it)
    console.log('🔄 Checking balance immediately...');
    fetchBalance(address, true);
    
    // Wait 2 seconds for transaction confirmation
    const timeout1 = setTimeout(() => {
      console.log('🔄 Refreshing balance after 2 seconds...');
      fetchBalance(address, true);
    }, 2000);
    
    // Store timeout ID so we can cancel it later if needed
    window.__balanceTimeouts.push(timeout1);
    
    // Optional: One more check after 5 seconds as a final fallback
    const timeout2 = setTimeout(() => {
      console.log('🔄 Final balance check after 5 seconds...');
      fetchBalance(address, true);
    }, 5000);
    
    // Store this timeout ID as well
    window.__balanceTimeouts.push(timeout2);
  }, [fetchBalance]);

  // ============================================
  // FUNCTION: Close mobile menu
  // ============================================
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // ============================================
  // FUNCTION: Toggle mobile menu (with proper close logic)
  // ============================================
  const toggleMobileMenu = (e?: React.MouseEvent) => {
    // Prevent event bubbling to avoid conflicts with outside click detection
    e?.stopPropagation();
    setMobileMenuOpen(prev => !prev);
  };

  // ============================================
  // FUNCTION: Smooth scroll to section
  // ============================================
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      closeMobileMenu();
    }
  };

  // ============================================
  // EFFECT: Cleanup on component unmount
  // ============================================
  useEffect(() => {
    return () => {
      const conn = connectionRef.current;
      
      // Clean up WebSocket subscription when component unmounts
      // This prevents memory leaks and unwanted updates
      if (wsSubscriptionRef.current !== null && conn) {
        console.log('🧹 Final cleanup - removing WebSocket subscription');
        try {
          conn.removeAccountChangeListener(wsSubscriptionRef.current);
        } catch (error) {
          console.log('Error in final cleanup:', error);
        }
        wsSubscriptionRef.current = null;
      }
      
      // Clean up all pending balance refresh timeouts
      // This prevents callbacks from firing after component is unmounted
      const timeoutIds = window.__balanceTimeouts || [];
      timeoutIds.forEach(id => clearTimeout(id));
      window.__balanceTimeouts = [];
    };
  }, []); // Empty deps - only run on mount/unmount

  // ============================================
  // RENDER: Wallet content
  // ============================================
  const renderWalletContent = () => {
    // Don't show loading if we already have the wallet connected and balance
    if (isLoading && !(isConnected && smartWalletPubkey)) {
      return (
        <div className="wallet-placeholder p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      );
    }
    
    // Show connected wallet dashboard
    if (isConnected && smartWalletPubkey) {
      return (
        <WalletDashboard 
          setActiveTab={setActiveTab}
          walletAddress={smartWalletPubkey.toString()}
          isConnected={isConnected}
          balance={balance}
          onRefreshBalance={handleRefreshBalance}
        />
      );
    }
    
    // Show connect wallet prompt
    return (
      <div className="wallet-placeholder">
        <div className="wallet-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3>Connect Your Wallet</h3>
        <p>Sign in with passkey to access demo features</p>
        <div className="wallet-connect-button">
          <AuthButton classes='btn btn-primary'/>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="app-container">
      
      {/* ============================================
          HEADER SECTION
          ============================================ */}
      <header className="header">
        <div className="header-container">
          
          {/* Logo */}
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="logo-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="logo-text">
              <h1>Lazorkit Demo</h1>
              <p>Gasless Solana Wallet</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="nav">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>
              Features
            </a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
              Demo
            </a>
            <a href="#tutorial" onClick={(e) => { e.preventDefault(); scrollToSection('tutorial'); }}>
              Tutorials
            </a>
            <a href="https://docs.lazorkit.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              Docs
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-70">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </nav>

          {/* Right side - Auth button and menu */}
          <div className="nav-right">
            {/* GitHub link */}
            <a 
              href="https://github.com/lazor-kit/lazor-kit" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
            
            {/* Auth Button */}
            <AuthButton classes='btn btn-primary btn-compact' />
            
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              type="button"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div 
          ref={mobileMenuRef}
          className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}
        >
          <div className="mobile-nav">
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className={mobileMenuOpen ? 'active' : ''}
            >
              Features
            </a>
            <a 
              href="#demo" 
              onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}
              className={mobileMenuOpen ? 'active' : ''}
            >
              Demo
            </a>
            <a 
              href="#tutorial" 
              onClick={(e) => { e.preventDefault(); scrollToSection('tutorial'); }}
              className={mobileMenuOpen ? 'active' : ''}
            >
              Tutorials
            </a>
            <a 
              href="https://docs.lazorkit.com" 
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
            >
              Documentation
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a 
              href="https://github.com/lazor-kit/lazor-kit" 
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
              className="flex items-center gap-2"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            {/* Auth Button in Mobile Menu */}
            <div className="mobile-menu-auth mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <AuthButton classes='btn btn-primary w-full' />
            </div>
          </div>
          
          <div className="mt-auto pt-8">
            <div className="text-center text-sm text-gray-400">
              <p>Built for the Lazorkit Bounty Program</p>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <main>
        
        {/* ============================================
            HERO SECTION
            ============================================ */}
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              
              {/* Left Content */}
              <div className="hero-content">
                <span className="badge">
                  <span className="badge-dot"></span>
                  No Seed Phrases, No Extensions
                </span>
                
                <h1 className="hero-title">
                  <span className="block">Biometric</span>
                  <span className="gradient-text">Passkey Wallet</span>
                  <span className="block">for Solana</span>
                </h1>
                
                <p className="hero-description">
                  Experience seamless, gasless transactions on Solana with biometric authentication.
                  Built with Lazorkit SDK for developers and users alike.
                </p>

                <div className="hero-buttons">
                  <a href="#demo" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                    Try Demo
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                  <a 
                    href="https://docs.lazorkit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    Documentation
                  </a>
                </div>

                <div className="hero-stats">
                  <div className="stat-item">
                    <h3 className="stat-value">100%</h3>
                    <p className="stat-label">Gasless</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="stat-value">Biometric</h3>
                    <p className="stat-label">Authentication</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="stat-value">Multi-Device</h3>
                    <p className="stat-label">Sync</p>
                  </div>
                </div>
              </div>

              {/* Right Content - Wallet Card */}
              <div className="hero-right">
                <div className="card">
                  <div className="card-badge">✨</div>
                  {renderWalletContent()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            FEATURES SECTION
            ============================================ */}
        <section id="features" className="section section-alt">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Features</span>
              <h2>Modern Wallet Infrastructure</h2>
              <p>Everything you need for next-generation Solana applications</p>
            </div>
            <FeatureGrid />
          </div>
        </section>

        {/* ============================================
            DEMO SECTION
            ============================================ */}
        <section id="demo" className="section demo-section">
          <div className="section-header">
            <span className="section-label">Interactive Demo</span>
            <h2>Try It Yourself</h2>
            <p>Experience gasless transactions and passkey authentication</p>
          </div>

          <div className="demo-tabs">
            <div className="tabs-container">
              
              <div className="tabs-header">
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`tab-button btn btn-primary ${activeTab === 'transfer' ? 'active' : ''}`}
                  aria-selected={activeTab === 'transfer'}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Transfer</span>
                  <span className="sm:hidden">Transfer SOL</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('sign')}
                  className={`tab-button btn btn-primary ${activeTab === 'sign' ? 'active' : ''}`}
                  aria-selected={activeTab === 'sign'}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span className="hidden sm:inline">Sign</span>
                  <span className="sm:hidden">Sign Message</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('nft')}
                  className={`tab-button btn btn-primary ${activeTab === 'nft' ? 'active' : ''}`}
                  aria-selected={activeTab === 'nft'}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Mint NFT</span>
                  <span className="sm:hidden">Mint NFT</span>
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'transfer' && (
                  <TransactionPanel 
                    fromAddress={smartWalletPubkey?.toString()}
                    balance={balance}
                    onTransactionComplete={handleTransactionComplete}
                    isRefreshingBalance={isRefreshingBalance}
                    onRefreshBalance={handleRefreshBalance}
                  />
                )}
                {activeTab === 'sign' && <MessageSigningPanel />}
                {activeTab === 'nft' && <NFTMintingPanel />}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            TUTORIALS SECTION
            ============================================ */}
        <section id="tutorial" className="section">
          <TutorialSection />
        </section>

        {/* ============================================
            CTA SECTION
            ============================================ */}
        <section className="section">
          <div className="cta-card">
            <h2>Ready to Build?</h2>
            <p>
              Start integrating passkey authentication and gasless transactions 
              into your Solana application today.
            </p>
            <div className="cta-buttons">
              <a 
                href="https://docs.lazorkit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                View Documentation
              </a>
              <a 
                href="https://github.com/lazor-kit/lazor-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="footer-logo-icon"></div>
              <div className="footer-info">
                <h3>Lazorkit Demo</h3>
                <p>Built for the Lazorkit Bounty Program</p>
              </div>
            </div>
            <div className="footer-links">
              <a href="https://docs.lazorkit.com" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
              <a href="https://github.com/lazor-kit/lazor-kit" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://t.me/lazorkit" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>This is a demonstration application.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}