import { Modal, Button, Input } from "antd";
import { NFT } from "../pages/MyNFTs";

type TransferNftModalProps = {
  recipient: string;
  selectedNft: NFT | null;
  isTransferModalVisible: boolean;
  handleTransferNftCancel: () => void;
  handleConfirmTransfer: (recipient: string, nftId: number) => void;
  handleSetRecipient: (recipient: string) => void;
};

export default function AuctionModal({
  recipient,
  selectedNft,
  isTransferModalVisible,
  handleTransferNftCancel,
  handleConfirmTransfer,
  handleSetRecipient,
}: TransferNftModalProps) {
  return (
    <Modal
      title="Transfer NFT"
      open={isTransferModalVisible}
      onCancel={handleTransferNftCancel}
      footer={[
        <Button key="cancel" onClick={handleTransferNftCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={() =>
            selectedNft && handleConfirmTransfer(recipient, selectedNft.id)
          }
        >
          Transfer NFT
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
            type="text"
            placeholder="Enter the receiver's address"
            value={recipient}
            onChange={(e) => handleSetRecipient(e.target.value)}
            style={{ marginTop: 10 }}
          />
        </>
      )}
    </Modal>
  );
}
