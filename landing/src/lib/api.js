const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function fetchPilotToken() {
  const res = await fetch(`${API_BASE}/api/pilot/token`)
  let data = {}
  try {
    data = await res.json()
  } catch {
    // ignore
  }
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Unable to start secure session')
  }
  return data.token
}

export async function submitPilotRequest(payload) {
  const token = await fetchPilotToken()

  const res = await fetch(`${API_BASE}/api/pilot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  let data = {}
  try {
    data = await res.json()
  } catch {
    // non-JSON error body
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

/** Admin / dogfood — exchange API key for JWT. */
export async function fetchAdminToken(apiKey) {
  const res = await fetch(`${API_BASE}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })

  let data = {}
  try {
    data = await res.json()
  } catch {
    // ignore
  }

  if (!res.ok || !data.token) {
    throw new Error(data.error || `Auth failed (${res.status})`)
  }

  return data
}
