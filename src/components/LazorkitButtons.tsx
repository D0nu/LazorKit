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