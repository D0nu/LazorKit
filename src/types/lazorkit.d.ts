declare module '@lazorkit/wallet' {
  export interface WalletInfo {
    address: string;
    publicKey: string;
    // ... other properties
  }
  
  export interface SignMessageResult {
    signature: string;
  }
  
  export interface TransactionOptions {
    feeToken?: string;
    paymaster?: {
      paymasterUrl: string;
      apiKey?: string;
    };
    addressLookupTableAccounts?: any[];
    computeUnitLimit?: number;
    clusterSimulation?: 'devnet' | 'mainnet';
    versionedTransaction?: boolean;
    [key: string]: any; 
  }
  
  export interface UseWalletReturn {
    connect: (options?: { feeMode?: 'paymaster' | 'user' }) => Promise<WalletInfo>;
    disconnect: () => Promise<void>;
    signMessage: (message: string) => Promise<SignMessageResult>;
    signAndSendTransaction: (params: {
      instructions: any[];
      transactionOptions?: TransactionOptions;
    }) => Promise<string>;
    isConnected: boolean;
    isConnecting: boolean;
    smartWalletPubkey: any; 
    wallet: any;
  }
  
  export function useWallet(): UseWalletReturn;
  export function useLazorkitWallet(): UseWalletReturn;
  

  export function LazorkitProvider(props: {
    rpcUrl: string;
    portalUrl: string;
    paymasterConfig?: {
      paymasterUrl: string;
      apiKey?: string;
    };
    children: React.ReactNode;
  }): JSX.Element;
  
  export function registerLazorkitWallet(config: {
    rpcUrl: string;
    portalUrl: string;
    paymasterConfig?: {
      paymasterUrl: string;
      apiKey?: string;
    };
    clusterSimulation?: 'devnet' | 'mainnet';
  }): void;
}