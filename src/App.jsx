import { useEffect } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { formatEther } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract'
import MembersContent from './memberscontent'
const card = {
  maxWidth: 480,
  margin: '40px auto',
  padding: 24,
  border: '1px solid #444',
  borderRadius: 12,
  fontFamily: 'sans-serif',
}

export default function App() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const wrongNetwork = isConnected && chainId !== sepolia.id
  const ready = isConnected && !wrongNetwork

  const { data: isMember, refetch: refetchMember } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'isMember',
    args: [address],
    chainId: sepolia.id,
    query: { enabled: ready },
  })

  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'mintPrice',
    chainId: sepolia.id,
  })

  const { data: minted, refetch: refetchMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nextTokenId',
    chainId: sepolia.id,
  })

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'maxSupply',
    chainId: sepolia.id,
  })

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      refetchMember()
      refetchMinted()
    }
  }, [isSuccess])

  const handleJoin = () => {
    reset()
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'join',
      value: price,
      chainId: sepolia.id,
    })
  }

  return (
    <div style={card}>
      <h1>Membership Club</h1>

      {!isConnected && (
        <button onClick={() => connect({ connector: connectors[0] })}>
          Connect Wallet
        </button>
      )}

      {isConnected && (
        <p style={{ wordBreak: 'break-all' }}>
          Connected: {address}{' '}
          <button onClick={() => disconnect()}>Disconnect</button>
        </p>
      )}

      {wrongNetwork && (
        <button onClick={() => switchChain({ chainId: sepolia.id })}>
          Switch to Sepolia
        </button>
      )}

      {minted !== undefined && maxSupply !== undefined && (
        <p>
          Members: {minted.toString()} / {maxSupply.toString()}
        </p>
      )}

      {ready && isMember === false && (
        <>
          <p>You are not a member yet.</p>
          <button onClick={handleJoin} disabled={isPending || confirming || !price}>
            {isPending
              ? 'Confirm in wallet...'
              : confirming
              ? 'Waiting for confirmation...'
              : `Join Club (${price ? formatEther(price) : '...'} ETH)`}
          </button>
        </>
      )}

      {error && (
        <p style={{ color: 'tomato' }}>
          {error.shortMessage || error.message}
        </p>
      )}

      {ready && isMember === true && <MembersContent address={address} />}
    </div>
  )
}