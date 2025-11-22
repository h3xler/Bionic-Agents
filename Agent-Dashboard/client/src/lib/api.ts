/**
 * tRPC API Client for LiveKit Dashboard
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/routers';
import superjson from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
});

// Convenience wrapper for common queries
export const api = {
  // Session Stats
  async getSessionStats() {
    return trpc.livekit.getSessionStats.query();
  },

  // Agent Stats
  async getAgentStats() {
    return trpc.livekit.getAgentStats.query();
  },

  // Cost Stats
  async getCostStats() {
    return trpc.livekit.getCostStats.query();
  },

  // Rooms List (renamed from getSessions)
  async getSessions(params: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}) {
    return trpc.livekit.getSessions.query({
      limit: params.limit || 50,
      offset: ((params.page || 1) - 1) * (params.limit || 50),
      startDate: params.startDate,
      endDate: params.endDate,
    });
  },

  // Participant Sessions List
  async getParticipantSessions(params: { page?: number; limit?: number; startDate?: string; endDate?: string; agentId?: string; sessionType?: string } = {}) {
    return trpc.livekit.getParticipantSessions.query({
      limit: params.limit || 50,
      offset: ((params.page || 1) - 1) * (params.limit || 50),
      startDate: params.startDate,
      endDate: params.endDate,
      agentId: params.agentId,
      sessionType: params.sessionType,
    });
  },

  // Agents List
  async getAgents(params: { startDate?: string; endDate?: string } = {}) {
    const agents = await trpc.livekit.getAgents.query(params);
    return { agents, total: agents.length };
  },

  // Costs List
  async getCosts(params: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}) {
    return trpc.livekit.getCosts.query({
      limit: params.limit || 50,
      offset: ((params.page || 1) - 1) * (params.limit || 50),
      startDate: params.startDate,
      endDate: params.endDate,
    });
  },

  // Detail pages
  async getSessionById(id: string) {
    return trpc.livekit.getSessionById.query({ id });
  },

  async getAgentById(id: string) {
    return trpc.livekit.getAgentById.query({ id });
  },

  async getParticipantSessionById(id: string) {
    return trpc.livekit.getParticipantSessionById.query({ id });
  },

  async getTrackById(id: string) {
    return trpc.livekit.getTrackById.query({ id });
  },

  // Cost configuration
  async getCostConfig() {
    return trpc.livekit.getCostConfig.query();
  },

  async updateCostConfig(config: {
    cost_per_participant_minute: number;
    cost_per_egress_gb: number;
    cost_per_ingress_gb: number;
    cost_per_recording_minute?: number;
  }) {
    return trpc.livekit.updateCostConfig.mutate(config);
  },

  async recalculateCosts() {
    return trpc.livekit.recalculateCosts.mutate();
  },
};
