// TODO# 1: Define Module and Marketplace Address
address 0xe9d259e1ecdec67d79f314e7c160ed1b3a60b9ea6cc3714194faab69832968e4 {

    module NFTMarketplaceV3 {
        use 0x1::signer;
        use 0x1::vector;
        use 0x1::coin;
        use 0x1::aptos_coin;
        use 0x1::aptos_coin::AptosCoin;
        use std::table::{Self, Table};
        use 0x1::timestamp;

        // TODO# 2: Define NFT Structure
        struct NFT has store, key {
            id: u64,
            owner: address,
            name: vector<u8>,
            description: vector<u8>,
            uri: vector<u8>,
            price: u64,
            for_sale: bool,
            rarity: u8,  // 1 for common, 2 for rare, 3 for epic, etc.
            is_auctioned: bool
        }


        // TODO# 3: Define Marketplace 
        struct Marketplace has key {
            nfts: vector<NFT>
        }

        
        // TODO# 4: Define ListedNFT Structure
        struct ListedNFT has copy, drop {
            id: u64,
            price: u64,
            rarity: u8
        }

        // TODO# 5: Set Marketplace Fee
        const MARKETPLACE_FEE_PERCENT: u64 = 2; // 2% fee


        // TODO# 6: Initialize Marketplace
        public entry fun initialize(account: &signer) {
            let marketplace = Marketplace {
                nfts: vector::empty<NFT>()
            };
            move_to(account, marketplace);
        }        


        // TODO# 7: Check Marketplace Initialization
        #[view]
        public fun is_marketplace_initialized(marketplace_addr: address): bool {
            exists<Marketplace>(marketplace_addr)
        }


        // TODO# 8: Mint New NFT
        public entry fun mint_nft(account: &signer, name: vector<u8>, description: vector<u8>, uri: vector<u8>, rarity: u8) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(signer::address_of(account));
            let nft_id = vector::length(&marketplace.nfts);

            let new_nft = NFT {
                id: nft_id,
                owner: signer::address_of(account),
                name,
                description,
                uri,
                price: 0,
                for_sale: false,
                rarity,
                is_auctioned: false
            };

            vector::push_back(&mut marketplace.nfts, new_nft);
        }


        // TODO# 9: View NFT Details
        #[view]
        public fun get_nft_details(marketplace_addr: address, nft_id: u64): (u64, address, vector<u8>, vector<u8>, vector<u8>, u64, bool, u8, bool) acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);

            (nft.id, nft.owner, nft.name, nft.description, nft.uri, nft.price, nft.for_sale, nft.rarity, nft.is_auctioned)
        }

        
        // TODO# 10: List NFT for Sale
        public entry fun list_for_sale(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 100); // Caller is not the owner
            assert!(!nft_ref.for_sale, 101); // NFT is already listed
            assert!(price > 0, 102); // Invalid price

            nft_ref.for_sale = true;
            nft_ref.price = price;
        }


        // TODO# 11: Update NFT Price
        public entry fun set_price(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 200); // Caller is not the owner
            assert!(price > 0, 201); // Invalid price

            nft_ref.price = price;
        }


        // TODO# 12: Purchase NFT
        public entry fun purchase_nft(account: &signer, marketplace_addr: address, nft_id: u64, payment: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.for_sale, 400); // NFT is not for sale
            assert!(payment >= nft_ref.price, 401); // Insufficient payment

            // Calculate marketplace fee
            let fee = (nft_ref.price * MARKETPLACE_FEE_PERCENT) / 100;
            let seller_revenue = payment - fee;

            // Transfer payment to the seller and fee to the marketplace
            coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, seller_revenue);
            coin::transfer<aptos_coin::AptosCoin>(account, signer::address_of(account), fee);

            // Transfer ownership
            nft_ref.owner = signer::address_of(account);
            nft_ref.for_sale = false;
            nft_ref.price = 0;
        }


        // TODO# 13: Check if NFT is for Sale
        #[view]
        public fun is_nft_for_sale(marketplace_addr: address, nft_id: u64): bool acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.for_sale
        }


        // TODO# 14: Get NFT Price
        #[view]
        public fun get_nft_price(marketplace_addr: address, nft_id: u64): u64 acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.price
        }


        // TODO# 15: Transfer Ownership
        public entry fun transfer_ownership(account: &signer, marketplace_addr: address, nft_id: u64, new_owner: address) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 300); // Caller is not the owner
            assert!(nft_ref.owner != new_owner, 301); // Prevent transfer to the same owner

            // Update NFT ownership and reset its for_sale status and price
            nft_ref.owner = new_owner;
            nft_ref.for_sale = false;
            nft_ref.price = 0;
        }


        // TODO# 16: Retrieve NFT Owner
        #[view]
        public fun get_owner(marketplace_addr: address, nft_id: u64): address acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.owner
        }


        // TODO# 17: Retrieve NFTs for Sale
        #[view]
        public fun get_all_nfts_for_owner(marketplace_addr: address, owner_addr: address, limit: u64, offset: u64): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft_ids = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.owner == owner_addr) {
                    vector::push_back(&mut nft_ids, nft.id);
                };
                mut_i = mut_i + 1;
            };

            nft_ids
        }


        // TODO# 18: Retrieve NFTs for Sale
        #[view]
        public fun get_all_nfts_for_sale(marketplace_addr: address, limit: u64, offset: u64): vector<ListedNFT> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nfts_for_sale = vector::empty<ListedNFT>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.for_sale) {
                    let listed_nft = ListedNFT { id: nft.id, price: nft.price, rarity: nft.rarity };
                    vector::push_back(&mut nfts_for_sale, listed_nft);
                };
                mut_i = mut_i + 1;
            };

            nfts_for_sale
        }


        // TODO# 19: Define Helper Function for Minimum Value
        // Helper function to find the minimum of two u64 numbers
        public fun min(a: u64, b: u64): u64 {
            if (a < b) { a } else { b }
        }


        // TODO# 20: Retrieve NFTs by Rarity
        // New function to retrieve NFTs by rarity
        #[view]
        public fun get_nfts_by_rarity(marketplace_addr: address, rarity: u8): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft_ids = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let mut_i = 0;
            while (mut_i < nfts_len) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.rarity == rarity) {
                    vector::push_back(&mut nft_ids, nft.id);
                };
                mut_i = mut_i + 1;
            };

            nft_ids
        }

        // Auction store to manage multiple auctions
        struct AuctionStore has key {
            auctions: Table<u64, Auction>
        }

        // TODO #21: Define the Auction Structure
        struct Auction has store, key, drop {
            nft_id: u64,
            seller: address,
            start_time: u64,
            end_time: u64,
            minimum_bid: u64,
            highest_bid: u64,
            highest_bidder: address,
            is_completed: bool
        }

        // TODO #22: Define Auction Errors
        const E_AUCTION_NOT_STARTED: u64 = 500;
        const E_AUCTION_ENDED: u64 = 501;
        const E_INSUFFICIENT_BID: u64 = 502;
        const E_NOT_AUCTION_OWNER: u64 = 503;
        const E_AUCTION_STILL_ACTIVE: u64 = 504;
        const E_AUCTION_ALREADY_EXISTS: u64 = 505;
        const E_INVALID_AUCTION: u64 = 506;

        // Initialize Auction Store
        public entry fun initialize_auction_store(account: &signer) {
            if (!exists<AuctionStore>(signer::address_of(account))) {
                move_to(account, AuctionStore {
                    auctions: table::new()
                });
            }
        }

        // Check Auction store Initialization
        #[view]
        public fun is_auction_store_initialized(marketplace_addr: address): bool {
            exists<AuctionStore>(marketplace_addr)
        }

        // TODO #23: Create Auction for NFT
        public entry fun create_auction(
            account: &signer,
            nft_id: u64,
            minimum_bid: u64,
            auction_duration: u64
        ) acquires Marketplace, AuctionStore {
            let marketplace = borrow_global_mut<Marketplace>(signer::address_of(account));
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            // Ownership and sale status checks
            assert!(nft_ref.owner == signer::address_of(account), E_NOT_AUCTION_OWNER);
            assert!(!nft_ref.for_sale, E_AUCTION_ALREADY_EXISTS);

            // Get or create auction store
            let auction_store = borrow_global_mut<AuctionStore>(signer::address_of(account));

            // Create auction
            let auction = Auction {
                nft_id,
                seller: signer::address_of(account),
                start_time: timestamp::now_seconds(),
                end_time: timestamp::now_seconds() + (auction_duration * 86400),
                minimum_bid: minimum_bid,
                highest_bid: 0,
                highest_bidder: @0x0,
                is_completed: false
            };

            // setting the nft auction status
            nft_ref.is_auctioned = true;

            // Store auction and mark NFT as not for direct sale
            table::add(&mut auction_store.auctions, nft_id, auction);
            nft_ref.for_sale = false;
        }

        // TODO# 24: Place Bid on Auction
        public entry fun place_bid(
            account: &signer,
            seller: address,
            nft_id: u64,
            bid_amount: u64
        ) acquires AuctionStore {
            let auction_store = borrow_global_mut<AuctionStore>(seller);
            let auction = table::borrow_mut(&mut auction_store.auctions, nft_id);

            // Auction validity checks
            assert!(timestamp::now_seconds() <= auction.end_time, E_AUCTION_ENDED);
            assert!(timestamp::now_seconds() >= auction.start_time, E_AUCTION_NOT_STARTED);

            // Bid amount validation
            assert!(bid_amount >= auction.minimum_bid, E_INSUFFICIENT_BID);
            assert!(bid_amount > auction.highest_bid, E_INSUFFICIENT_BID);

            // Refund previous highest bidder if exists
            if (auction.highest_bidder != @0x0) {
                coin::transfer<AptosCoin>(
                    account, 
                    auction.highest_bidder, 
                    auction.highest_bid
                );
            };

            // Transfer new bid amount to contract
            coin::transfer<AptosCoin>(account, seller, bid_amount);

            // Update auction details
            auction.highest_bid = bid_amount;
            auction.highest_bidder = signer::address_of(account);
        }

        // TODO# 25: Finalize Auction
        public entry fun finalize_auction(
            account: &signer,
            seller: address,
            nft_id: u64
        ) acquires AuctionStore, Marketplace {
            let auction_store = borrow_global_mut<AuctionStore>(seller);
            let auction = table::borrow_mut(&mut auction_store.auctions, nft_id);

            // Auction completion checks
            assert!(!auction.is_completed, E_AUCTION_STILL_ACTIVE);

            let marketplace = borrow_global_mut<Marketplace>(seller);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            // Process auction settlement
            if (auction.highest_bidder != @0x0) {
                // Calculate marketplace fee
                let fee = (auction.highest_bid * MARKETPLACE_FEE_PERCENT) / 100;
                let seller_revenue = auction.highest_bid - fee;

                // Transfer funds
                coin::transfer<AptosCoin>(account, seller, seller_revenue);
                coin::transfer<AptosCoin>(account, seller, fee);

                // Transfer NFT ownership
                nft_ref.owner = auction.highest_bidder;
            };
                nft_ref.for_sale = false;
                nft_ref.price = 0;
                nft_ref.is_auctioned = false;

            // Mark auction as completed and remove from store
            auction.is_completed = true;
            table::remove(&mut auction_store.auctions, nft_id);
        }

        // TODO# 26: Cancel Auction 
        public entry fun cancel_auction(
            account: &signer,
            seller: address,
            nft_id: u64
        ) acquires AuctionStore, Marketplace {
            let auction_store = borrow_global_mut<AuctionStore>(seller);

            // Perform cancellation checks first
            let auction = table::borrow(&auction_store.auctions, nft_id);
            assert!(auction.seller == signer::address_of(account), E_NOT_AUCTION_OWNER);
            assert!(auction.highest_bidder == @0x0, E_INVALID_AUCTION);
            assert!(timestamp::now_seconds() < auction.end_time, E_AUCTION_ENDED);

            // Borrow the marketplace and reset NFT status
            let marketplace = borrow_global_mut<Marketplace>(seller);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);
            nft_ref.for_sale = false;
            nft_ref.is_auctioned = false;

            // Remove the auction from the table
            table::remove(&mut auction_store.auctions, nft_id);
        }   

        // TODO# 27: View Auction Details
        #[view]
        public fun get_auction_details(marketplace_addr: address, nft_id: u64): (u64, address, u64, u64, u64, address, u64, bool) acquires AuctionStore {
            let auction_store = borrow_global<AuctionStore>(marketplace_addr);
            let auction = table::borrow(&auction_store.auctions, nft_id);
            (
            auction.nft_id,
            auction.seller,
            auction.start_time,
            auction.end_time,
            auction.highest_bid,
            auction.highest_bidder,
            auction.minimum_bid,
            auction.is_completed
            )
        }

        public entry fun transfer_nft_to_wallets(account: &signer, receiver: address, nft_id: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(signer::address_of(account));
            let nft = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            // Ensurig the caller is the current owner of the NFT
            assert!(nft.owner == signer::address_of(account),300);

            // Preventing the transfer to the same owner
            assert!(nft.owner != receiver, 301);

            // Updating NFT ownership and resetting its for_sale status and price
            nft.owner = receiver;
            nft.for_sale = false;
            nft.price = 0;
        }
    }
    
}
