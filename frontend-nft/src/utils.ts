export const CONTRACT_ERRORS = {
  E_NOT_AUCTION_OWNER: "You are not the owner of this auction",
  E_INVALID_AUCTION: "Cannot cancel auction with active bids",
  E_AUCTION_ENDED: "Auction has already ended",
};

export const getErrorMessage = (error: any) => {
  // Checking for move abort errors
  const moveAbortMatch = error.message;
  console.log(moveAbortMatch);

  if (moveAbortMatch) {
    const errorCode = moveAbortMatch[1];

    // Mapping move abort error codes to error messages
    switch (errorCode) {
      case "0x1fa":
        return "Cannot cancel auction with active bids";
      default:
        return "An unknown error occurred";
    }
  }

  return error.message || "An unknown error occurred";
};
