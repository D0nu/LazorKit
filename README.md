# Lazorkit Demo - Passkey Wallet Integration

> A production-ready Next.js example demonstrating Lazorkit SDK integration for passkey authentication and gasless Solana transactions.

![Lazorkit Demo Banner](./public/banner.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-blueviolet)](https://solana.com/)


## 🌟 Overview

This demo application showcases the power of **Lazorkit SDK** - enabling seamless Web3 experiences on Solana without browser extensions, seed phrases, or gas fees. Built for the Lazorkit Bounty Program, this project serves as a comprehensive integration guide for developers.

### Why Lazorkit?

- **No Seed Phrases** - Users authenticate with biometrics (Face ID, Touch ID, Windows Hello)
- **No Browser Extensions** - Works directly in any modern browser
- **No Gas Fees** - Transactions are sponsored by Lazorkit Paymaster
- **Cross-Device Sync** - Passkeys sync via iCloud or Google Password Manager

## ✨ Features

- 🔐 **Biometric Authentication** - Secure passkey-based wallet creation and sign-in
- ⚡ **Gasless Transactions** - Send SOL without paying network fees
- 📱 **Multi-Device Support** - Access your wallet from any device
- 💎 **Real-Time Balance** - Live wallet balance updates
- 🎨 **Modern UI/UX** - Glassmorphism design with smooth animations
- 📚 **Interactive Tutorials** - In-app guides for developers
- 🔧 **Developer-Friendly** - Clean code with TypeScript support

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.0 or higher
- **npm**, **yarn**, or **pnpm** package manager
- A modern browser that supports WebAuthn (Chrome, Safari, Firefox, Edge)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/lazorkit-demo.git
cd lazorkit-demo
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the app in action.

## 📁 Project Structure

```
lazorkit-demo/
├── app/
│   ├── layout.tsx              # Root layout with LazorKitContext provider
|   ├── Docs/[slug]/page.tsx    # to giva a view of our tutorials
│   ├── page.tsx                # Main application page
│   └── globals.css             # Global styles and animations
├── components/
│   ├── LazorkitButtons.tsx     # Auth and transaction buttons
│   ├── WalletDashboard.tsx     # Wallet balance and info display
│   ├── TransactionPanel.tsx    # Gasless transfer interface
│   ├── FeatureGrid.tsx         # Features showcase with code examples
│   ├── TutorialSection.tsx     # Interactive step-by-step tutorials
|   ├── MessageSigning.tsx      # Gasless transfer with messages 
|   ├── NFTMinting.css          # NFTMinting-specific styles
|   ├── NFTMinting.tsx          # Nft minting proccess
|   ├── MessageSigning.css      # MessageSigning-specific styles
|   ├── WalletDashboard.css     # WalletDahboard-specific styles
|   ├── TransactionPanel.css    # TransactionPanel-specific styles
│   └── components.css          # Component-specific styles
├── context/
│   └── LazorkitContext.tsx     # Lazorkit SDK initialization and providers
├── docs/
│   ├── tutorial-1-passkey-setup.md          # Passkey authentication guide
│   ├── tutorial-2-gasless-transfer.md       # Gasless transaction guide
|   ├── contributing.md                      # guide on how to contribute 
│   └── architecture.md     # describing the structure and frameworks used 
├── public/
│   └── assets/                 # Images and static files
└── README.md                   # This file
```

## 🎯 Key Components

### 1. LazorkitContext (`context/LazorkitContext.tsx`)

Initializes the Lazorkit SDK and wraps the app with necessary providers.

```typescript
registerLazorkitWallet({
  rpcUrl: config.RPC_URL,
  portalUrl: config.PORTAL_URL,
  paymasterConfig: config.PAYMASTER,
  clusterSimulation: 'devnet',
});
```

### 2. AuthButton (`components/LazorkitButtons.tsx`)

Handles wallet connection and disconnection with passkey authentication.

```typescript
const { connect, disconnect, isConnected } = useWallet();

// Connect with gasless mode
await connect({ feeMode: 'paymaster' });
```

### 3. TransactionPanel (`components/TransactionPanel.tsx`)

Demonstrates gasless SOL transfers using Lazorkit Paymaster.

```typescript
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: destination,
  lamports: amount * LAMPORTS_PER_SOL
});

await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: { feeToken: 'USDC' }
});
```

### 4. WalletDashboard (`components/WalletDashboard.tsx`)

Displays wallet information, balance, and quick actions.

## 📚 Tutorials

This project includes comprehensive tutorials to help you integrate Lazorkit into your own applications:

### Available Tutorials

1. **[Passkey Authentication Setup](./docs/tutorial-1-passkey-setup.md)** (5 min)
   - Installing Lazorkit SDK
   - Configuring wallet providers
   - Implementing biometric sign-in

2. **[Gasless SOL Transfer](./docs/tutorial-2-gasless-transfer.md)** (8 min)
   - Creating transfer instructions
   - Using Lazorkit Paymaster
   - Handling transaction confirmation


### In-App Tutorials

The demo also features interactive tutorials accessible directly in the application. Navigate to the **Tutorials** section to explore:
- Code examples with syntax highlighting
- Step-by-step implementation guides
- Links to official documentation

## 🎨 Design System

This project uses a modern design system featuring:

- **Glassmorphism** - Frosted glass effects with backdrop blur
- **Gradient Accents** - Purple-to-indigo gradients for highlights
- **Smooth Animations** - Micro-interactions for better UX
- **Dark Theme** - Eye-friendly dark color scheme
- **Responsive Layout** - Works on mobile, tablet, and desktop

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Blockchain**: Solana Web3.js
- **Wallet SDK**: Lazorkit SDK (`@lazorkit/wallet`)
- **Wallet Adapter**: Solana Wallet Adapter

## 🌐 Live Demo

**Live Application**: [(https://lazor-kit-two.vercel.app/)]

Try these features:
1. Sign in with your device's biometric authentication
2. View your wallet balance and information
3. Send a gasless SOL transfer to any Solana address
4. Explore the interactive tutorials

> **Note**: This demo runs on Solana Devnet. You can request test SOL from the [Solana Faucet](https://faucet.solana.com/).

## 📖 Documentation

### Lazorkit Official Resources

- **Documentation**: [docs.lazorkit.com](https://docs.lazorkit.com)
- **GitHub**: [github.com/lazor-kit/lazor-kit](https://github.com/lazor-kit/lazor-kit)
- **Community**: [Telegram](https://t.me/lazorkit)

### Additional Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! This project is designed to help the Solana developer community learn Lazorkit integration.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Ideas

- Add more transaction examples (token transfers, NFT minting)
- Improve UI/UX components
- Write additional tutorials
- Fix bugs or improve documentation
- Add test coverage

## ⚠️ Important Notes

- **Devnet Only**: This application is configured for Solana Devnet. Do not use with mainnet private keys or real funds.
- **Educational Purpose**: Built as a demonstration for the Lazorkit Bounty Program.
- **Browser Compatibility**: Requires a WebAuthn-compatible browser for passkey authentication.
- **Biometric Hardware**: Best experience with devices that support Face ID, Touch ID, or Windows Hello.

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Buffer is not defined" error
```bash
# This is handled in LazorkitContext.tsx
window.Buffer = window.Buffer || Buffer;
```

**Issue**: Passkey creation fails
- Ensure you're using HTTPS or localhost
- Check if your browser supports WebAuthn
- Try a different browser or device

**Issue**: Transaction fails
- Verify you're on Devnet
- Check your wallet has sufficient balance
- Confirm recipient address is valid

**Issue**: Balance not updating
- Click the "Refresh" button in the wallet dashboard
- Check your internet connection
- Verify RPC endpoint is accessible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Lazorkit Team** - For the amazing SDK and bounty program
- **Solana Foundation** - For the robust blockchain infrastructure
- **Open Source Community** - For the tools and libraries used in this project

## 📬 Contact

**Project Creator**: Donnutman (Cod-en)

**GitHub**: [@D0nu](https://github.com/D0nu)

**Twitter/X**: [@Ikechuk2806](https://twitter.com/Ikechuk2806?s=09)

---

<div align="center">

**Built with ❤️ for the Lazorkit Bounty Program**

[⭐ Star this repo](https://github.com/D0nu/lazorkit.git) 
</div>