// test-versioned-transactions.ts
import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function testVersionedTransaction() {
  const connection = new Connection('https://api.devnet.solana.com');
  
  // Test creating a versioned transaction
  const from = Keypair.generate();
  const to = Keypair.generate();
  
  const { blockhash } = await connection.getLatestBlockhash();
  
  const instruction = SystemProgram.transfer({
    fromPubkey: from.publicKey,
    toPubkey: to.publicKey,
    lamports: 1000
  });
  
  const messageV0 = new TransactionMessage({
    payerKey: from.publicKey,
    recentBlockhash: blockhash,
    instructions: [instruction]
  }).compileToV0Message();
  
  const tx = new VersionedTransaction(messageV0);
  
  console.log('✅ Versioned transaction created successfully');
  console.log('Transaction size:', tx.serialize().length, 'bytes');
  
  // Sign with dummy keypair (just for testing structure)
  tx.sign([from]);
  
  console.log('✅ Versioned transaction signed successfully');
  
  return tx;
}

// Run test
testVersionedTransaction().catch(console.error);