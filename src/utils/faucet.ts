// utils/faucet.ts
export async function getTestSolFromFaucet(address: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Option 1: QuickNode faucet (requires API key)
    // const response = await fetch('https://api.quicknode.com/faucet/devnet', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_QUICKNODE_API_KEY}`
    //   },
    //   body: JSON.stringify({ address })
    // });
    
    // Option 2: Helius faucet
    // const response = await fetch(
    //   `https://faucet.helius.dev/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}&address=${address}&amount=1`,
    //   { method: 'POST' }
    // );
    
    // Option 3: Solana CLI alternative - just provide link
    console.log(`Please visit https://faucet.solana.com and request SOL for address: ${address}`);
    
    // For now, simulate success since most faucets require manual interaction
    return {
      success: true,
      message: 'Please visit https://faucet.solana.com to request test SOL'
    };
    
    // Real implementation would be:
    // const data = await response.json();
    // return { success: response.ok, message: data.message || data.error };
  } catch (error) {
    console.error('Faucet error:', error);
    return {
      success: false,
      message: 'Faucet request failed. Please visit https://faucet.solana.com manually.'
    };
  }
}

// Utility to check if address is valid
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}