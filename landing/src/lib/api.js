const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function submitPilotRequest(payload) {
  const res = await fetch(`${API_BASE}/api/pilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
