import { RoomServiceClient, AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import { ENV } from './_core/env';

// Initialize LiveKit client
let roomClient: RoomServiceClient | null = null;

export function getLivekitClient(): RoomServiceClient {
  if (!roomClient) {
    const livekitUrl = process.env.LIVEKIT_URL || '';
    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';

    if (!livekitUrl || !apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET');
    }

    roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  }
  return roomClient;
}

export function createWebhookReceiver(): WebhookReceiver {
  const apiKey = process.env.LIVEKIT_API_KEY || '';
  const apiSecret = process.env.LIVEKIT_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured');
  }

  return new WebhookReceiver(apiKey, apiSecret);
}

export async function listActiveRooms() {
  try {
    const client = getLivekitClient();
    const rooms = await client.listRooms();
    return rooms;
  } catch (error) {
    console.error('Error listing active rooms:', error);
    return [];
  }
}

export async function getRoomInfo(roomName: string) {
  try {
    const client = getLivekitClient();
    const participants = await client.listParticipants(roomName);
    return participants;
  } catch (error) {
    console.error(`Error getting room info for ${roomName}:`, error);
    return [];
  }
}
