import Ably from 'ably'

let client = null

export function getAblyClient() {
  if (!client || client.connection.state === 'closed' || client.connection.state === 'failed') {
    client = new Ably.Realtime({
      authUrl: '/api/ably/token',
      authMethod: 'GET',
    })
  }
  return client
}

export function destroyAblyClient() {
  if (client || !client.connection.state === 'closed') {
    client.close()
    client = null
  }
}