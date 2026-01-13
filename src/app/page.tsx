'use client';

// ============================================
// IMPORTS
// ============================================
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, clusterApiUrl } from '@solana/web3.js';

// Component imports
import { AuthButton } from '../components/LazorkitButtons';
import { TransactionPanel } from '../components/TransactionPanel';
import { MessageSigningPanel } from '../components/MessageSigningPanel';
import { NFTMintingPanel } from '../components/NFTMintingPanel';
import { WalletDashboard } from '../components/WalletDashboard';
import { FeatureGrid } from '../components/FeatureGrid';
import { TutorialSection } from '../components/TutorialSection';

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Home() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
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

  // ============================================
  // EFFECT: Close mobile menu on outside click
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // EFFECT: Close mobile menu on escape key
  // ============================================
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // ============================================
  // EFFECT: Initialize Solana connection
  // ============================================
  useEffect(() => {
    const conn = new Connection(clusterApiUrl('devnet'), 'confirmed');
    setConnection(conn);
  }, []);

  // ============================================
  // EFFECT: Fetch wallet info when connected
  // ============================================
  useEffect(() => {
    const getWalletInfo = async () => {
      if (isConnected && smartWalletPubkey && connection) {
        setIsLoading(true);
        try {
          const address = smartWalletPubkey.toString();
          console.log('Real smart wallet address:', address);
          await fetchBalance(address);
        } catch (error) {
          console.error('Error getting wallet info:', error);
          setBalance('0.0000');
        } finally {
          setIsLoading(false);
        }
      } else {
        setBalance('0.0000');
      }
    };

    getWalletInfo();
  }, [isConnected, smartWalletPubkey, connection]);

  // ============================================
  // FUNCTION: Fetch wallet balance
  // ============================================
  const fetchBalance = async (address: string) => {
    if (!connection) return;
    
    setIsLoading(true);
    try {
      // Use Solana RPC to get balance
      const response = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      
      const data = await response.json();
      
      if (data.result && data.result.value !== undefined) {
        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        const solBalance = (data.result.value / 1000000000).toFixed(4);
        setBalance(solBalance);
      } else {
        setBalance('0.0000');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.0000');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FUNCTION: Manual balance refresh
  // ============================================
  const handleRefreshBalance = () => {
    if (smartWalletPubkey) {
      fetchBalance(smartWalletPubkey.toString());
    }
  };

  // ============================================
  // FUNCTION: Close mobile menu
  // ============================================
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="nav hidden md:flex">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>
              Features
            </a>
            <a href="#demo" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
              Demo
            </a>
            <a href="#tutorial" onClick={(e) => { e.preventDefault(); scrollToSection('tutorial'); }}>
              Tutorials
            </a>
            <a href="https://docs.lazorkit.com" target="_blank" rel="noopener noreferrer">
              Docs
            </a>
          </nav>

          {/* Right side - Auth button and menu */}
          <div className="nav-right">
            {/* GitHub link - hidden on very small screens */}
            <a 
              href="https://github.com/lazor-kit/lazor-kit" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost hidden sm:flex"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
            
            {/* Auth Button - connects/disconnects wallet */}
            <AuthButton classes='btn btn-primary btn-compact' />
            
            {/* Mobile Menu Button - shown only on mobile */}
            <button 
              className="mobile-menu-btn md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                // Close icon
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
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
            </a>
          </div>
          
          {/* Mobile menu footer */}
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
              
              {/* Left Content - Text and CTAs */}
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

                {/* Stats Display */}
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
                  
                  {/* Show loading state */}
                  {isLoading ? (
                    <div className="wallet-placeholder p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
                    </div>
                  ) : 
                  /* Show wallet dashboard if connected */
                  isConnected && smartWalletPubkey ? (
                    <WalletDashboard 
                      setActiveTab={setActiveTab}
                      walletAddress={smartWalletPubkey.toString()}
                      isConnected={isConnected}
                      balance={balance}
                      onRefreshBalance={handleRefreshBalance}
                    />
                  ) : 
                  /* Show connect prompt if not connected */
                  (
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
                  )}
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
            DEMO SECTION - Interactive Tabs
            ============================================ */}
        <section id="demo" className="section demo-section">
          <div className="section-header">
            <span className="section-label">Interactive Demo</span>
            <h2>Try It Yourself</h2>
            <p>Experience gasless transactions and passkey authentication</p>
          </div>

          <div className="demo-tabs">
            <div className="tabs-container">
              
              {/* Tab Navigation */}
              <div className="tabs-header">
                {/* Transfer Tab */}
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
                
                {/* Sign Message Tab */}
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
                
                {/* Mint NFT Tab */}
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

              {/* Tab Content - Conditionally rendered based on active tab */}
              <div className="tab-content">
                {activeTab === 'transfer' && (
                  <TransactionPanel 
                    fromAddress={smartWalletPubkey?.toString()}
                    balance={balance}
                    onTransactionComplete={() => {
                      // Refresh balance after successful transaction
                      if (smartWalletPubkey) {
                        setTimeout(() => fetchBalance(smartWalletPubkey.toString()), 3000);
                      }
                    }}
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