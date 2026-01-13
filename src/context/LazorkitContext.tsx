'use client';
import { useMemo, useEffect } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { LazorkitProvider, registerLazorkitWallet } from '@lazorkit/wallet';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

/**
 * CONFIGURATION OBJECT
 * 
 * This object contains all the essential URLs and settings for Lazorkit SDK.
 * 
 * WHY WE NEED THIS:
 * - Centralizes all configuration in one place for easy management
 * - Makes it simple to switch between devnet/mainnet environments
 * - Ensures consistent configuration across the entire application
 */
const config = {
  // Portal URL: Lazorkit's authentication server for passkey management
  // This is where the passkey creation and verification happens
  PORTAL_URL: 'https://portal.lazor.sh',
 
  /**
   * ⚠️ IMPORTANT FIX: SEPARATING RPC AND PAYMASTER
   * 
   * BEFORE (INCORRECT):
   * - We were using 'https://kora.devnet.lazorkit.com' for BOTH RPC and Paymaster
   * 
   * THE PROBLEM:
   * - kora.devnet.lazorkit.com is a PAYMASTER service (for gasless transactions)
   * - It's NOT a full Solana RPC node (can't read blockchain data properly)
   * - This causes the CORS error you're seeing
   * 
   * THE SOLUTION:
   * - Use Solana's official devnet RPC for reading blockchain data
   * - Use kora.devnet.lazorkit.com ONLY for the paymaster (gasless transactions)
   * 
   * WHY THIS FIXES THE CORS ERROR:
   * - Solana's official RPC accepts requests from any origin (no CORS restrictions)
   * - The paymaster is only called when sending transactions (not for reads)
   * - Most wallet operations (checking balance, reading accounts) use RPC, not paymaster
   */
  
  // RPC URL: The Solana blockchain node we connect to for reading/writing data
  // Using Solana's official devnet - it's public and has no CORS restrictions
  RPC_URL: 'https://api.devnet.solana.com',
  
  // Paymaster configuration: Enables gasless transactions
  // This is ONLY used when sending transactions, not for reading data
  // WHY THIS IS IMPORTANT: Users don't need SOL to pay for gas fees
  // The paymaster service covers the transaction costs
  PAYMASTER: {
    // kora.devnet.lazorkit.com is the paymaster - it pays for your transaction fees
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
    // apiKey: 'your_api_key_here', // Optional: Use if you have a custom API key
  },
};

/**
 * LAZORKIT CONTEXT PROVIDER
 * 
 * This is the ROOT component that initializes Lazorkit SDK and provides
 * wallet functionality to the entire application.
 * 
 * WHAT IT DOES:
 * 1. Registers the Lazorkit wallet adapter with Solana's wallet system
 * 2. Initializes the connection to Solana blockchain
 * 3. Provides passkey authentication capabilities
 * 4. Enables gasless transactions throughout the app
 * 
 * HOW IT WORKS:
 * - Wraps the entire app in providers (like a Russian doll)
 * - Each provider adds specific functionality
 * - Child components can access wallet features via hooks
 */
export function LazorKitContext({ children }: { children: React.ReactNode }) {
  
  /**
   * INITIALIZATION EFFECT
   * 
   * This runs ONCE when the component mounts (on app startup).
   * 
   * WHY useEffect:
   * - Ensures this only runs on the CLIENT side (not during server-side rendering)
   * - Next.js apps render on both server and browser, but wallet features
   *   only work in the browser
   */
  useEffect(() => {
    // Check if we're in the browser environment
    // 'window' is only available in browsers, not on servers
    if (typeof window !== 'undefined') {
      
      /**
       * BUFFER POLYFILL FIX
       * 
       * WHY WE NEED THIS:
       * - Solana's web3.js library uses Node.js's Buffer
       * - Browsers don't have Buffer natively
       * - This line ensures Buffer is available in the browser
       * - Without this, you'll get "Buffer is not defined" errors
       */
      window.Buffer = window.Buffer || Buffer;

      /**
       * REGISTER LAZORKIT WALLET
       * 
       * This is the MOST IMPORTANT initialization step.
       * 
       * WHAT IT DOES:
       * - Tells Solana's wallet adapter system about Lazorkit
       * - Configures passkey authentication
       * - Sets up the gasless transaction infrastructure
       * - Connects to the correct Solana network (devnet)
       * 
       * PARAMETERS EXPLAINED:
       * - rpcUrl: Where to read/write blockchain data (Solana's official devnet)
       * - portalUrl: Where passkeys are managed (Lazorkit's auth server)
       * - paymasterConfig: How gasless transactions are handled (Lazorkit's paymaster)
       * - clusterSimulation: Which Solana network (devnet = test network)
       * 
       * NOTE: For production, change 'devnet' to 'mainnet-beta' and update URLs
       */
      registerLazorkitWallet({
        rpcUrl: config.RPC_URL, 
        portalUrl: config.PORTAL_URL,
        paymasterConfig: config.PAYMASTER,
        clusterSimulation: 'devnet', // Use 'mainnet-beta' for production
      });
    }
  }, []); // Empty dependency array = run only once on mount

  /**
   * WALLET ADAPTERS ARRAY
   * 
   * WHY IT'S EMPTY:
   * - We're ONLY using Lazorkit's passkey wallet
   * - If you wanted to also support Phantom, Solflare, etc., you'd add them here
   * 
   * EXAMPLE WITH OTHER WALLETS:
   * const wallets = useMemo(() => [
   *   new PhantomWalletAdapter(),
   *   new SolflareWalletAdapter()
   * ], []);
   * 
   * useMemo: Prevents recreating this array on every render (performance optimization)
   */
  const wallets = useMemo(() => [], []);

  /**
   * PROVIDER NESTING (The Russian Doll Pattern)
   * 
   * Each provider wraps the next, adding layers of functionality:
   * 
   * 1. ConnectionProvider (OUTERMOST)
   *    - Establishes connection to Solana blockchain via RPC
   *    - Uses Solana's official devnet (no CORS issues)
   *    - Provides RPC endpoint to all children
   *    - Handles network communication
   * 
   * 2. LazorkitProvider
   *    - Adds Lazorkit-specific features
   *    - Manages passkey authentication
   *    - Configures gasless transactions (uses paymaster when sending txs)
   *    - Provides the useWallet() hook
   * 
   * 3. WalletProvider
   *    - Standard Solana wallet adapter provider
   *    - Manages wallet state and connection
   *    - Handles wallet switching (if multiple wallets enabled)
   *    - autoConnect: Automatically reconnect if user was previously connected
   * 
   * 4. WalletModalProvider (INNERMOST)
   *    - Provides UI modal for wallet selection
   *    - Not strictly necessary for Lazorkit-only apps, but good to have
   *    - Useful if you add other wallet options later
   * 
   * WHY THIS ORDER MATTERS:
   * - Outer providers must initialize before inner ones can use their features
   * - Connection must exist before wallets can connect
   * - Wallet state must exist before UI can display it
   */
  return (
    <ConnectionProvider endpoint={config.RPC_URL}>
      <LazorkitProvider
        rpcUrl={config.RPC_URL}
        portalUrl={config.PORTAL_URL}
        paymasterConfig={config.PAYMASTER}
      >
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {/* 
              YOUR ENTIRE APP GOES HERE 
              All child components now have access to:
              - Blockchain connection (via ConnectionProvider) - reads from Solana's official RPC
              - Wallet state and functions (via useWallet hook)
              - Passkey authentication (via Lazorkit portal)
              - Gasless transactions (via Lazorkit paymaster - only used when sending transactions)
            */}
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </LazorkitProvider>
    </ConnectionProvider>
  );
}

/**
 * USAGE EXAMPLE IN OTHER COMPONENTS:
 * 
 * import { useWallet } from '@lazorkit/wallet';
 * 
 * function MyComponent() {
 *   // Now you can use these anywhere in your app!
 *   const { 
 *     connect,              // Function to sign in with passkey
 *     disconnect,           // Function to log out
 *     isConnected,          // Boolean: is user signed in?
 *     smartWalletPubkey,    // User's wallet address
 *     signAndSendTransaction // Function to send transactions (uses paymaster for gasless)
 *   } = useWallet();
 * 
 *   return <button onClick={() => connect({ feeMode: 'paymaster' })}>
 *     Sign In
 *   </button>
 * }
 * 
 * TRANSACTION FLOW:
 * 1. User clicks "Sign In" → passkey authentication via portal.lazor.sh
 * 2. User reads data (balance, NFTs, etc.) → data comes from api.devnet.solana.com
 * 3. User sends transaction → transaction fee paid by kora.devnet.lazorkit.com (gasless!)
 */