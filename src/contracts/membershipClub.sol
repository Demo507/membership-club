// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Token-Gated Membership Club
/// @notice Mint a membership NFT to join. Frontend checks isMember() to gate content.
contract MembershipClub is ERC721, Ownable {
    uint256 public nextTokenId;
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxSupply = 500;

    constructor() ERC721("Membership Club", "MEMBER") Ownable(msg.sender) {}

    /// @notice Join the club by minting a membership NFT
    function join() external payable {
        require(msg.value == mintPrice, "Incorrect ETH amount");
        require(nextTokenId < maxSupply, "Sold out");
        require(balanceOf(msg.sender) == 0, "Already a member");

        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _safeMint(msg.sender, tokenId);
    }

    /// @notice Frontend calls this to check gate access
    function isMember(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    /// @notice Owner can withdraw collected mint fees
    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    /// @notice Owner can adjust price if needed
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }
}