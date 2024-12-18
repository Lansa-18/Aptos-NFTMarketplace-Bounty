import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Pagination,
  message,
  Button,
  Input,
  Modal,
} from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import AuctionModal from "../components/AuctionModal";
import TransferNftModal from "../components/TransferNftModal";

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

export type NFT = {
  id: number;
  name: string;
  description: string;
  uri: string;
  rarity: number;
  price: number;
  for_sale: boolean;
  is_auctioned: boolean;
};

const MyNFTs: React.FC = () => {
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { account, signAndSubmitTransaction } = useWallet();
  const marketplaceAddr =
    "0xe9d259e1ecdec67d79f314e7c160ed1b3a60b9ea6cc3714194faab69832968e4";

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAuctionModalVisible, setIsAuctionModalVisible] = useState(false);
  const [selectedNftForAuction, setSelectedNftForAuction] =
    useState<NFT | null>(null);
  const [auctionDuration, setAuctionDuration] = useState<string>("");
  const [minBid, setMinBid] = useState<string>("");
  const [highestBid, setHighestBid] = useState<string>("");
  const [highestBidder, setHighestBidder] = useState<string>("");
  const [auctionStartTime, setAuctionStartTime] = useState<string>("");
  const [auctionEndTime, setAuctionEndTime] = useState<string>("");
  const [selectedNftForTransfer, setSelectedNftForTransfer] =
    useState<NFT | null>(null);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [recipientOfNft, setRecipientOfNft] = useState<string>("");
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [salePrice, setSalePrice] = useState<string>("");

  const fetchUserNFTs = useCallback(async () => {
    if (!account) return;

    try {
      console.log("Fetching NFT IDs for owner:", account.address);

      const nftIdsResponse = await client.view({
        function: `${marketplaceAddr}::NFTMarketplaceV2::get_all_nfts_for_owner`,
        arguments: [marketplaceAddr, account.address, "100", "0"],
        type_arguments: [],
      });

      const nftIds = Array.isArray(nftIdsResponse[0])
        ? nftIdsResponse[0]
        : nftIdsResponse;
      setTotalNFTs(nftIds.length);

      if (nftIds.length === 0) {
        console.log("No NFTs found for the owner.");
        setNfts([]);
        return;
      }

      console.log("Fetching details for each NFT ID:", nftIds);

      const userNFTs = (
        await Promise.all(
          nftIds.map(async (id) => {
            try {
              const nftDetails = await client.view({
                function: `${marketplaceAddr}::NFTMarketplaceV2::get_nft_details`,
                arguments: [marketplaceAddr, id],
                type_arguments: [],
              });

              const [
                nftId,
                owner,
                name,
                description,
                uri,
                price,
                forSale,
                rarity,
                is_auctioned,
              ] = nftDetails as [
                number,
                string,
                string,
                string,
                string,
                number,
                boolean,
                number,
                boolean,
              ];

              const hexToUint8Array = (hexString: string): Uint8Array => {
                const bytes = new Uint8Array(hexString.length / 2);
                for (let i = 0; i < hexString.length; i += 2) {
                  bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
                }
                return bytes;
              };

              return {
                id: nftId,
                name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
                description: new TextDecoder().decode(
                  hexToUint8Array(description.slice(2))
                ),
                uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
                rarity,
                price: price / 100000000, // Convert octas to APT
                for_sale: forSale,
                is_auctioned,
              };
            } catch (error) {
              console.error(`Error fetching details for NFT ID ${id}:`, error);
              return null;
            }
          })
        )
      ).filter((nft): nft is NFT => nft !== null);

      console.log("User NFTs:", userNFTs);
      setNfts(userNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch your NFTs.");
    }
  }, [account, marketplaceAddr]);

  const handleSellClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedNft(null);
    setSalePrice("");
  };

  const handleAuctionClick = (nft: NFT) => {
    setSelectedNftForAuction(nft);
    setIsAuctionModalVisible(true);
  };

  const handleAuctionCancel = () => {
    setIsAuctionModalVisible(false);
    setSelectedNftForAuction(null);
    setAuctionDuration("");
    setMinBid("");
  };

  const handleTransferNftClick = (nft: NFT) => {
    setSelectedNftForTransfer(nft);
    setIsTransferModalVisible(true);
  };

  const handleTransferNftCancel = () => {
    setIsTransferModalVisible(false);
    setSelectedNftForTransfer(null);
  };

  const handleConfirmTransfer = async (
    recipient: string,
    nftId: number
  ) => {
    try {
      console.log(recipient, nftId);
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplaceV2::transfer_nft_to_wallets`,
        type_arguments: [],
        arguments: [recipient, nftId],
      };
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      console.log(response);
      
      
    } catch (error) {
      console.error("Error transferring NFT:", error);
      message.error("Failed to transfer NFT.");
    }
  }

  const handleConfirmListing = async () => {
    if (!selectedNft || !salePrice) return;

    try {
      const priceInOctas = parseFloat(salePrice) * 100000000;

      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplaceV2::list_for_sale`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,
          selectedNft.id.toString(),
          priceInOctas.toString(),
        ],
      };

      // Bypass type checking
      const response = await (window as any).aptos.signAndSubmitTransaction(
        entryFunctionPayload
      );
      await client.waitForTransaction(response.hash);

      message.success("NFT listed for sale successfully!");
      setIsModalVisible(false);
      setSalePrice("");
      fetchUserNFTs();
    } catch (error) {
      console.error("Error listing NFT for sale:", error);
      message.error("Failed to list NFT for sale.");
    }
  };

  const handleCreateAuction = async (
    nftId: number,
    minBid: number,
    duration: number
  ) => {
    if (!nftId || !minBid || !duration) return;
    console.log(nftId);
    console.log(minBid);
    console.log(duration);

    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplaceV2::create_auction`,
        type_arguments: [],
        arguments: [nftId, minBid, duration],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(
        entryFunctionPayload
      );
      await client.waitForTransaction(txnResponse.hash);

      message.success("Auction created successfully!");
    } catch (error) {
      console.error("Error creating auction:", error);
      message.error("Failed to create auction.");
    } finally {
      setIsAuctionModalVisible(false);
      setSelectedNftForAuction(null);
      setAuctionDuration("");
      setMinBid("");
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs, currentPage]);

  const paginatedNFTs = nfts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="w-[95%] border-blue-500 mx-auto border">
      <div className="text-center">
        <Title level={2} style={{ marginBottom: "20px" }}>
          My Collection
        </Title>
        <p>Your personal collection of NFTs.</p>
      </div>

      <section className="border-red-500 flex gap-6">
        {paginatedNFTs.map((nft) => (
          <article className="bg-base-100 shadow-xl rounded-lg w-full border-black">
            <figure className="h-[15rem] border-red-500">
              <img
                className="object-cover h-full w-full rounded-t-lg"
                src={nft.uri}
                alt={nft.name}
              />
            </figure>
            <div className="p-4">
              <h3 className="font-bold text-lg">{nft.name}</h3>
              <p>{`Rarity: ${nft.rarity}, Price: ${nft.price} APT`}</p>

              <p>ID: {nft.id}</p>
              <p>{nft.description}</p>
              <p style={{ margin: "10px 0" }}>
                For Sale: {nft.for_sale ? "Yes" : "No"}
              </p>
              <p>Is Auctioned: {nft.is_auctioned ? "Yes" : "No"}</p>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <Button type="link" onClick={() => handleSellClick(nft)}>
                Sell
              </Button>
              <Button type="link" onClick={() => handleAuctionClick(nft)}>
                Auction
              </Button>
              <Button type="link" onClick={() => handleTransferNftClick(nft)}>
                Transfer NFTs
              </Button>
            </div>
          </article>
        ))}
      </section>

      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>

      <Modal
        title="Sell NFT"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmListing}>
            Confirm Listing
          </Button>,
        ]}
      >
        {selectedNft && (
          <>
            <p>
              <strong>NFT ID:</strong> {selectedNft.id}
            </p>
            <p>
              <strong>Name:</strong> {selectedNft.name}
            </p>
            <p>
              <strong>Description:</strong> {selectedNft.description}
            </p>
            <p>
              <strong>Rarity:</strong> {selectedNft.rarity}
            </p>
            <p>
              <strong>Current Price:</strong> {selectedNft.price} APT
            </p>

            <Input
              type="number"
              placeholder="Enter sale price in APT"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </Modal>

      <AuctionModal
        handleCreateAuction={handleCreateAuction}
        minBid={minBid}
        handleSetMinBid={setMinBid}
        auctionStartTime={auctionStartTime}
        auctionEndTime={auctionEndTime}
        auctionDuration={auctionDuration}
        handleSetAuctionDuration={setAuctionDuration}
        selectedNft={selectedNftForAuction}
        isAuctionModalVisible={isAuctionModalVisible}
        handleAuctionCancel={handleAuctionCancel}
      />

      <TransferNftModal
        recipient={recipientOfNft}
        selectedNft={selectedNftForTransfer}
        isTransferModalVisible={isTransferModalVisible}
        handleTransferNftCancel={handleTransferNftCancel}
        handleConfirmTransfer={handleConfirmTransfer}
        handleSetRecipient={setRecipientOfNft}
      />
    </div>
  );
};

export default MyNFTs;
