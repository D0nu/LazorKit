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
// File: components/TransactionPanel.tsx navigate through the full code in the actual file
export function TransactionPanel() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0.001);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  
  const { smartWalletPubkey } = useWallet();

  // Pre-fill with own address
  useEffect(() => {
    if (smartWalletPubkey) {
      setRecipient(smartWalletPubkey.toString());
    }
  }, [smartWalletPubkey]);

  return (
    <div>
      <input 
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient address"
      />
      <input 
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value))}
        type="number"
        step="0.001"
      />
      <TransactionsButton
        mode="transaction"
        address={recipient}
        amount={amount}
        setError={setTxError}
        setSuccess={setTxSuccess}
      >
        Send Gasless Transaction
      </TransactionsButton>
      
      {txError && <div className="error">{txError}</div>}
      {txSuccess && <div className="success">{txSuccess}</div>}
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
// File: components/LazorkitButtons.tsx
export function TransactionsButton({ 
  mode, address, amount, setError, setSuccess 
}) {
  const { 
    isConnected, 
    smartWalletPubkey, 
    signAndSendTransaction 
  } = useWallet();

  const handleTransaction = async () => {
    if (!isConnected) {
      setError('Please connect wallet first');
      return;
    }

    if (mode === 'transaction') {
      try {
        // Create transfer instruction
        const instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: new PublicKey(address),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL)
        });

        // Send gasless transaction
        const signature = await signAndSendTransaction({
          instructions: [instruction],
          transactionOptions: { 
            feeToken: 'USDC',
            paymaster: { paymasterUrl: 'https://kora.devnet.lazorkit.com' }
          }
        });

        setSuccess(`Transaction sent! Signature: ${signature.slice(0, 32)}...`);
      } catch (error) {
        // Error handling logic...
        setError(error.message);
      }
    }
  };

  return (
    <button onClick={handleTransaction} disabled={!isConnected}>
      Send Gasless Transaction
    </button>
  );
}

```

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

**Congratulations!** 🎉 You've successfully implemented gasless SOL transfers with Lazorkit. 