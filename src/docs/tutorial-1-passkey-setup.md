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
// File: context/LazorkitContext.tsx check the LazorkitContext for the full code  this is the Core logic

export function LazorKitContext({ children }) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize Lazorkit wallet
    registerLazorkitWallet({
      rpcUrl: 'https://api.devnet.solana.com',
      portalUrl: 'https://portal.lazor.sh',
      paymasterConfig: { 
        paymasterUrl: 'https://kora.devnet.lazorkit.com' 
      },
      clusterSimulation: 'devnet',
    });
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <LazorkitProvider
        rpcUrl="https://api.devnet.solana.com"
        portalUrl="https://portal.lazor.sh"
        paymasterConfig={{ paymasterUrl: 'https://kora.devnet.lazorkit.com' }}
      >
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
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
// File: app/layout.tsx core logic, check the file to see the full code
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
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
// File: components/LazorkitButtons.tsx check the main file for full code
export const AuthButton = () => {
  const { connect, disconnect, isConnected, smartWalletPubkey } = useWallet();
  
  return isConnected ? (
    <button onClick={disconnect}>
      Disconnect • {smartWalletPubkey?.toString().slice(0, 6)}...
    </button>
  ) : (
    <button onClick={() => connect({ feeMode: 'paymaster' })}>
      Sign in with Passkey
    </button>
  );
};
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

1. **Open your browser** and navigate to `https://localhost:3000` or `http://localhost:3000`

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