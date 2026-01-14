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
import { Buffer } from 'buffer'; // ✅ IMPORTANT: Buffer polyfill import

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
       * ✅ BUFFER POLYFILL FIX (CRITICAL)
       * 
       * WHY WE NEED THIS:
       * - Solana's web3.js library uses Node.js's Buffer
       * - Browsers don't have Buffer natively
       * - This line ensures Buffer is available in the browser
       * - Without this, you'll get "Buffer is not defined" errors
       * 
       * NOTE: We imported Buffer at the top of this file
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
import { 
  SystemProgram, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Connection
} from '@solana/web3.js';

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
 * SOLANA CONNECTION
 * 
 * Using devnet for testing - switch to mainnet-beta for production
 * IMPORTANT: Versioned transactions require modern RPC endpoints
 */
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL);

/**
 * TRANSACTIONS BUTTON COMPONENT
 * 
 * PURPOSE:
 * This is a REUSABLE button that handles both:
 * 1. Message signing (for authentication/verification)
 * 2. SOL transfers (sending cryptocurrency)
 * 
 * IMPORTANT: Lazorkit's SDK expects a specific format for transactions
 * - Pass instructions array directly to signAndSendTransaction
 * - Lazorkit handles transaction creation internally
 * - This automatically uses the most efficient transaction format
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
   * LAZORKIT'S TRANSACTION FORMAT:
   * Lazorkit expects: { instructions: [...], transactionOptions: {...} }
   * NOT: { transaction: Transaction, transactionOptions: {...} }
   */
  const { isConnected, signMessage, smartWalletPubkey, signAndSendTransaction } = useWallet();
  
  /**
   * TRANSACTION OPTIONS FOR GASLESS PAYMENTS
   * 
   * STRUCTURE:
   * - feeToken: Which token to use for gas (USDC, SOL, etc.)
   * - paymaster: Configuration for the gasless transaction service
   * - versionedTransaction: Set to true to use modern, smaller transactions
   * 
   * KEY OPTIMIZATION: versionedTransaction: true
   * - Uses VersionedTransaction format (smaller size: ~900 bytes vs ~1328 bytes)
   * - Required to avoid "transaction too large" errors
   * - Lazorkit automatically handles the conversion
   */
  const transactionOptions = { 
    feeToken: 'USDC',              // Which token to use for fees
    paymaster: paymasterConfig,    // Enable gasless via paymaster
    versionedTransaction: true,    // ✅ Use VersionedTransaction format (smaller size)
  };

  /**
   * MAIN ACTION HANDLER
   * 
   * UPDATED LOGIC:
   * - Uses Lazorkit's expected transaction format
   * - Automatically benefits from versioned transactions when available
   * - Includes fallback mechanism if versioned transactions fail
   */
  const handleActions = async () => {
    /**
     * STEP 1: RESET UI STATE
     */
    setError(false);
    setSuccess(false);

    /**
     * STEP 2: VALIDATE WALLET CONNECTION
     */
    if (!isConnected) {
      setError('Please connect your wallet first.');
      return;
    }

    /**
     * MODE: MESSAGE SIGNING
     * (Unchanged - signing doesn't involve transactions)
     */
    if (mode === 'sign') {
      if (!message.trim()) {
        setError('Please enter a message to sign.');
        return;
      }

      try {
        const { signature } = await signMessage(message);
        setSuccess('Message signed successfully!');
        console.log('Message signed:', signature);
        
      } catch (error: any) {
        setError(error.message || 'Failed to sign message.');
        console.error('Signing failed:', error);
      }
    }

    /**
     * MODE: SOL TRANSACTION
     * 
     * OPTIMIZED APPROACH:
     * - Uses Lazorkit's built-in transaction creation
     * - Benefits from automatic versioned transaction support
     * - Includes fallback to legacy format if needed
     */
    else if (mode === 'transaction') {
      if (!address.trim()) {
        setError('No receiver address provided.');
        return;
      }

      if (!amount || amount <= 0) {
        setError('Please enter a valid amount greater than 0.');
        return;
      }

      let destination: PublicKey;
      try {
        destination = new PublicKey(address);
      } catch (error) {
        setError('Invalid Solana address. Please check and try again.');
        return;
      }

      if (!smartWalletPubkey) {
        setError('Wallet not properly initialized.');
        return;
      }

      try {
        console.log('🚀 Preparing transaction with details:', {
          from: smartWalletPubkey.toString(),
          to: destination.toString(),
          amount: amount,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          format: 'Using Lazorkit SDK with versioned transactions'
        });

        /**
         * CREATE TRANSFER INSTRUCTION
         * 
         * This is the core instruction that tells Solana:
         * "Transfer X lamports from sender to recipient"
         */
        const instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: destination,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL)
        });

        /**
         * ✅ CORRECT LAZORKIT TRANSACTION FORMAT
         * 
         * Lazorkit expects:
         * {
         *   instructions: [instruction1, instruction2, ...],
         *   transactionOptions: {...}
         * }
         * 
         * NOT:
         * {
         *   transaction: new Transaction(...),
         *   transactionOptions: {...}
         * }
         * 
         * Lazorkit handles:
         * 1. Transaction creation (VersionedTransaction if enabled)
         * 2. Blockhash fetching
         * 3. Signing via passkey
         * 4. Paymaster integration for gasless
         * 5. Sending to network
         */
        const signature = await signAndSendTransaction({
          instructions: [instruction],           // ✅ Pass instructions array
          transactionOptions: transactionOptions // ✅ Pass transaction options
        });
        
        /**
         * SUCCESS FEEDBACK
         */
        setSuccess(`Transaction sent! Signature: ${signature.slice(0, 32)}...`);
        console.log('✅ Transaction successful:', signature);
        
      } catch (error: any) {
        /**
         * ENHANCED ERROR HANDLING WITH FALLBACK MECHANISM
         * 
         * If versioned transaction fails, try with legacy format
         */
        const errorMsg = error.message?.toString() || 'Transaction failed';
        
        console.error('❌ Transfer error:', error);

        /**
         * ATTEMPT FALLBACK: Try legacy transaction format
         */
        if (errorMsg.includes('versioned') || errorMsg.includes('VersionedTransaction') || errorMsg.includes('too large')) {
          console.log('⚠️ Versioned transaction failed, trying legacy format...');
          
          try {
            // Create instruction again for fallback
            const instruction = SystemProgram.transfer({
              fromPubkey: smartWalletPubkey,
              toPubkey: destination,
              lamports: Math.floor(amount * LAMPORTS_PER_SOL)
            });
            
            // Try with legacy transaction format
            const legacySignature = await signAndSendTransaction({
              instructions: [instruction],
              transactionOptions: {
                ...transactionOptions,
                versionedTransaction: false // Explicitly use legacy
              }
            });
            
            setSuccess(`Transaction sent (legacy)! Signature: ${legacySignature.slice(0, 32)}...`);
            console.log('✅ Legacy transaction successful (fallback)');
            return;
            
          } catch (legacyError: any) {
            // Both versioned and legacy failed
            const legacyErrorMsg = legacyError.message?.toString() || 'Legacy transaction failed';
            setError(`Both transaction formats failed. Versioned: ${errorMsg}. Legacy: ${legacyErrorMsg}`);
            return;
          }
        }
        
        /**
         * STANDARD ERROR HANDLING
         */
        if (errorMsg.includes('insufficient funds')) {
          setError('Smart wallet has insufficient SOL balance. Please fund it first.');
        } 
        else if (errorMsg.includes('User rejected') || errorMsg.includes('reject')) {
          setError('Transaction cancelled by user.');
        }
        else if (errorMsg.includes('too large') || errorMsg.includes('oversized')) {
          setError('Transaction too large. Try: 1) Send smaller amount, 2) Split into multiple transactions');
        }
        else if (errorMsg.includes('Invalid public key')) {
          setError('Invalid recipient address.');
        }
        else if (errorMsg.includes('Custom:1')) {
          setError('Transaction failed. Please ensure: 1) Smart wallet is funded, 2) Network is devnet, 3) Amount is valid.');
        }
        else if (errorMsg.includes('Already signing')) {
          setError('Transaction already in progress. Please wait.');
        }
        else if (errorMsg.includes('simulation failed')) {
          setError('Transaction simulation failed. Please check wallet balance and network.');
        }
        else if (errorMsg.includes('paymaster')) {
          setError('Paymaster error. Please ensure: 1) RPC URL is correct, 2) Paymaster service is active.');
        }
        else {
          setError(`Transfer failed: ${errorMsg}. Please try again.`);
        }
      }
    }
  }

  /**
   * RENDER BUTTON
   * 
   * WHY DISABLE WHEN NOT CONNECTED:
   * - Prevents errors
   * - Visual feedback (button looks inactive)
   * - Forces user to connect wallet first
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
  
  const {
    wallet,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    smartWalletPubkey
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
      
      {/* Truncated address display with copy functionality */}
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
  : (
    <button 
      onClick={async () => connect({ feeMode: 'paymaster' })} 
      className={classes}
      disabled={isConnecting}
    >
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