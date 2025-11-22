import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

export const livekitRouter = router({
  getSessionStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        active_sessions: 0,
        total_sessions: 0,
        avg_duration_seconds: 0,
        total_participants_all_time: 0,
      };
    }

    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
          COUNT(*) as total_sessions,
          AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))) as avg_duration_seconds,
          SUM(participant_count) as total_participants_all_time
        FROM rooms
      `);
      
      // Extract rows from Drizzle result
      const rows = (result as any)?.rows || (result as unknown as any[]) || [];
      const stats = rows[0] as any;
      return {
        active_sessions: Number(stats?.active_sessions || 0),
        total_sessions: Number(stats?.total_sessions || 0),
        avg_duration_seconds: Number(stats?.avg_duration_seconds || 0),
        total_participants_all_time: Number(stats?.total_participants_all_time || 0),
      };
    } catch (error) {
      console.error("Error fetching session stats:", error);
      return {
        active_sessions: 0,
        total_sessions: 0,
        avg_duration_seconds: 0,
        total_participants_all_time: 0,
      };
    }
  }),

  getAgentStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        total_agents: 0,
        active_agents: 0,
        total_sessions_all_agents: 0,
        avg_session_duration: 0,
        agentTypes: [],
      };
    }

    try {
      const totalResult = await db.execute(sql`
        SELECT COUNT(DISTINCT id) as total_agents
        FROM agents
      `);

      const activeResult = await db.execute(sql`
        SELECT COUNT(DISTINCT a.id) as active_agents
        FROM agents a
        INNER JOIN agent_sessions ags ON a.id = ags.agent_id
        WHERE ags.status = 'active'
      `);

      const sessionsResult = await db.execute(sql`
        SELECT COUNT(*) as total_sessions
        FROM agent_sessions
      `);

      const avgDurationResult = await db.execute(sql`
        SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(left_at, NOW()) - joined_at))) as avg_duration
        FROM agent_sessions
        WHERE left_at IS NOT NULL
      `);

      const byTypeResult = await db.execute(sql`
        SELECT 
          agent_type as type, 
          COUNT(*) as count
        FROM agents
        WHERE agent_type IS NOT NULL
        GROUP BY agent_type
      `);

      // Extract rows from Drizzle results
      const totalRows = (totalResult as any)?.rows || (totalResult as unknown as any[]) || [];
      const activeRows = (activeResult as any)?.rows || (activeResult as unknown as any[]) || [];
      const sessionsRows = (sessionsResult as any)?.rows || (sessionsResult as unknown as any[]) || [];
      const avgDurationRows = (avgDurationResult as any)?.rows || (avgDurationResult as unknown as any[]) || [];
      const byTypeRows = (byTypeResult as any)?.rows || (byTypeResult as unknown as any[]) || [];
      
      const total = totalRows[0] as any;
      const active = activeRows[0] as any;
      const sessions = sessionsRows[0] as any;
      const avgDuration = avgDurationRows[0] as any;
      const byType = byTypeRows;

      return {
        total_agents: Number(total?.total_agents || 0),
        active_agents: Number(active?.active_agents || 0),
        total_sessions_all_agents: Number(sessions?.total_sessions || 0),
        avg_session_duration: Number(avgDuration?.avg_duration || 0),
        agentTypes: byType.map((row: any) => ({
          type: row.type || 'unknown',
          count: Number(row.count),
        })),
      };
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      return {
        total_agents: 0,
        active_agents: 0,
        total_sessions_all_agents: 0,
        avg_session_duration: 0,
        agentTypes: [],
      };
    }
  }),

  getCostStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        total_cost: 0,
        avg_cost_per_session: 0,
        total_participant_minutes: 0,
        total_egress_gb: 0,
        dailyTrend: [],
      };
    }

    try {
      const totalResult = await db.execute(sql`
        SELECT 
          SUM(total_cost) as total_cost,
          SUM(participant_minutes) as total_participant_minutes,
          SUM(egress_gb) as total_egress_gb
        FROM costs
      `);

      const avgResult = await db.execute(sql`
        SELECT AVG(total_cost) as avg_cost
        FROM costs
      `);

      const byDayResult = await db.execute(sql`
        SELECT 
          DATE(calculated_at) as date,
          SUM(total_cost) as cost
        FROM costs
        GROUP BY DATE(calculated_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      // Extract rows from Drizzle results
      const totalRows = (totalResult as any)?.rows || (totalResult as unknown as any[]) || [];
      const avgRows = (avgResult as any)?.rows || (avgResult as unknown as any[]) || [];
      const byDayRows = (byDayResult as any)?.rows || (byDayResult as unknown as any[]) || [];
      
      const total = totalRows[0] as any;
      const avg = avgRows[0] as any;
      const byDay = byDayRows;

      return {
        total_cost: Number(total?.total_cost || 0),
        avg_cost_per_session: Number(avg?.avg_cost || 0),
        total_participant_minutes: Number(total?.total_participant_minutes || 0),
        total_egress_gb: Number(total?.total_egress_gb || 0),
        dailyTrend: byDay.map((row: any) => ({
          date: row.date,
          cost: Number(row.cost),
        })),
      };
    } catch (error) {
      console.error("Error fetching cost stats:", error);
      return {
        total_cost: 0,
        avg_cost_per_session: 0,
        total_participant_minutes: 0,
        total_egress_gb: 0,
        dailyTrend: [],
      };
    }
  }),

  getSessions: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { sessions: [], total: 0 };

      try {
        let dateFilter = sql`1=1`;
        if (input.startDate && input.endDate) {
          dateFilter = sql`r.started_at BETWEEN ${input.startDate} AND ${input.endDate}`;
        }

        const sessionsResult = await db.execute(sql`
          SELECT 
            r.*,
            EXTRACT(EPOCH FROM (COALESCE(r.ended_at, NOW()) - r.started_at))::integer as duration_seconds,
            (r.status = 'active') as is_active,
            COUNT(DISTINCT p.id) as total_participants,
            COUNT(DISTINCT CASE WHEN p.left_at IS NULL THEN p.id END) as current_participants,
            COUNT(DISTINCT t.id) as total_tracks,
            COALESCE(MAX(c.total_cost), 0) as total_cost
          FROM rooms r
          LEFT JOIN participants p ON r.id = p.room_id
          LEFT JOIN tracks t ON r.id = t.room_id
          LEFT JOIN costs c ON r.id = c.room_id
          WHERE ${dateFilter}
          GROUP BY r.id
          ORDER BY r.started_at DESC
          LIMIT ${input.limit}
          OFFSET ${input.offset}
        `);

        const countResult = await db.execute(sql`
          SELECT COUNT(*) as total
          FROM rooms r
          WHERE ${dateFilter}
        `);

        // Extract rows from Drizzle result (result.rows or result itself if array)
        const sessions = (sessionsResult as any)?.rows || (sessionsResult as unknown as any[]) || [];
        const countRows = (countResult as any)?.rows || (countResult as unknown as any[]) || [];
        const count = countRows[0] as any;

        return {
          sessions: sessions as unknown as any[],
          total: Number(count?.total || 0),
        };
      } catch (error) {
        console.error("Error fetching sessions:", error);
        return { sessions: [], total: 0 };
      }
    }),

  getParticipantSessions: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      agentId: z.string().optional(),
      sessionType: z.enum(["all", "user", "agent"]).optional().default("all"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { sessions: [], total: 0 };

      try {
        let dateFilter = sql`1=1`;
        if (input.startDate && input.endDate) {
          dateFilter = sql`p.joined_at BETWEEN ${input.startDate} AND ${input.endDate}`;
        }

        let agentFilter = sql`1=1`;
        if (input.agentId) {
          // Filter by agent_id when agentId is provided
          agentFilter = sql`p.is_agent = true AND a.agent_id = ${input.agentId}`;
        }

        let typeFilter = sql`1=1`;
        if (input.sessionType === "user") {
          typeFilter = sql`p.is_agent = false`;
        } else if (input.sessionType === "agent") {
          typeFilter = sql`p.is_agent = true`;
        }

        const sessionsResult = await db.execute(sql`
          SELECT 
            p.*,
            r.room_name,
            r.room_sid,
            r.id as room_id,
            a.agent_name,
            a.agent_id as agent_identity,
            EXTRACT(EPOCH FROM (COALESCE(p.left_at, NOW()) - p.joined_at))::integer as duration_seconds
          FROM participants p
          INNER JOIN rooms r ON p.room_id = r.id
          LEFT JOIN agents a ON p.is_agent = true AND a.agent_id = p.identity
          WHERE ${dateFilter} AND ${typeFilter} AND ${agentFilter}
          ORDER BY p.joined_at DESC
          LIMIT ${input.limit}
          OFFSET ${input.offset}
        `);

        const countResult = await db.execute(sql`
          SELECT COUNT(*) as total
          FROM participants p
          INNER JOIN rooms r ON p.room_id = r.id
          LEFT JOIN agents a ON p.is_agent = true AND a.agent_id = p.identity
          WHERE ${dateFilter} AND ${typeFilter} AND ${agentFilter}
        `);

        // Extract rows from Drizzle results
        const sessions = (sessionsResult as any)?.rows || (sessionsResult as unknown as any[]) || [];
        const countRows = (countResult as any)?.rows || (countResult as unknown as any[]) || [];
        const count = countRows[0] as any;

        return {
          sessions: sessions as unknown as any[],
          total: Number(count?.total || 0),
        };
      } catch (error) {
        console.error("Error fetching participant sessions:", error);
        return { sessions: [], total: 0 };
      }
    }),

  getAgents: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        let dateFilter = sql`1=1`;
        if (input.startDate && input.endDate) {
          dateFilter = sql`a.first_seen_at BETWEEN ${input.startDate} AND ${input.endDate}`;
        }

        const agentsResult = await db.execute(sql`
          SELECT 
            a.*,
            a.agent_id as agent_identity,
            a.agent_name as agent_name,
            COUNT(DISTINCT ags.id) as session_count
          FROM agents a
          LEFT JOIN agent_sessions ags ON a.id = ags.agent_id
          WHERE ${dateFilter}
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `);

        // Extract rows from Drizzle result
        const agents = (agentsResult as any)?.rows || (agentsResult as unknown as any[]) || [];
        return agents as unknown as any[];
      } catch (error) {
        console.error("Error fetching agents:", error);
        return [];
      }
    }),

  getCosts: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { costs: [], total: 0 };

      try {
        let dateFilter = sql`1=1`;
        if (input.startDate && input.endDate) {
          dateFilter = sql`c.calculated_at BETWEEN ${input.startDate} AND ${input.endDate}`;
        }

        const costsResult = await db.execute(sql`
          SELECT 
            c.*,
            r.room_sid,
            r.room_name,
            r.started_at,
            r.ended_at
          FROM costs c
          JOIN rooms r ON c.room_id = r.id
          WHERE ${dateFilter}
          ORDER BY c.calculated_at DESC
          LIMIT ${input.limit}
          OFFSET ${input.offset}
        `);

        const countResult = await db.execute(sql`
          SELECT COUNT(*) as total
          FROM costs c
          WHERE ${dateFilter}
        `);

        // Extract rows from Drizzle results
        const costs = (costsResult as any)?.rows || (costsResult as unknown as any[]) || [];
        const countRows = (countResult as any)?.rows || (countResult as unknown as any[]) || [];
        const count = countRows[0] as any;

        return {
          costs: costs as unknown as any[],
          total: Number(count?.total || 0),
        };
      } catch (error) {
        console.error("Error fetching costs:", error);
        return { costs: [], total: 0 };
      }
    }),

  getCostConfig: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    try {
      const result = await db.execute(sql`
        SELECT *
        FROM cost_config
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `);

      // Extract rows from Drizzle result
      const rows = (result as any)?.rows || (result as unknown as any[]) || [];
      const config = rows[0];
      
      if (!config) return null;
      
      // Convert from integer storage (micro-cents/cents) to decimal for frontend
      return {
        ...config,
        cost_per_participant_minute: Number(config.cost_per_participant_minute) / 1000000, // micro-cents to dollars
        cost_per_egress_gb: Number(config.cost_per_egress_gb) / 100, // cents to dollars
        cost_per_ingress_gb: Number(config.cost_per_ingress_gb || 0) / 100, // cents to dollars
        cost_per_recording_minute: Number(config.cost_per_recording_minute || 0) / 1000000, // micro-cents to dollars
      };
    } catch (error) {
      console.error("Error fetching cost config:", error);
      return null;
    }
  }),

  updateCostConfig: publicProcedure
    .input(z.object({
      cost_per_participant_minute: z.number(),
      cost_per_egress_gb: z.number(),
      cost_per_ingress_gb: z.number(),
      cost_per_recording_minute: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Convert from decimal dollars to integer storage
        // cost_per_participant_minute: dollars -> micro-cents (multiply by 1,000,000)
        // cost_per_egress_gb: dollars -> cents (multiply by 100)
        // cost_per_ingress_gb: dollars -> cents (multiply by 100)
        // cost_per_recording_minute: dollars -> micro-cents (multiply by 1,000,000)
        const participantMinuteCents = Math.round(input.cost_per_participant_minute * 1000000);
        const egressGbCents = Math.round(input.cost_per_egress_gb * 100);
        const ingressGbCents = Math.round((input.cost_per_ingress_gb || 0) * 100);
        const recordingMinuteCents = Math.round((input.cost_per_recording_minute || 0) * 1000000);

        // Deactivate old configs
        await db.execute(sql`
          UPDATE cost_config
          SET is_active = false
        `);

        // Insert new config
        await db.execute(sql`
          INSERT INTO cost_config (
            cost_per_participant_minute,
            cost_per_egress_gb,
            cost_per_ingress_gb,
            cost_per_recording_minute,
            is_active,
            effective_from
          ) VALUES (
            ${participantMinuteCents},
            ${egressGbCents},
            ${ingressGbCents},
            ${recordingMinuteCents},
            true,
            NOW()
          )
        `);

        return { success: true };
      } catch (error) {
        console.error("Error updating cost config:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        throw new Error(`Failed to update cost configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  recalculateCosts: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // Get current cost config
      const configResult = await db.execute(sql`
        SELECT *
        FROM cost_config
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `);

      // Extract rows from Drizzle result
      const configRows = (configResult as any)?.rows || (configResult as unknown as any[]) || [];
      const config = configRows[0] as any;
      if (!config) {
        throw new Error("No cost configuration found");
      }

      // Delete existing costs
      await db.execute(sql`
        DELETE FROM costs
      `);

      // Recalculate costs for all ended sessions
      const sessionsResult = await db.execute(sql`
        SELECT 
          r.id as room_id,
          COALESCE(SUM(p.duration_seconds), 0) as total_participant_seconds,
          COALESCE(SUM(t.egress_bytes), 0) as total_egress_bytes,
          COALESCE(SUM(t.ingress_bytes), 0) as total_ingress_bytes
        FROM rooms r
        LEFT JOIN participants p ON r.id = p.room_id
        LEFT JOIN tracks t ON r.id = t.room_id
        WHERE r.ended_at IS NOT NULL
        GROUP BY r.id
      `);

      // Extract rows from Drizzle result
      const sessions = (sessionsResult as any)?.rows || (sessionsResult as unknown as any[]) || [];

      for (const session of sessions) {
        const participantMinutes = Math.ceil(Number(session.total_participant_seconds) / 60);
        const egressGb = Math.ceil(Number(session.total_egress_bytes) / (1024 * 1024 * 1024));
        const ingressGb = Math.ceil(Number(session.total_ingress_bytes) / (1024 * 1024 * 1024));

        const participantCost = Math.round(participantMinutes * Number(config.cost_per_participant_minute));
        const egressCost = Math.round(egressGb * Number(config.cost_per_egress_gb));
        const ingressCost = Math.round(ingressGb * Number(config.cost_per_ingress_gb || 0));
        const totalCost = participantCost + egressCost + ingressCost;

        await db.execute(sql`
          INSERT INTO costs (
            room_id,
            participant_minutes,
            egress_gb,
            ingress_gb,
            participant_cost,
            egress_cost,
            ingress_cost,
            total_cost,
            calculated_at
          ) VALUES (
            ${session.room_id},
            ${participantMinutes},
            ${egressGb},
            ${ingressGb},
            ${participantCost},
            ${egressCost},
            ${ingressCost},
            ${totalCost},
            NOW()
          )
        `);
      }

      return { success: true, recalculated: (sessions as any[]).length };
    } catch (error) {
      console.error("Error recalculating costs:", error);
      throw new Error("Failed to recalculate costs");
    }
  }),

  getSessionById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        // Try to find by room_sid first, then by id
        const sessionResult = await db.execute(sql`
          SELECT 
            r.*,
            EXTRACT(EPOCH FROM (COALESCE(r.ended_at, NOW()) - r.started_at))::integer as duration_seconds,
            (r.status = 'active') as is_active,
            COALESCE(c.total_cost, 0) as total_cost,
            COALESCE(c.participant_minutes, 0) as participant_minutes,
            COALESCE(c.egress_gb, 0) as egress_gb,
            COALESCE(c.ingress_gb, 0) as ingress_gb,
            COALESCE(c.participant_cost, 0) as participant_cost,
            COALESCE(c.egress_cost, 0) as egress_cost,
            COALESCE(c.ingress_cost, 0) as ingress_cost,
            COALESCE(SUM(t.egress_bytes), 0) as total_egress_bytes,
            COALESCE(SUM(t.ingress_bytes), 0) as total_ingress_bytes
          FROM rooms r
          LEFT JOIN costs c ON r.id = c.room_id
          LEFT JOIN tracks t ON r.id = t.room_id
          WHERE r.room_sid = ${input.id} OR r.id::text = ${input.id}
          GROUP BY r.id, c.id
        `);

        const rows = (sessionResult as any)?.rows || (sessionResult as unknown as any[]) || [];
        const session = rows[0];
        if (!session) return null;

        const participants = await db.execute(sql`
          SELECT 
            p.*,
            EXTRACT(EPOCH FROM (COALESCE(p.left_at, NOW()) - p.joined_at))::integer as duration_seconds,
            COUNT(DISTINCT t.id) as track_count,
            COALESCE(SUM(t.egress_bytes), 0) as total_egress_bytes,
            COALESCE(SUM(t.ingress_bytes), 0) as total_ingress_bytes,
            a.agent_name,
            a.agent_id as agent_identity
          FROM participants p
          LEFT JOIN tracks t ON p.id = t.participant_id
          LEFT JOIN agents a ON p.is_agent = true AND a.agent_id = p.identity
          WHERE p.room_id = ${session.id}
          GROUP BY p.id, a.id
          ORDER BY p.joined_at DESC
        `);

        const tracks = await db.execute(sql`
          SELECT 
            t.*,
            p.identity as participant_identity,
            p.name as participant_name,
            p.is_agent,
            EXTRACT(EPOCH FROM (COALESCE(t.unpublished_at, NOW()) - t.published_at))::integer as duration_seconds
          FROM tracks t
          JOIN participants p ON t.participant_id = p.id
          WHERE t.room_id = ${session.id}
          ORDER BY t.published_at DESC
        `);

        const participantsRows = (participants as any)?.rows || (participants as unknown as any[]) || [];
        const tracksRows = (tracks as any)?.rows || (tracks as unknown as any[]) || [];

        return {
          session,
          participants: participantsRows,
          tracks: tracksRows,
        };
      } catch (error) {
        console.error("Error fetching session by ID:", error);
        return null;
      }
    }),

  getAgentById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const agentResult = await db.execute(sql`
          SELECT *
          FROM agents
          WHERE id = ${input.id} OR agent_id = ${input.id}
        `);

        const rows = (agentResult as any)?.rows || (agentResult as unknown as any[]) || [];
        const agent = rows[0];
        if (!agent) return null;

        const sessions = await db.execute(sql`
          SELECT 
            ags.*,
            r.room_sid,
            r.room_name,
            r.id as room_id,
            r.started_at,
            r.ended_at,
            r.status as room_status,
            EXTRACT(EPOCH FROM (COALESCE(ags.left_at, NOW()) - ags.joined_at))::integer as duration_seconds,
            p.identity as participant_identity,
            COUNT(DISTINCT t.id) as tracks_published,
            COALESCE(SUM(t.egress_bytes), 0) as total_egress_bytes,
            COALESCE(SUM(t.ingress_bytes), 0) as total_ingress_bytes
          FROM agent_sessions ags
          JOIN rooms r ON ags.room_id = r.id
          JOIN participants p ON ags.participant_id = p.id
          LEFT JOIN tracks t ON p.id = t.participant_id
          WHERE ags.agent_id = ${agent.id}
          GROUP BY ags.id, r.id, p.id
          ORDER BY ags.joined_at DESC
        `);

        const sessionsRows = (sessions as any)?.rows || (sessions as unknown as any[]) || [];

        return {
          agent,
          sessions: sessionsRows,
        };
      } catch (error) {
        console.error("Error fetching agent by ID:", error);
        return null;
      }
    }),

  getParticipantSessionById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const participantResult = await db.execute(sql`
          SELECT 
            p.*,
            r.room_sid,
            r.room_name,
            r.id as room_id,
            r.started_at as room_started_at,
            r.ended_at as room_ended_at,
            r.status as room_status,
            a.agent_name,
            a.agent_id as agent_identity,
            a.agent_type,
            EXTRACT(EPOCH FROM (COALESCE(p.left_at, NOW()) - p.joined_at))::integer as duration_seconds,
            COUNT(DISTINCT t.id) as track_count,
            COALESCE(SUM(t.egress_bytes), 0) as total_egress_bytes,
            COALESCE(SUM(t.ingress_bytes), 0) as total_ingress_bytes,
            COALESCE(c.total_cost, 0) as room_total_cost
          FROM participants p
          INNER JOIN rooms r ON p.room_id = r.id
          LEFT JOIN agents a ON p.is_agent = true AND a.agent_id = p.identity
          LEFT JOIN tracks t ON p.id = t.participant_id
          LEFT JOIN costs c ON r.id = c.room_id
          WHERE p.id::text = ${input.id} OR p.participant_sid = ${input.id}
          GROUP BY p.id, r.id, a.id, c.id
        `);

        const rows = (participantResult as any)?.rows || (participantResult as unknown as any[]) || [];
        const participant = rows[0];
        if (!participant) return null;

        const tracks = await db.execute(sql`
          SELECT 
            t.*,
            EXTRACT(EPOCH FROM (COALESCE(t.unpublished_at, NOW()) - t.published_at))::integer as duration_seconds
          FROM tracks t
          WHERE t.participant_id = ${participant.id}
          ORDER BY t.published_at DESC
        `);

        const tracksRows = (tracks as any)?.rows || (tracks as unknown as any[]) || [];

        return {
          participant,
          tracks: tracksRows,
        };
      } catch (error) {
        console.error("Error fetching participant session by ID:", error);
        return null;
      }
    }),

  getTrackById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const { tracks } = await import("../drizzle/livekitSchema");
        const { eq } = await import("drizzle-orm");
        
        const track = await db.select().from(tracks).where(eq(tracks.id, input.id)).limit(1);
        return track[0] || null;
      } catch (error) {
        console.error("Error fetching track:", error);
        throw error;
      }
    }),

  // Runtime metrics
  getRuntimeStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        activeInstances: 0,
        totalInstances: 0,
        totalCapacity: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      };
    }

    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(CASE WHEN status = 'running' THEN 1 END) as active_instances,
          COUNT(*) as total_instances,
          SUM(active_agent_count) as total_capacity,
          AVG(cpu_usage) as avg_cpu_usage,
          AVG(memory_usage) as avg_memory_usage
        FROM agent_runtime_instances
      `);
      
      const rows = (result as any)?.rows || (result as unknown as any[]) || [];
      const stats = rows[0] as any;
      return {
        activeInstances: Number(stats?.active_instances || 0),
        totalInstances: Number(stats?.total_instances || 0),
        totalCapacity: Number(stats?.total_capacity || 0),
        avgCpuUsage: Number(stats?.avg_cpu_usage || 0),
        avgMemoryUsage: Number(stats?.avg_memory_usage || 0),
      };
    } catch (error) {
      console.error("Error fetching runtime stats:", error);
      return {
        activeInstances: 0,
        totalInstances: 0,
        totalCapacity: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      };
    }
  }),

  // Tenant metrics
  getTenantStats: publicProcedure
    .input(z.object({ tenantId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        if (input.tenantId) {
          // Get stats for specific tenant
          const result = await db.execute(sql`
            SELECT 
              COUNT(DISTINCT agent_id) as active_agents,
              COUNT(*) as total_sessions,
              SUM(duration_seconds) as total_duration_seconds,
              SUM(COALESCE((SELECT total_cost FROM session_metrics WHERE session_id = agent_instance_sessions.session_id), 0)) as total_cost,
              AVG(COALESCE((SELECT avg_llm_latency FROM session_metrics WHERE session_id = agent_instance_sessions.session_id), 0)) as avg_latency,
              COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
            FROM agent_instance_sessions
            WHERE tenant_id = ${input.tenantId}
            AND date_trunc('day', started_at) = date_trunc('day', CURRENT_DATE)
          `);
          
          const rows = (result as any)?.rows || (result as unknown as any[]) || [];
          const stats = rows[0] as any;
          return {
            tenantId: input.tenantId,
            activeAgents: Number(stats?.active_agents || 0),
            totalSessions: Number(stats?.total_sessions || 0),
            totalDurationSeconds: Number(stats?.total_duration_seconds || 0),
            totalCost: Number(stats?.total_cost || 0),
            avgLatency: Number(stats?.avg_latency || 0),
            errorCount: Number(stats?.error_count || 0),
          };
        } else {
          // Get stats for all tenants
          const result = await db.execute(sql`
            SELECT 
              tenant_id,
              COUNT(DISTINCT agent_id) as active_agents,
              COUNT(*) as total_sessions,
              SUM(duration_seconds) as total_duration_seconds,
              SUM(COALESCE((SELECT total_cost FROM session_metrics WHERE session_id = agent_instance_sessions.session_id), 0)) as total_cost
            FROM agent_instance_sessions
            WHERE date_trunc('day', started_at) = date_trunc('day', CURRENT_DATE)
            GROUP BY tenant_id
          `);
          
          const rows = (result as any)?.rows || (result as unknown as any[]) || [];
          return rows.map((row: any) => ({
            tenantId: Number(row.tenant_id),
            activeAgents: Number(row.active_agents || 0),
            totalSessions: Number(row.total_sessions || 0),
            totalDurationSeconds: Number(row.total_duration_seconds || 0),
            totalCost: Number(row.total_cost || 0),
          }));
        }
      } catch (error) {
        console.error("Error fetching tenant stats:", error);
        throw error;
      }
    }),

  // Agent instance metrics (from Agent Builder)
  getAgentInstanceStats: publicProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const result = await db.execute(sql`
          SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
            SUM(duration_seconds) as total_duration_seconds,
            AVG(COALESCE((SELECT avg_llm_latency FROM session_metrics WHERE session_id = agent_instance_sessions.session_id), 0)) as avg_latency,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
            SUM(COALESCE((SELECT total_cost FROM session_metrics WHERE session_id = agent_instance_sessions.session_id), 0)) as total_cost
          FROM agent_instance_sessions
          WHERE agent_id = ${input.agentId}
        `);
        
        const rows = (result as any)?.rows || (result as unknown as any[]) || [];
        const stats = rows[0] as any;
        return {
          agentId: input.agentId,
          totalSessions: Number(stats?.total_sessions || 0),
          activeSessions: Number(stats?.active_sessions || 0),
          totalDurationSeconds: Number(stats?.total_duration_seconds || 0),
          avgLatency: Number(stats?.avg_latency || 0),
          errorCount: Number(stats?.error_count || 0),
          totalCost: Number(stats?.total_cost || 0),
        };
      } catch (error) {
        console.error("Error fetching agent instance stats:", error);
        throw error;
      }
    }),

  // Session-level metrics
  getSessionMetrics: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const { sessionMetrics } = await import("../drizzle/livekitSchema");
        const { eq } = await import("drizzle-orm");
        
        const metrics = await db.select()
          .from(sessionMetrics)
          .where(eq(sessionMetrics.sessionId, input.sessionId))
          .limit(1);
        
        return metrics[0] || null;
      } catch (error) {
        console.error("Error fetching session metrics:", error);
        throw error;
      }
    }),

  // LangFuse traces for agent
  getLangFuseTraces: publicProcedure
    .input(z.object({ 
      agentId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const { langfuseTraces } = await import("../drizzle/livekitSchema");
        const { eq, and, gte, lte } = await import("drizzle-orm");
        
        let query = db.select().from(langfuseTraces).where(eq(langfuseTraces.agentId, input.agentId));
        
        if (input.startDate) {
          query = query.where(and(eq(langfuseTraces.agentId, input.agentId), gte(langfuseTraces.timestamp, new Date(input.startDate))));
        }
        if (input.endDate) {
          query = query.where(and(eq(langfuseTraces.agentId, input.agentId), lte(langfuseTraces.timestamp, new Date(input.endDate))));
        }
        
        const traces = await query.limit(100);
        return traces;
      } catch (error) {
        console.error("Error fetching LangFuse traces:", error);
        throw error;
      }
    }),

  getTrackById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const trackResult = await db.execute(sql`
          SELECT 
            t.*,
            p.identity as participant_identity,
            p.name as participant_name,
            p.is_agent,
            p.joined_at as participant_joined_at,
            p.left_at as participant_left_at,
            r.room_sid,
            r.room_name,
            r.id as room_id,
            r.started_at as room_started_at,
            r.ended_at as room_ended_at,
            a.agent_name,
            a.agent_id as agent_identity,
            EXTRACT(EPOCH FROM (COALESCE(t.unpublished_at, NOW()) - t.published_at))::integer as duration_seconds
          FROM tracks t
          JOIN participants p ON t.participant_id = p.id
          JOIN rooms r ON t.room_id = r.id
          LEFT JOIN agents a ON p.is_agent = true AND a.agent_id = p.identity
          WHERE t.id::text = ${input.id} OR t.track_sid = ${input.id}
        `);

        const rows = (trackResult as any)?.rows || (trackResult as unknown as any[]) || [];
        const track = rows[0];
        if (!track) return null;

        return { track };
      } catch (error) {
        console.error("Error fetching track by ID:", error);
        return null;
      }
    }),
});
