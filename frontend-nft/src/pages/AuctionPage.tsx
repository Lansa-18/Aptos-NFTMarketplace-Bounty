import {
  Typography,
  Radio,
  message,
  Card,
  Row,
  Col,
  Pagination,
  Tag,
  Button,
  Modal,
  Input,
} from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
  is_auctioned: boolean;
  auction: {
    nft_id: number;
    seller: string;
    start_time: number;
    end_time: number;
    highest_bid: number;
    highest_bidder: string;
    minimum_bid: number;
    is_completed: boolean;
  } | null;
};

const rarityColors: { [key: number]: string } = {
  1: "green",
  2: "blue",
  3: "purple",
  4: "orange",
};

const rarityLabels: { [key: number]: string } = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Super Rare",
};

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export default function AuctionPage() {
  const { signAndSubmitTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<"all" | number>("all");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isBidNowModalVisible, setIsBidNowModalVisible] = useState(false);
  const marketplaceAddr =
    "0xe9d259e1ecdec67d79f314e7c160ed1b3a60b9ea6cc3714194faab69832968e4";

  useEffect(() => {
    handleFetchNfts(undefined);
  }, []);

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    try {
      const response = await client.getAccountResource(
        marketplaceAddr,
        "0xe9d259e1ecdec67d79f314e7c160ed1b3a60b9ea6cc3714194faab69832968e4::NFTMarketplaceV2::Marketplace"
      );
      const nftList = (response.data as { nfts: NFT[] }).nfts;

      const hexToUint8Array = (hexString: string): Uint8Array => {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return bytes;
      };

      const decodedNfts = nftList.map((nft) => ({
        ...nft,
        name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
        description: new TextDecoder().decode(
          hexToUint8Array(nft.description.slice(2))
        ),
        uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
        price: nft.price / 100000000,
      }));

      const filteredNft = decodedNfts.filter((nft) => nft.is_auctioned);
      const auctionDetailsPromise = await Promise.all(
        filteredNft.map(async (nft) => {
          try {
            const auctionResponse = await client.view({
              function: `${marketplaceAddr}::NFTMarketplaceV2::get_auction_details`,
              type_arguments: [],
              arguments: [marketplaceAddr, nft.id],
            });

            return {
              ...nft,
              auction: {
                nft_id: Number(auctionResponse[0]),
                seller: auctionResponse[1] as string,
                start_time: Number(auctionResponse[2]),
                end_time: Number(auctionResponse[3]),
                highest_bid: Number(auctionResponse[4]),
                highest_bidder: auctionResponse[5] as string,
                minimum_bid: Number(auctionResponse[6]),
                is_completed: auctionResponse[7] as boolean,
              },
            };
          } catch (error) {
            console.error(
              `Error fetching auction details for NFT ID ${nft.id}:`,
              error
            );
            return {
              ...nft,
              auction: null,
            };
          }
        })
      );
      // setAuctionDetails(auctionDetailsPromise);
      // console.log("auctionDetailsPromises:", auctionDetails);

      // Filter NFTs based on `for_sale` property and rarity if selected
      // const filteredNfts = decodedNfts.filter(
      //   (nft) =>
      //     nft.is_auctioned &&
      //     (selectedRarity === undefined || nft.rarity === selectedRarity)
      // );

      setNfts(auctionDetailsPromise);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      message.error("Failed to fetch NFTs.");
    }
  };

  const handleBidForAuction = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBidNowModalVisible(true);
  };

  const handleCancelBid = () => {
    setIsBidNowModalVisible(false);
    setSelectedNft(null);
  };

  const handleConfirmBid = async () => {
    if (!selectedNft) return;
    console.log(selectedNft);

    if (!bidAmount) {
      message.error("Please enter a bid amount.");
      return;
    }

    if (selectedNft.auction && Number(bidAmount) <= selectedNft.auction.highest_bid) {
      message.error("Your bid amount must be higher than the current bid.");
      return;
    }

    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplaceV2::place_bid`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id, Number(bidAmount)],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
      message.success("Bid placed successfully!");
      console.log(response);
      
      setIsBidNowModalVisible(false);
      setSelectedNft(null);
      setBidAmount("");

    } catch (error) {
      console.error("Error placing bid:", error);
      message.error("Failed to place bid.");
      
    }

  };

  const calculateDaysRemaining = (endTime: number) => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const secondsRemaining = endTime - currentTime;
    const daysRemaining = Math.floor(secondsRemaining / (60 * 60 * 24)); // Convert seconds to days
    return daysRemaining;
  };

  const paginatedNfts = nfts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Title level={2} style={{ marginBottom: "20px" }}>
        Marketplace
      </Title>

      {/* Filter Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <Radio.Group
          value={rarity}
          onChange={(e) => {
            const selectedRarity = e.target.value;
            setRarity(selectedRarity);
            handleFetchNfts(
              selectedRarity === "all" ? undefined : selectedRarity
            );
          }}
          buttonStyle="solid"
        >
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value={1}>Common</Radio.Button>
          <Radio.Button value={2}>Uncommon</Radio.Button>
          <Radio.Button value={3}>Rare</Radio.Button>
          <Radio.Button value={4}>Super Rare</Radio.Button>
        </Radio.Group>
      </div>

      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          display: "flex",
          justifyContent: "center", // Center row content
          flexWrap: "wrap",
        }}
      >
        {paginatedNfts.map((nft) => (
          <Col
            key={nft.id}
            xs={24}
            sm={12}
            md={8}
            lg={6}
            xl={6}
            style={{
              display: "flex",
              justifyContent: "center", // Center the single card horizontally
              alignItems: "center", // Center content in both directions
            }}
          >
            <Card
              hoverable
              style={{
                width: "100%", // Make the card responsive
                maxWidth: "340px", // Limit the card width on larger screens
                margin: "0 auto",
              }}
              cover={<img alt={nft.name} src={nft.uri} />}
              actions={[
                <Button type="link" onClick={() => handleBidForAuction(nft)}>
                  Bid Now
                </Button>,
              ]}
            >
              {/* Rarity Tag */}
              <Tag
                color={rarityColors[nft.rarity]}
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                {rarityLabels[nft.rarity]}
              </Tag>
              <Meta
                title={nft.name}
                description={`Price: ${nft.auction?.minimum_bid} APT`}
              />
              <p>{nft.description}</p>
              <p>ID: {nft.id}</p>
              <p>Owner: {truncateAddress(nft.owner)}</p>
              <p>
                Auction Duration:{" "}
                {nft.auction?.end_time
                  ? `${calculateDaysRemaining(nft.auction.end_time ?? 0)} days left`
                  : "N/A"}
              </p>{" "}
              <p>
                Highest Bid: {nft.auction?.highest_bid} APT by{" "}
                {truncateAddress(nft.auction?.highest_bidder ?? "")}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={nfts.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>

      {/* Auction Modal */}
      <Modal
        title="Bid for the NFT"
        open={isBidNowModalVisible}
        onCancel={handleCancelBid}
        footer={[
          <Button key="cancel" onClick={handleCancelBid}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmBid}>
            Confirm Purchase
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
              <strong>Current Price:</strong> {selectedNft.auction?.minimum_bid} APT (You need to bid higher than this to win 🤑)
            </p>
            <p>
              <strong>Auction Duration:</strong>{" "}
              {selectedNft.auction?.end_time
                ? `${calculateDaysRemaining(selectedNft.auction.end_time)} days left`
                : "N/A"}
            </p>
            <p>
              <strong>Highest Bid: {selectedNft.auction?.highest_bid}</strong>
            </p>
            <Input
              type="number"
              placeholder="Enter your bid price"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
