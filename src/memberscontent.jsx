import { useState } from 'react'
import { useSignMessage } from 'wagmi'

const API = 'http://192.168.1.25:3001'

export default function MembersContent({ address }) {
  const { signMessageAsync } = useSignMessage()
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function unlock() {
    try {
      setLoading(true)
      setError('')

      const nonceRes = await fetch(`${API}/api/nonce/${address}`)
      const { message } = await nonceRes.json()

      const signature = await signMessageAsync({ message })

      const loginRes = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      })
      const login = await loginRes.json()
      if (!loginRes.ok) throw new Error(login.error)

      const contentRes = await fetch(`${API}/api/members-content`, {
        headers: { Authorization: `Bearer ${login.token}` },
      })
      const data = await contentRes.json()
      if (!contentRes.ok) throw new Error(data.error)

      setContent(data)
    } catch (err) {
      setError(err.shortMessage || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 20, padding: 16, border: '1px solid #4caf50', borderRadius: 8 }}>
      <h2>Members-only area</h2>
      {!content && (
        <button onClick={unlock} disabled={loading}>
          {loading ? 'Verifying...' : 'Sign in to unlock content'}
        </button>
      )}
      {content && (
        <>
          <h3>{content.title}</h3>
          <p>{content.secret}</p>
        </>
      )}
      {error && <p style={{ color: 'tomato' }}>{error}</p>}
    </div>
  )
}