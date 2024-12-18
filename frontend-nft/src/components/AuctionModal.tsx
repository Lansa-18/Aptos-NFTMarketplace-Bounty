import { Modal, Button, Input } from "antd";
import { NFT } from "../pages/MyNFTs";
import { useState } from "react";
type AuctionModalProps = {
  minBid: string;
  auctionDuration: string;
  auctionStartTime: string;
  auctionEndTime: string;
  selectedNft: NFT | null;
  isAuctionModalVisible: boolean;
  handleSetMinBid: (value: string) => void;
  handleSetAuctionDuration: (value: string) => void;
  handleAuctionCancel: () => void;
  handleCreateAuction: (
    nftId: number,
    minBid: number,
    duration: number
  ) => void;
};
export default function AuctionModal({
  selectedNft,
  minBid,
  auctionDuration,
  isAuctionModalVisible,
  handleAuctionCancel,
  handleCreateAuction,
  handleSetMinBid,
  handleSetAuctionDuration,
}: AuctionModalProps) {

  return (
    <Modal
      title="Create Auction"
      open={isAuctionModalVisible}
      onCancel={handleAuctionCancel}
      footer={[
        <Button key="cancel" onClick={handleAuctionCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={() =>
            selectedNft &&
            handleCreateAuction(selectedNft.id, parseInt(minBid), parseInt(auctionDuration))
          }
        >
          Create Auction
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
            placeholder="Enter auction starting price i.e minimum of 1 APT" 
            value={minBid}
            onChange={(e) => handleSetMinBid((e.target.value))}
            style={{ marginTop: 10 }}
          />
          <Input
            type="number"
            placeholder="How many days will the auction last?" 
            value={auctionDuration}
            onChange={(e) => handleSetAuctionDuration((e.target.value))}
            style={{ marginTop: 10 }}
          />
        </>
      )}
    </Modal>
  );
}
