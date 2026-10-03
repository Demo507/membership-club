# MembershipClub.sol

A token-gated membership contract. Users mint a membership NFT to join; the frontend checks ownership to unlock gated content.

## Overview
- Standard: ERC-721 (OpenZeppelin)
- Network: Deployed on Sepolia testnet (for now)
- One membership NFT per wallet — no duplicates

## State Variables
| Variable      | Type    | Description                          |
|---------------|---------|---------------------------------------|
| `nextTokenId` | uint256 | Auto-incrementing ID for the next mint |
| `mintPrice`   | uint256 | Cost to join (default: 0.01 ETH)      |
| `maxSupply`   | uint256 | Max number of members (default: 500)  |

## Functions

**`join()`** — payable
User sends ETH == `mintPrice` to mint a membership NFT. Reverts if underpaid, sold out, or wallet is already a member.

**`isMember(address user)`** — view, returns `bool`
Returns `true` if the address holds at least one membership NFT. This is the function the frontend calls to gate content.

**`withdraw()`** — owner only
Sends all ETH collected from mints to the contract owner.

**`setMintPrice(uint256 newPrice)`** — owner only
Lets the owner change the mint price after deployment.

## Access Control
Inherits OpenZeppelin's `Ownable` — deployer becomes the owner automatically, with exclusive rights to `withdraw()` and `setMintPrice()`.

## Dependencies
- `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- `@openzeppelin/contracts/access/Ownable.sol`

