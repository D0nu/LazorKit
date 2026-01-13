'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { 
  PublicKey, 
  SystemProgram
} from '@solana/web3.js';
import './NFTMinting.css';

/**
 * NFT MINTING PANEL COMPONENT
 * 
 * PURPOSE:
 * Demonstrates gasless NFT creation using Lazorkit's paymaster.
 * 
 * WHAT IS AN NFT:
 * - Non-Fungible Token = unique digital asset
 * - Each NFT has unique properties (unlike regular tokens)
 * - Stored permanently on Solana blockchain
 * 
 * NFT STRUCTURE:
 * - Name: Human-readable title
 * - Symbol: Short ticker (like stock symbols)
 * - Description: What the NFT represents
 * - Image: Visual representation (stored on IPFS/Arweave)
 * - Attributes: Key-value pairs (rarity, traits, etc.)
 * 
 * WHY DEMO MODE:
 * - Full NFT minting requires @metaplex-foundation/js
 * - Would need to upload images to decentralized storage
 * - Create multiple on-chain accounts
 * - This demo shows the UX and gasless capability
 * 
 * PRODUCTION REQUIREMENTS:
 * 1. Upload image to Arweave/IPFS
 * 2. Create metadata JSON
 * 3. Upload metadata to Arweave/IPFS  
 * 4. Create mint account
 * 5. Create metadata account
 * 6. Create master edition (makes it unique)
 * 7. Mint token to user's wallet
 * 
 * THE GASLESS ADVANTAGE:
 * - NFT minting normally costs ~0.01-0.02 SOL
 * - Paymaster covers ALL these fees
 * - Users can mint without owning SOL
 * - Perfect for onboarding new users
 */

export function NFTMintingPanel() {
  const { signAndSendTransaction, isConnected, smartWalletPubkey } = useWallet();
  
  // NFT Metadata
  const [nftName, setNftName] = useState('My Lazorkit NFT');
  const [nftSymbol, setNftSymbol] = useState('LZNFT');
  const [nftDescription, setNftDescription] = useState('A unique NFT minted with gasless transaction via Lazorkit');
  const [imageUrl, setImageUrl] = useState('https://arweave.net/default-nft-image');
  const [attributes, setAttributes] = useState([
    { trait_type: 'Mint Date', value: new Date().toLocaleDateString() },
    { trait_type: 'Platform', value: 'Lazorkit Demo' },
    { trait_type: 'Rarity', value: 'Common' }
  ]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | boolean>(false);
  const [success, setSuccess] = useState<string | boolean>(false);
  const [mintAddress, setMintAddress] = useState<string>('');
  const [transactionSignature, setTransactionSignature] = useState<string>('');
  const [mintProgress, setMintProgress] = useState<string>('');

  const presetImages = [
    { 
      label: 'Abstract Art', 
      url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop' 
    },
    { 
      label: 'Digital Collectible', 
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h-400&fit=crop' 
    },
    { 
      label: 'Profile Picture', 
      url: 'https://images.unsplash.com/photo-1559523182-a284c3fb7cff?w=400&h=400&fit=crop' 
    }
  ];

  const presetAttributes = [
    { label: 'Add Date', value: () => ({ trait_type: 'Date', value: new Date().toLocaleDateString() }) },
    { label: 'Add Platform', value: () => ({ trait_type: 'Platform', value: 'Lazorkit Demo' }) },
    { label: 'Add Rarity', value: () => ({ trait_type: 'Rarity', value: ['Common', 'Rare', 'Legendary'][Math.floor(Math.random() * 3)] }) },
  ];

  const handleMintNFT = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!nftName.trim() || !nftSymbol.trim()) {
      setError('NFT name and symbol are required');
      return;
    }

    if (!smartWalletPubkey) {
      setError('Wallet not properly initialized');
      return;
    }

    setIsLoading(true);
    setError(false);
    setSuccess(false);
    setMintAddress('');
    setTransactionSignature('');
    setMintProgress('Preparing transaction...');

    try {
      // For demo purposes, we'll create a simple transaction that simulates NFT minting
      setMintProgress('Creating mint account...');
      
      // Generate a random mint address for demo
      const demoMintAddress = PublicKey.unique();
      setMintAddress(demoMintAddress.toString());
      
      // Create a transaction with metadata (simulated)
      // This is a simplified version - real NFT minting would be more complex
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: smartWalletPubkey, // Self-transfer to demonstrate transaction
        lamports: 1, // Minimal amount for demo
      });

      setMintProgress('Signing transaction...');
      
      // Sign and send the transaction - paymaster is configured at provider level
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: { 
          feeToken: 'USDC',
        }
      });

      setTransactionSignature(signature);
      setMintProgress('Transaction confirmed!');
      
      // Simulate some delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`NFT "${nftName}" minted successfully!`);
      
      console.log('NFT Minting details:', {
        name: nftName,
        symbol: nftSymbol,
        description: nftDescription,
        image: imageUrl,
        attributes,
        mintAddress: demoMintAddress.toString(),
        transactionSignature: signature,
        wallet: smartWalletPubkey.toString()
      });

    } catch (err: any) {
      console.error('Minting failed:', err);
      setError(err.message || 'Failed to mint NFT');
      setMintProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', newValue: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = newValue;
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addPresetAttribute = (preset: any) => {
    setAttributes([...attributes, preset.value()]);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearForm = () => {
    setNftName('');
    setNftSymbol('');
    setNftDescription('');
    setImageUrl('');
    setAttributes([
      { trait_type: 'Mint Date', value: new Date().toLocaleDateString() },
      { trait_type: 'Platform', value: 'Lazorkit Demo' },
      { trait_type: 'Rarity', value: 'Common' }
    ]);
    setError(false);
    setSuccess(false);
    setMintAddress('');
    setTransactionSignature('');
  };

  return (
    <div className="nft-minting-panel">
      
      {/* Header */}
      <div className="nft-header">
        <div className="nft-title-section">
          <h3 className="nft-title">
            Mint NFT
          </h3>
          <p className="nft-subtitle">
            Create and mint NFTs with gasless transactions
          </p>
        </div>
        <button
          onClick={clearForm}
          className="clear-form-button"
        >
          Clear Form
        </button>
      </div>

      {/* Demo Warning */}
      <div className="demo-warning">
        <div className="warning-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="warning-content">
          <h4 className="warning-title">Demo Mode</h4>
          <p className="warning-text">This demonstrates gasless NFT minting. For production, integrate with @metaplex-foundation/js for full NFT functionality including metadata, royalties, and collections.</p>
        </div>
      </div>

      {/* Form */}
      <div className="nft-form">
        
        {/* NFT Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column */}
          <div className="space-y-4">
            {/* NFT Name */}
            <div className="form-group">
              <div className="form-label">
                <span className="label-text">
                  NFT Name <span className="required">*</span>
                </span>
                <span className={`char-counter ${nftName.length >= 28 ? 'warning' : ''} ${nftName.length >= 32 ? 'error' : ''}`}>
                  {nftName.length}/32
                </span>
              </div>
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="My Awesome NFT"
                maxLength={32}
                className={`nft-input ${nftName.length >= 32 ? 'error' : ''}`}
              />
              <div className="input-hint">
                Maximum 32 characters. This will be the name of your NFT on-chain.
              </div>
            </div>

            {/* NFT Symbol */}
            <div className="form-group">
              <div className="form-label">
                <span className="label-text">
                  Symbol <span className="required">*</span>
                </span>
                <span className={`char-counter ${nftSymbol.length >= 8 ? 'warning' : ''} ${nftSymbol.length >= 10 ? 'error' : ''}`}>
                  {nftSymbol.length}/10
                </span>
              </div>
              <input
                type="text"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value.toUpperCase())}
                placeholder="COOL"
                maxLength={10}
                className={`nft-input ${nftSymbol.length >= 10 ? 'error' : ''}`}
              />
              <div className="input-hint">
                Maximum 10 characters. Usually 3-5 letters like a stock ticker.
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <div className="form-label">
                <span className="label-text">
                  Description
                </span>
                <span className={`char-counter ${nftDescription.length >= 180 ? 'warning' : ''} ${nftDescription.length >= 200 ? 'error' : ''}`}>
                  {nftDescription.length}/200
                </span>
              </div>
              <textarea
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                placeholder="Describe your NFT..."
                rows={3}
                maxLength={200}
                className="nft-input nft-textarea"
              />
              <div className="input-hint">
                Describe what makes your NFT unique. This will be part of the on-chain metadata.
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Image URL */}
            <div className="form-group">
              <div className="form-label">
                <span className="label-text">Image URL</span>
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://arweave.net/your-image"
                className="nft-input"
              />
              <div className="input-hint">
                Use Arweave, IPFS, or other permanent storage. Images should be 1:1 aspect ratio.
              </div>
              
              {/* Image URL Section */}
              <div className="image-url-section">
                <div className="image-url-note">
                  For production, upload images to decentralized storage like Arweave or IPFS to ensure permanence.
                </div>
                
                {/* Preset Images */}
                <div className="image-presets">
                  <div className="presets-label">Preset Images (for testing):</div>
                  <div className="presets-grid">
                    {presetImages.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setImageUrl(preset.url)}
                        className="preset-button"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="form-group">
              <div className="form-label">
                <span className="label-text">
                  Attributes
                </span>
                <button
                  onClick={addAttribute}
                  className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition"
                >
                  + Add
                </button>
              </div>
              
              <div className="space-y-2">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      placeholder="Trait"
                      className="flex-1 rounded px-3 py-2 bg-black/30 border border-gray-700 text-sm"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded px-3 py-2 bg-black/30 border border-gray-700 text-sm"
                    />
                    <button
                      onClick={() => removeAttribute(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Preset Attributes */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-gray-400">Quick add:</span>
                {presetAttributes.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => addPresetAttribute(preset)}
                    className="text-xs px-2 py-1 bg-purple-500/10 text-purple-300 rounded hover:bg-purple-500/20 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NFT Preview */}
        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-pink-500/20">
          <h4 className="text-sm font-semibold text-pink-300 mb-3">Live Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Image Preview */}
            <div className="bg-black/30 rounded-xl aspect-square flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      NFT
                    </div>
                    <p className="text-xs text-gray-300">Image preview would appear here with real URL</p>
                  </div>
                </div>
              ) : (
                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            {/* Metadata Preview */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-lg font-semibold text-white">{nftName || 'Untitled NFT'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Symbol</p>
                  <p className="text-lg font-mono text-pink-300">{nftSymbol || 'NFT'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-300">{nftDescription || 'No description provided'}</p>
              </div>
              
              {attributes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Attributes</p>
                  <div className="flex flex-wrap gap-2">
                    {attributes.map((attr, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1.5 bg-black/30 rounded-lg border border-purple-500/20"
                      >
                        <p className="text-xs text-gray-400">{attr.trait_type}</p>
                        <p className="text-xs text-purple-300">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mint Progress */}
        {isLoading && mintProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Status:</span>
              <span className="text-pink-300 font-medium">{mintProgress}</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        <div className="mint-button-wrapper">
          <button
            onClick={handleMintNFT}
            disabled={isLoading || !isConnected || !nftName.trim() || !nftSymbol.trim()}
            className="mint-button"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Minting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 4v16m8-8H4" />
                </svg>
                Mint NFT (Gasless)
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mint-error">
            <div className="error-content">
              <div className="error-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="error-text-wrapper">
                <div className="error-title">Minting Failed</div>
                <div className="error-description">{error.toString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && mintAddress && (
          <div className="mint-success">
            <div className="success-header">
              <div className="success-title">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                NFT Minted Successfully! 🎉
              </div>
              <a
                href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-explorer-button"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Explorer
              </a>
            </div>
            
            <div className="nft-details">
              {/* Details Grid */}
              <div className="nft-detail-row">
                <span className="detail-label">NFT Name:</span>
                <span className="detail-value">{nftName}</span>
              </div>
              
              <div className="nft-detail-row">
                <span className="detail-label">Mint Address:</span>
                <span className="detail-value">{mintAddress}</span>
              </div>

              {transactionSignature && (
                <div className="nft-detail-row">
                  <span className="detail-label">Transaction:</span>
                  <span className="detail-value">{transactionSignature.slice(0, 32)}...</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <a
                href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-3 px-4 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 
                         border border-pink-500/30 text-pink-300 hover:border-pink-500/50 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Explorer
              </a>
              <a
                href="https://metaplex.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 
                         border border-purple-500/30 text-purple-300 hover:border-purple-500/50 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Learn Metaplex
              </a>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="nft-info-section">
          <h4 className="info-header">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            About NFT Minting
          </h4>
          <ul className="info-list">
            <li className="info-item">
              <span className="info-bullet">•</span>
              <span><strong>Gasless:</strong> No SOL required for transaction fees</span>
            </li>
            <li className="info-item">
              <span className="info-bullet">•</span>
              <span><strong>Permanent:</strong> NFTs live forever on Solana blockchain</span>
            </li>
            <li className="info-item">
              <span className="info-bullet">•</span>
              <span><strong>Royalties:</strong> Earn on secondary sales (configurable)</span>
            </li>
            <li className="info-item">
              <span className="info-bullet">•</span>
              <span><strong>Interoperable:</strong> Works with all Solana wallets and marketplaces</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-pink-500/20">
            <p className="text-xs text-pink-300 mb-2">For production use:</p>
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://docs.metaplex.com/" 
                target="_blank" 
                className="text-xs px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded hover:bg-pink-500/30 transition"
              >
                Metaplex Docs
              </a>
              <a 
                href="https://github.com/metaplex-foundation/js" 
                target="_blank" 
                className="text-xs px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition"
              >
                Metaplex SDK
              </a>
              <a 
                href="https://www.arweave.org/" 
                target="_blank" 
                className="text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 transition"
              >
                Arweave Storage
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}