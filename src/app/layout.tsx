import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { LazorKitContext } from '../context/LazorkitContext';

import './globals.css'
import '../components/components.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
          <ErrorBoundary>
          {children}
          </ErrorBoundary>
        </LazorKitContext>
      </body>
    </html>
  );
}