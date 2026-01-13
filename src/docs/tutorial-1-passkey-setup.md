# Tutorial 1: Passkey Authentication Setup

## What You'll Learn
- Install Lazorkit SDK and required dependencies
- Configure wallet providers for Solana integration
- Implement biometric passkey sign-in
- Handle authentication state in your React components


## Prerequisites
- Node.js 18+ installed
- Basic understanding of React and Next.js
- A device with biometric authentication (Face ID, Touch ID, or Windows Hello)


## Step 1: Install Dependencies

First, install the Lazorkit SDK and Solana wallet adapter packages:

```bash
npm install @lazorkit/wallet @solana/wallet-adapter-react @solana/web3.js
```

### What each package does:
- **`@lazorkit/wallet`** - Core Lazorkit SDK for passkey authentication and gasless transactions
- **`@solana/wallet-adapter-react`** - React hooks and providers for Solana wallet integration
- **`@solana/web3.js`** - Solana JavaScript SDK for blockchain interactions



## Step 2: Create Lazorkit Context

Create a new file `context/LazorkitContext.tsx` to initialize the Lazorkit SDK and wrap your app with necessary providers:

```typescript
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
 
  // RPC URL: The Solana blockchain node we connect to
  // Using Lazorkit's devnet RPC for better reliability
  // NOTE: This is where all blockchain data is read from
  RPC_URL: 'https://kora.devnet.lazorkit.com', 
  
  // Paymaster configuration: Enables gasless transactions
  // WHY THIS IS IMPORTANT: Users don't need SOL to pay for gas fees
  // The paymaster service covers the transaction costs
  PAYMASTER: {
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
       * - rpcUrl: Where to read/write blockchain data
       * - portalUrl: Where passkeys are managed
       * - paymasterConfig: How gasless transactions are handled
       * - clusterSimulation: Which Solana network (devnet = test network)
       * 
       * NOTE: For production, change 'devnet' to 'mainnet-beta'
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
   *    - Establishes connection to Solana blockchain
   *    - Provides RPC endpoint to all children
   *    - Handles network communication
   * 
   * 2. LazorkitProvider
   *    - Adds Lazorkit-specific features
   *    - Manages passkey authentication
   *    - Configures gasless transactions
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
              - Blockchain connection (via ConnectionProvider)
              - Wallet state and functions (via useWallet hook)
              - Passkey authentication (via Lazorkit)
              - Gasless transactions (via Paymaster)
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
 *     signAndSendTransaction // Function to send transactions
 *   } = useWallet();
 * 
 *   return <button onClick={() => connect({ feeMode: 'paymaster' })}>
 *     Sign In
 *   </button>
 * }
 */
```


### Key Points:
- **`registerLazorkitWallet()`** initializes the SDK and must run on the client side
- **`window.Buffer`** fix prevents errors in Next.js app router
- **Provider nesting** ensures all components can access wallet functionality
- **`clusterSimulation: 'devnet'`** means transactions happen on Solana Devnet (test network)

---

## Step 3: Wrap Your App with Context

In your `app/layout.tsx`, wrap your entire application with the `LazorKitContext`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { LazorKitContext } from '../context/LazorkitContext';

import './globals.css'
import '../components/components.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LazorKit Demo',
  description: 'A demo of LazorKit for Solana with passkey and gasless transactions by Cod-en | Donnutman ',
};

const config = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} px-4 sm:px-5 md:px-6`}>
        <LazorKitContext>
          {children}
        </LazorKitContext>
      </body>
    </html>
  );
}
```

### Why wrap at the root level?
- All child components can access wallet functionality via `useWallet()` hook
- Authentication state is shared across the entire application
- No need to pass wallet props down through components

---

## Step 4: Create Authentication Button

Create a reusable authentication button component in `components/LazorkitButtons.tsx`:

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
}
```

### How it works:
1. **Initial state**: Button shows "Sign in with Passkey"
2. **User clicks**: `connect()` is called with `feeMode: 'paymaster'`
3. **Browser prompts**: User authenticates with Face ID/Touch ID/Windows Hello
4. **Authentication complete**: Button changes to show "Disconnect" with wallet address
5. **User can disconnect**: Click again to log out

### Usage in your components:
```typescript
import { AuthButton } from '@/components/LazorkitButtons';

// Use anywhere in your app
<AuthButton classes="btn btn-primary" />
```

---

## Step 5: Testing Your Implementation

### 5.1 Start the development server
```bash
npm run dev
```

### 5.2 Test the authentication flow

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Click "Sign in with Passkey"**
   - You should see your device's biometric prompt (Face ID, Touch ID, or Windows Hello)

3. **Authenticate with your biometric**
   - On first use, a new passkey wallet will be created
   - On subsequent uses, your existing wallet will be accessed

4. **Verify connection**
   - Button should now show "Disconnect" with your wallet address
   - The wallet address format: `6KbeAwt5maCymUU4uEAWEegB18Zffd3ei3T4dittUvCD...`

5. **Test disconnection**
   - Click "Disconnect" to log out
   - Button should return to "Sign in with Passkey"

### 5.3 Troubleshooting

**Issue**: "Buffer is not defined" error
- **Solution**: The `window.Buffer` fix in `LazorkitContext.tsx` should handle this
- If persists, ensure you're using Next.js 13+ with app router

**Issue**: Biometric prompt doesn't appear
- **Solution**: Ensure you're using HTTPS or localhost
- Check that your device supports WebAuthn
- Try a different browser (Chrome, Safari, Firefox, Edge recommended)

**Issue**: "registerLazorkitWallet is not a function"
- **Solution**: Verify `@lazorkit/wallet` is properly installed
- Run `npm install` again to ensure all dependencies are installed

---

## What Happens Behind the Scenes?

### When you click "Sign in with Passkey":

1. **Lazorkit SDK** calls the WebAuthn API in your browser
2. **Your device** prompts for biometric authentication
3. **A cryptographic key pair** is generated (private key stays on your device)
4. **Public key** is registered with Lazorkit portal
5. **Smart wallet** is created on Solana with your public key
6. **Session is established** and `isConnected` becomes `true`

### Security features:
- ✅ Private keys never leave your device
- ✅ No seed phrases to remember or lose
- ✅ Biometric authentication required for each transaction
- ✅ Passkeys sync across your devices via iCloud/Google

---

## Next Steps

Now that you have authentication working, you can:

1. **Display wallet information** - Show balance, address, network status
2. **Send transactions** - Transfer SOL or tokens (see Tutorial 2)
3. **Sign messages** - Verify wallet ownership
4. **Interact with programs** - Call Solana smart contracts

---

## Complete Code Example

Here's a minimal working example combining all the steps:

```typescript
// app/page.tsx
'use client';
import { AuthButton } from '@/components/LazorkitButtons';
import { useWallet } from '@lazorkit/wallet';

export default function Home() {
  const { isConnected, smartWalletPubkey } = useWallet();

  return (
    <div className="container">
      <h1>Lazorkit Passkey Demo</h1>
      
      {/* Authentication button */}
      <AuthButton classes="btn btn-primary" />
      
      {/* Show wallet info when connected */}
      {isConnected && (
        <div>
          <p>Connected Wallet:</p>
          <code>{smartWalletPubkey?.toString()}</code>
        </div>
      )}
    </div>
  );
}
```

---

## Additional Resources

- [Lazorkit Official Documentation](https://docs.lazorkit.com)
- [WebAuthn Guide](https://webauthn.guide/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

---

**Ready for the next step?** Proceed to [Tutorial 2: Gasless SOL Transfer](./tutorial-2-gasless-transfer.md) to learn how to send transactions without paying gas fees!