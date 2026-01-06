/**
 * Public API routes for Agent-Builder
 * These routes do not require authentication and are used by Agent-Runtime
 */

import type { Express } from "express";
import { getAgentById } from "./db";

export function registerPublicApiRoutes(app: Express) {
    /**
     * GET /api/agents/:id/config
     * Returns agent configuration for Agent-Runtime
     * No authentication required
     */
    app.get("/api/agents/:id/config", async (req, res) => {
        try {
            const agentId = parseInt(req.params.id, 10);

            if (isNaN(agentId)) {
                return res.status(400).json({ error: "Invalid agent ID" });
            }

            const agent = await getAgentById(agentId);

            if (!agent) {
                return res.status(404).json({ error: "Agent not found" });
            }

            // Return agent configuration for runtime
            res.json({
                id: agent.id,
                name: agent.name,
                description: agent.description,
                sttProvider: agent.sttProvider,
                sttConfig: agent.sttConfig ? JSON.parse(agent.sttConfig) : null,
                ttsProvider: agent.ttsProvider,
                ttsConfig: agent.ttsConfig ? JSON.parse(agent.ttsConfig) : null,
                voiceId: agent.voiceId,
                llmProvider: agent.llmProvider,
                llmModel: agent.llmModel,
                llmConfig: agent.llmConfig ? JSON.parse(agent.llmConfig) : null,
                systemPrompt: agent.systemPrompt,
                initialGreeting: (agent as any).initial_greeting || "",
                temperature: (agent as any).temperature || 0.6,
                visionEnabled: agent.visionEnabled === 1,
                screenShareEnabled: agent.screenShareEnabled === 1,
                transcribeEnabled: agent.transcribeEnabled === 1,
                languages: agent.languages,
                avatarModel: agent.avatarModel,
                mcpGatewayUrl: agent.mcpGatewayUrl,
                mcpConfig: agent.mcpConfig ? JSON.parse(agent.mcpConfig) : null,
                maxConcurrentSessions: agent.maxConcurrentSessions || 10,
            });
        } catch (error: any) {
            console.error("[Public API] Error fetching agent config:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
}
