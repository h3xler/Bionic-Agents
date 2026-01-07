import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  livekit: router({
    getToken: publicProcedure
      .input(z.object({
        agentId: z.number(),
        participantName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateLiveKitToken, getLiveKitUrl } = await import("./livekit");
        const { getAgentById } = await import("./db");

        const agent = await getAgentById(input.agentId);
        if (!agent) {
          throw new Error("Agent not found");
        }

        const roomName = `agent-${agent.id}-room`;
        const participantName = input.participantName || "Guest";

        const token = await generateLiveKitToken(roomName, participantName);
        const url = await getLiveKitUrl();

        return {
          token,
          url,
          roomName,
          agentName: agent.name,
        };
      }),
  }),

  settings: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Only admins can view settings
      if (ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }
      const { getAllSettings } = await import("./settings");
      return await getAllSettings();
    }),

    update: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admins can update settings
        if (ctx.user.role !== "admin") {
          throw new Error("Access denied");
        }
        const { setSetting } = await import("./settings");
        await setSetting(input.key, input.value);
        return { success: true };
      }),
  }),

  tenants: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const { getTenantByUserId } = await import("./db");
      const tenant = await getTenantByUserId(ctx.user.id);

      // Auto-create tenant if doesn't exist
      if (!tenant) {
        const { createTenant } = await import("./db");
        const tenantId = await createTenant({
          userId: ctx.user.id,
          name: ctx.user.name || `Tenant ${ctx.user.id}`,
          slug: `tenant-${ctx.user.id}`,
          status: "active",
        });
        return await getTenantByUserId(ctx.user.id);
      }

      return tenant;
    }),

    updateQuota: protectedProcedure
      .input(z.object({
        resourceQuota: z.object({
          cpu: z.string().optional(),
          memory: z.string().optional(),
          maxAgents: z.number().optional(),
        })
      }))
      .mutation(async ({ input, ctx }) => {
        const { getTenantByUserId, updateTenant } = await import("./db");
        const tenant = await getTenantByUserId(ctx.user.id);

        if (!tenant) {
          throw new Error("Tenant not found");
        }

        const currentQuota = tenant.resourceQuota ? JSON.parse(tenant.resourceQuota) : {};
        const updatedQuota = { ...currentQuota, ...input.resourceQuota };

        await updateTenant(tenant.id, {
          resourceQuota: JSON.stringify(updatedQuota),
        });

        return { success: true };
      }),
  }),

  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getAgentsByUserId } = await import("./db");
      return getAgentsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAgentById } = await import("./db");
        const agent = await getAgentById(input.id);

        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        return agent;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        sttProvider: z.string().min(1),
        sttConfig: z.string().optional(),
        ttsProvider: z.string().min(1),
        ttsConfig: z.string().optional(),
        voiceId: z.string().optional(),
        llmProvider: z.string().min(1),
        llmModel: z.string().optional(),
        llmConfig: z.string().optional(),
        visionEnabled: z.number().min(0).max(1).default(0),
        screenShareEnabled: z.number().min(0).max(1).default(0),
        transcribeEnabled: z.number().min(0).max(1).default(0),
        languages: z.string().optional(),
        avatarModel: z.string().optional(),
        systemPrompt: z.string().optional(),
        initialGreeting: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.6),
        mcpGatewayUrl: z.string().optional(),
        mcpConfig: z.string().optional(),
        widgetConfig: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createAgent, getTenantByUserId, createTenant } = await import("./db");

        // Ensure tenant exists
        let tenant = await getTenantByUserId(ctx.user.id);
        if (!tenant) {
          const tenantId = await createTenant({
            userId: ctx.user.id,
            name: ctx.user.name || `Tenant ${ctx.user.id}`,
            slug: `tenant-${ctx.user.id}`,
            status: "active",
          });
          tenant = await getTenantByUserId(ctx.user.id);
        }

        if (!tenant) {
          throw new Error("Failed to create tenant");
        }

        const agentId = await createAgent({
          ...input,
          userId: ctx.user.id,
          tenantId: tenant.id,
          deploymentMode: "shared", // Default to shared mode
        });
        return { id: agentId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        sttProvider: z.string().optional(),
        sttConfig: z.string().optional(),
        ttsProvider: z.string().optional(),
        ttsConfig: z.string().optional(),
        voiceId: z.string().optional(),
        llmProvider: z.string().optional(),
        llmModel: z.string().optional(),
        llmConfig: z.string().optional(),
        visionEnabled: z.number().optional(),
        screenShareEnabled: z.number().optional(),
        transcribeEnabled: z.number().optional(),
        languages: z.string().optional(),
        avatarModel: z.string().optional(),
        systemPrompt: z.string().optional(),
        initialGreeting: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        mcpGatewayUrl: z.string().optional(),
        mcpConfig: z.string().optional(),
        deploymentStatus: z.enum(["draft", "deploying", "deployed", "failed", "stopped"]).optional(),
        kubernetesManifest: z.string().optional(),
        widgetConfig: z.string().optional(),
        widgetSnippet: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentById, updateAgent } = await import("./db");
        const agent = await getAgentById(input.id);

        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        const { id, ...updates } = input;
        await updateAgent(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentById, deleteAgent } = await import("./db");
        const agent = await getAgentById(input.id);

        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        await deleteAgent(input.id);
        return { success: true };
      }),

    generateManifest: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentById, updateAgent } = await import("./db");
        const { generateK8sManifests, combineManifests, DeploymentMode } = await import("./k8s");

        const agent = await getAgentById(input.id);
        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        const mode = agent.deploymentMode === 'dedicated' ? DeploymentMode.DEDICATED : DeploymentMode.SHARED;
        const manifests = await generateK8sManifests(agent, mode);
        const combinedManifest = combineManifests(manifests);

        // Save manifest to database
        await updateAgent(input.id, {
          kubernetesManifest: combinedManifest,
        });

        return { manifest: combinedManifest };
      }),

    deploy: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentById, updateAgent } = await import("./db");
        const { deployAgent } = await import("./k8s-client");

        const agent = await getAgentById(input.id);
        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        // Update status to deploying
        await updateAgent(input.id, {
          deploymentStatus: "deploying",
        });

        try {
          // Deploy to Kubernetes cluster
          const result = await deployAgent(agent);

          if (result.success) {
            await updateAgent(input.id, {
              deploymentStatus: "deployed",
            });
            return {
              success: true,
              status: "deployed",
              message: result.message,
              resources: result.resources,
            };
          } else {
            await updateAgent(input.id, {
              deploymentStatus: "failed",
            });
            return {
              success: false,
              status: "failed",
              message: result.message,
            };
          }
        } catch (error: any) {
          await updateAgent(input.id, {
            deploymentStatus: "failed",
          });
          throw new Error(`Deployment failed: ${error.message}`);
        }
      }),

    undeploy: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentById, updateAgent } = await import("./db");
        const { undeployAgent } = await import("./k8s-client");

        const agent = await getAgentById(input.id);
        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        try {
          // Undeploy from Kubernetes cluster
          const result = await undeployAgent(input.id);

          if (result.success) {
            await updateAgent(input.id, {
              deploymentStatus: "stopped",
            });
            return {
              success: true,
              message: result.message,
              resources: result.resources,
            };
          } else {
            return {
              success: false,
              message: result.message,
            };
          }
        } catch (error: any) {
          throw new Error(`Undeployment failed: ${error.message}`);
        }
      }),

    getDeploymentStatus: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAgentById } = await import("./db");
        const { getAgentDeploymentStatus } = await import("./k8s-client");

        const agent = await getAgentById(input.id);
        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        const status = await getAgentDeploymentStatus(input.id);
        return status;
      }),

    getLogs: protectedProcedure
      .input(z.object({
        id: z.number(),
        tailLines: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const { getAgentById } = await import("./db");
        const { getAgentLogs } = await import("./k8s-client");

        const agent = await getAgentById(input.id);
        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        const logs = await getAgentLogs(input.id, input.tailLines || 100);
        return logs;
      }),

    generateWidget: protectedProcedure
      .input(z.object({
        id: z.number(),
        theme: z.enum(["light", "dark"]).optional(),
        position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).optional(),
        primaryColor: z.string().optional(),
        buttonText: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentById, updateAgent } = await import("./db");
        const { generateWidgetSnippet, saveWidgetConfig } = await import("./widget");

        const agent = await getAgentById(input.id);
        if (!agent || agent.userId !== ctx.user.id) {
          throw new Error("Agent not found or access denied");
        }

        const { id, ...widgetConfig } = input;
        const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://api.example.com";
        const snippet = generateWidgetSnippet(agent, baseUrl, widgetConfig);
        const configJson = saveWidgetConfig(widgetConfig);

        // Save widget configuration and snippet to database
        await updateAgent(id, {
          widgetConfig: configJson,
          widgetSnippet: snippet,
        });

        return { snippet, config: widgetConfig };
      }),
  }),
});

export type AppRouter = typeof appRouter;
