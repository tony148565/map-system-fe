const BASE_URL = 'http://127.0.0.1:5000'

export async function fetchEvents() {
  const response = await fetch(`${BASE_URL}/events`)

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  return await response.json()
}

export async function createEvent(eventData) {
  const response = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  })

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.status}`)
  }

  return await response.json()
}