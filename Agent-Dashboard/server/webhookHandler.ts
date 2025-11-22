import { WebhookEvent } from 'livekit-server-sdk';
import { getDb } from './db';
import { rooms, participants, tracks, agents, agentSessions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createWebhookReceiver } from './livekitService';

export async function handleLivekitWebhook(body: string, authHeader: string): Promise<void> {
  const receiver = createWebhookReceiver();
  
  try {
    const event: WebhookEvent = await receiver.receive(body, authHeader);
    
    console.log(`[Webhook] Received event: ${event.event}`);
    
    switch (event.event) {
      case 'room_started':
        await handleRoomStarted(event);
        break;
      case 'room_finished':
        await handleRoomFinished(event);
        break;
      case 'participant_joined':
        await handleParticipantJoined(event);
        break;
      case 'participant_left':
        await handleParticipantLeft(event);
        break;
      case 'track_published':
        await handleTrackPublished(event);
        break;
      case 'track_unpublished':
        await handleTrackUnpublished(event);
        break;
      default:
        console.log(`[Webhook] Unhandled event type: ${event.event}`);
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    throw error;
  }
}

async function handleRoomStarted(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.room) return;

  try {
    await db.insert(rooms).values({
      roomSid: event.room.sid,
      roomName: event.room.name,
      startedAt: new Date(Number(event.room.creationTime) * 1000),
      status: 'active',
      metadata: event.room.metadata ? JSON.parse(event.room.metadata) : null,
    });
    console.log(`[Webhook] Room started: ${event.room.name}`);
  } catch (error) {
    console.error('[Webhook] Error handling room_started:', error);
  }
}

async function handleRoomFinished(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.room) return;

  try {
    await db.update(rooms)
      .set({
        status: 'ended',
        endedAt: new Date(),
      })
      .where(eq(rooms.roomSid, event.room.sid));
    console.log(`[Webhook] Room finished: ${event.room.name}`);
  } catch (error) {
    console.error('[Webhook] Error handling room_finished:', error);
  }
}

async function handleParticipantJoined(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.participant || !event.room) return;

  try {
    // Find room
    const roomResult = await db.select().from(rooms).where(eq(rooms.roomSid, event.room.sid)).limit(1);
    if (roomResult.length === 0) return;
    const room = roomResult[0];

    // Insert participant
    await db.insert(participants).values({
      participantSid: event.participant.sid,
      roomId: room.id,
      identity: event.participant.identity,
      name: event.participant.name || event.participant.identity,
      joinedAt: new Date(event.participant.joinedAt ? Number(event.participant.joinedAt) * 1000 : Date.now()),
      state: event.participant.state.toString(),
      metadata: event.participant.metadata ? JSON.parse(event.participant.metadata) : null,
      isAgent: (event.participant as any).isAgent || false,
    });

    // Update room participant count
    await db.update(rooms)
      .set({
        participantCount: (room.participantCount || 0) + 1,
      })
      .where(eq(rooms.id, room.id));

    console.log(`[Webhook] Participant joined: ${event.participant.identity} in room ${event.room.name}`);

    // If it's an agent, track it
    if ((event.participant as any).isAgent) {
      await handleAgentJoined(event, room.id);
    }
  } catch (error) {
    console.error('[Webhook] Error handling participant_joined:', error);
  }
}

async function handleParticipantLeft(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.participant || !event.room) return;

  try {
    // Get participant to calculate duration
    const participantResult = await db.select().from(participants)
      .where(eq(participants.participantSid, event.participant.sid)).limit(1);
    
    if (participantResult.length > 0) {
      const participant = participantResult[0];
      const leftAt = new Date();
      const durationSeconds = Math.floor((leftAt.getTime() - participant.joinedAt.getTime()) / 1000);
      
      await db.update(participants)
        .set({
          leftAt,
          durationSeconds,
          state: 'disconnected',
        })
        .where(eq(participants.participantSid, event.participant.sid));

      console.log(`[Webhook] Participant left: ${event.participant.identity} (duration: ${durationSeconds}s)`);
    }

    // If it's an agent, update agent session
    if ((event.participant as any).isAgent) {
      await handleAgentLeft(event);
    }
  } catch (error) {
    console.error('[Webhook] Error handling participant_left:', error);
  }
}

async function handleTrackPublished(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.track || !event.participant || !event.room) return;

  try {
    // Find room and participant
    const roomResult = await db.select().from(rooms).where(eq(rooms.roomSid, event.room.sid)).limit(1);
    if (roomResult.length === 0) return;

    const participantResult = await db.select().from(participants)
      .where(eq(participants.participantSid, event.participant.sid)).limit(1);
    if (participantResult.length === 0) return;

    await db.insert(tracks).values({
      trackSid: event.track.sid,
      roomId: roomResult[0].id,
      participantId: participantResult[0].id,
      trackName: event.track.name || 'unnamed',
      trackType: event.track.type,
      source: (event.track as any).source || 'unknown',
      publishedAt: new Date(),
      muted: event.track.muted || false,
      metadata: null,
    } as any);

    console.log(`[Webhook] Track published: ${event.track.type} by ${event.participant.identity}`);
  } catch (error) {
    console.error('[Webhook] Error handling track_published:', error);
  }
}

async function handleTrackUnpublished(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.track) return;

  try {
    // Get track to calculate duration
    const trackResult = await db.select().from(tracks)
      .where(eq(tracks.trackSid, event.track.sid)).limit(1);
    
    if (trackResult.length > 0) {
      const track = trackResult[0];
      const unpublishedAt = new Date();
      const durationSeconds = Math.floor((unpublishedAt.getTime() - track.publishedAt.getTime()) / 1000);
      
      await db.update(tracks)
        .set({
          unpublishedAt,
          durationSeconds,
        })
        .where(eq(tracks.trackSid, event.track.sid));

      console.log(`[Webhook] Track unpublished: ${event.track.sid} (duration: ${durationSeconds}s)`);
    }
  } catch (error) {
    console.error('[Webhook] Error handling track_unpublished:', error);
  }
}

async function handleAgentJoined(event: WebhookEvent, roomId: number) {
  const db = await getDb();
  if (!db || !event.participant) return;

  try {
    // Upsert agent
    const agentResult = await db.select().from(agents)
      .where(eq(agents.agentId, event.participant.identity)).limit(1);

    let agentDbId: number;

    if (agentResult.length === 0) {
      const inserted = await db.insert(agents).values({
        agentId: event.participant.identity,
        agentName: event.participant.name || event.participant.identity,
        agentType: event.participant.metadata ? JSON.parse(event.participant.metadata).type : 'unknown',
        totalSessions: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        metadata: event.participant.metadata ? JSON.parse(event.participant.metadata) : null,
      });
      // Get the last inserted ID
      const newAgentResult = await db.select().from(agents)
        .where(eq(agents.agentId, event.participant.identity)).limit(1);
      agentDbId = newAgentResult[0].id;
    } else {
      const agent = agentResult[0];
      await db.update(agents)
        .set({
          totalSessions: (agent.totalSessions || 0) + 1,
          lastSeenAt: new Date(),
        })
        .where(eq(agents.id, agent.id));
      agentDbId = agent.id;
    }

    // Find participant
    const participantResult = await db.select().from(participants)
      .where(eq(participants.participantSid, event.participant.sid)).limit(1);
    if (participantResult.length === 0) return;

    // Create agent session
    await db.insert(agentSessions).values({
      agentId: agentDbId,
      participantId: participantResult[0].id,
      roomId: roomId,
      joinedAt: new Date(),
      status: 'active',
    });

    console.log(`[Webhook] Agent session started: ${event.participant.identity}`);
  } catch (error) {
    console.error('[Webhook] Error handling agent joined:', error);
  }
}

async function handleAgentLeft(event: WebhookEvent) {
  const db = await getDb();
  if (!db || !event.participant) return;

  try {
    const participantResult = await db.select().from(participants)
      .where(eq(participants.participantSid, event.participant.sid)).limit(1);
    if (participantResult.length === 0) return;

    await db.update(agentSessions)
      .set({
        leftAt: new Date(),
        status: 'ended',
      })
      .where(eq(agentSessions.participantId, participantResult[0].id));

    console.log(`[Webhook] Agent session ended: ${event.participant.identity}`);
  } catch (error) {
    console.error('[Webhook] Error handling agent left:', error);
  }
}
