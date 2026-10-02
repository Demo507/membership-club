import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { createPublicClient, http, parseAbi, verifyMessage, isAddress } from 'viem'
import { sepolia } from 'viem/chains'

const CONTRACT_ADDRESS = '0x756B24945d628eEDD8b921A46B080b155058cFA3'
const abi = parseAbi(['function isMember(address user) view returns (bool)'])

const client = createPublicClient({ chain: sepolia, transport: http() })

const app = express()
app.use(cors())
app.use(express.json())

const nonces = new Map()   // address -> { message, expires }
const sessions = new Map() // token -> { address, expires }

const NONCE_TTL = 5 * 60 * 1000
const SESSION_TTL = 60 * 60 * 1000

async function checkMember(address) {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'isMember',
    args: [address],
  })
}

// Step 1: give the wallet a one-time message to sign
app.get('/api/nonce/:address', (req, res) => {
  const address = req.params.address
  if (!isAddress(address)) return res.status(400).json({ error: 'Invalid address' })

  const nonce = crypto.randomBytes(16).toString('hex')
  const message = `Sign in to Membership Club\nNonce: ${nonce}`
  nonces.set(address.toLowerCase(), { message, expires: Date.now() + NONCE_TTL })
  res.json({ message })
})

// Step 2: verify the signature + membership, then issue a session token
app.post('/api/login', async (req, res) => {
  try {
    const { address, signature } = req.body
    if (!isAddress(address) || !signature) {
      return res.status(400).json({ error: 'Missing address or signature' })
    }

    const entry = nonces.get(address.toLowerCase())
    if (!entry || entry.expires < Date.now()) {
      return res.status(400).json({ error: 'Nonce expired, try again' })
    }
    nonces.delete(address.toLowerCase()) // one-time use

    const valid = await verifyMessage({ address, message: entry.message, signature })
    if (!valid) return res.status(401).json({ error: 'Invalid signature' })

    const member = await checkMember(address)
    if (!member) return res.status(403).json({ error: 'Not a member' })

    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, { address, expires: Date.now() + SESSION_TTL })
    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Step 3: protected content (re-checks membership every time)
app.get('/api/members-content', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const session = sessions.get(token)
    if (!session || session.expires < Date.now()) {
      return res.status(401).json({ error: 'Not logged in' })
    }

    const member = await checkMember(session.address)
    if (!member) return res.status(403).json({ error: 'Membership no longer valid' })

    res.json({
      title: 'Members-only vault',
      secret: 'This text only comes from the server, and only for NFT holders.',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))