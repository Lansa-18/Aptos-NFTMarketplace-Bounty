import { Modal, Button, Input } from "antd";
import { NFT } from "../pages/MyNFTs";

type DeleteModalProps = {
  selectedNft: NFT | null;
  isDeleteModalVisible: boolean;
  handleDeleteModalCancel: () => void;
  handleCancelAuction: () => void;
};

export default function DeleteModal({
  selectedNft,
  isDeleteModalVisible,
  handleDeleteModalCancel,
  handleCancelAuction,
}: DeleteModalProps) {
  return (
    <Modal
      title="Cancle Auction"
      open={isDeleteModalVisible}
      onCancel={handleDeleteModalCancel}
      footer={[
        <Button key="cancel" onClick={handleDeleteModalCancel}>
          NO
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={() =>
            selectedNft && handleCancelAuction()
          }
        >
          YES
        </Button>,
      ]}
    >
      {selectedNft && (
        <>
          <p>
            <strong>Are you sure you want to cancel the auction on the NFT of ID: {selectedNft.id}</strong> 
          </p>
        </>
      )}
    </Modal>
  );
}
