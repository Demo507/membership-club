import { parseAbi } from 'viem'

// If you redeploy the contract, replace this address
export const CONTRACT_ADDRESS = '0x756B24945d628eEDD8b921A46B080b155058cFA3'

export const CONTRACT_ABI = parseAbi([
  'function join() payable',
  'function isMember(address user) view returns (bool)',
  'function mintPrice() view returns (uint256)',
  'function nextTokenId() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
])