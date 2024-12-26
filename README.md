# Aptos NFT Marketplace

A decentralized NFT marketplace built on Aptos blockchain with auction functionality and direct NFT transfers.

## Features

### Auction System

- Create timed auctions for NFTs
- Place bids on active auctions
- Automatic winner determination
- Secure bid management
- Auction cancellation (if no bids)

### NFT Transfers

- Direct wallet-to-wallet transfers
- Gift NFTs to other users
- Secure ownership tracking
- Transaction history

## Prerequisites

- [Petra Wallet](https://petra.app/) or any Aptos-compatible wallet
- Node.js v16+ and npm
- Python 3.7+ (for Aptos CLI)
- Aptos CLI

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Lansa-18/Aptos-NFTMarketplace-Bounty.git
cd Aptos-NFTMarketplace-Bounty
```

### 2. Smart Contract Deployment

```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos info

# Deploy contract
cd contract-nft/contracts
aptos init testnet
aptos move publish
```

### 3. Frontend Setup

```
cd frontend-nft
npm install
npm start
```

### Wallet Setup

- Install [Petra Wallet](https://chromewebstore.google.com/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci)
- Switch to Testnet network in wallet settings
- Get test tokens from [Aptos Faucet](https://www.aptosfaucet.com/)

## Interacting with the functionalities

**Transferring of NFTs:**

- Ensure you have an NFT that has all ready been minted
- Get the address of the wallet you want to transfer the NFT to
- Click on the **Transfer NFT** button, paste the address of the wallet, click confirm and then sign the transaction

**Creating an Auction:**

- Click on the "Create Auction" button on your NFT
- Set the minimum bid price in APT
- Set the auction duration (minimum 1 day)
- Confirm and sign the transaction

**Placing a Bid:**

- Browse available NFT auctions
- Click **"Place Bid"** on your chosen NFT
- Enter your bid amount (must be higher than current bid)
- Confirm and sign the transaction

**Cancelling an Auction:**

- Only the auction creator can cancel
- Navigate to your active auction
- Click "Cancel Auction"
- Confirm and sign the transaction

**Finalizing an Auction:**

- Can be done after auction duration expires
- Click **"Finalize Auction"**
- The highest bidder receives the NFT
- The seller receives the winning bid amount

[Demo Video](https://youtu.be/HjlB2wxrmrw)
