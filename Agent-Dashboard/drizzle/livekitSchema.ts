import { integer, pgTable, text, timestamp, varchar, boolean, json, serial, pgEnum, date } from "drizzle-orm/pg-core";

export const roomStatusEnum = pgEnum("room_status", ["active", "ended"]);
export const agentSessionStatusEnum = pgEnum("agent_session_status", ["active", "ended"]);

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomSid: varchar("room_sid", { length: 255 }).notNull().unique(),
  roomName: varchar("room_name", { length: 255 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  participantCount: integer("participant_count").default(0),
  status: roomStatusEnum("status").default("active").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  participantSid: varchar("participant_sid", { length: 255 }).notNull().unique(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  identity: varchar("identity", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  joinedAt: timestamp("joined_at").notNull(),
  leftAt: timestamp("left_at"),
  durationSeconds: integer("duration_seconds"),
  state: varchar("state", { length: 50 }).notNull(),
  metadata: json("metadata"),
  isAgent: boolean("is_agent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  trackSid: varchar("track_sid", { length: 255 }).notNull().unique(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  trackName: varchar("track_name", { length: 255 }).notNull(),
  trackType: varchar("track_type", { length: 50 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  publishedAt: timestamp("published_at").notNull(),
  unpublishedAt: timestamp("unpublished_at"),
  durationSeconds: integer("duration_seconds"),
  egressBytes: integer("egress_bytes").default(0),
  ingressBytes: integer("ingress_bytes").default(0),
  muted: boolean("muted").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull().unique(),
  agentName: varchar("agent_name", { length: 255 }),
  agentType: varchar("agent_type", { length: 100 }),
  totalSessions: integer("total_sessions").default(0),
  metadata: json("metadata"),
  firstSeenAt: timestamp("first_seen_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentSessions = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull(),
  leftAt: timestamp("left_at"),
  status: agentSessionStatusEnum("status").default("active").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const costs = pgTable("costs", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().unique().references(() => rooms.id, { onDelete: "cascade" }),
  participantMinutes: integer("participant_minutes").default(0),
  egressGb: integer("egress_gb").default(0),
  ingressGb: integer("ingress_gb").default(0),
  participantCost: integer("participant_cost").default(0), // Store as cents
  egressCost: integer("egress_cost").default(0), // Store as cents
  ingressCost: integer("ingress_cost").default(0), // Store as cents
  totalCost: integer("total_cost").default(0), // Store as cents to avoid decimal issues
  costBreakdown: json("cost_breakdown"),
  calculatedAt: timestamp("calculated_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const costConfig = pgTable("cost_config", {
  id: serial("id").primaryKey(),
  costPerParticipantMinute: integer("cost_per_participant_minute").notNull(), // Store as micro-cents
  costPerEgressGb: integer("cost_per_egress_gb").notNull(), // Store as cents
  costPerIngressGb: integer("cost_per_ingress_gb").default(0), // Store as cents
  costPerRecordingMinute: integer("cost_per_recording_minute").default(0), // Store as micro-cents
  customRates: json("custom_rates"),
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const egressRecords = pgTable("egress_records", {
  id: serial("id").primaryKey(),
  egressId: varchar("egress_id", { length: 255 }).notNull().unique(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  egressType: varchar("egress_type", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  sizeGb: integer("size_gb").default(0), // Store as MB to avoid decimals
  status: varchar("status", { length: 50 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
export type AgentSession = typeof agentSessions.$inferSelect;
export type InsertAgentSession = typeof agentSessions.$inferInsert;
export type Cost = typeof costs.$inferSelect;
export type InsertCost = typeof costs.$inferInsert;
export type CostConfig = typeof costConfig.$inferSelect;
export type InsertCostConfig = typeof costConfig.$inferInsert;
export type EgressRecord = typeof egressRecords.$inferSelect;
export type InsertEgressRecord = typeof egressRecords.$inferInsert;

// Agent runtime instances (from Agent Runtime platform)
export const agentRuntimeInstances = pgTable("agent_runtime_instances", {
  id: serial("id").primaryKey(),
  podName: varchar("pod_name", { length: 255 }).notNull().unique(),
  namespace: varchar("namespace", { length: 128 }).default("livekit"),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  lastHeartbeat: timestamp("last_heartbeat").notNull(),
  cpuUsage: integer("cpu_usage"),
  memoryUsage: integer("memory_usage"),
  activeAgentCount: integer("active_agent_count").default(0),
  totalSessionsHandled: integer("total_sessions_handled").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent instance sessions (from Agent Builder agents)
export const agentInstanceSessions = pgTable("agent_instance_sessions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(), // Reference to Agent Builder agents.id
  tenantId: integer("tenant_id").notNull(), // Reference to tenants.id
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  roomName: varchar("room_name", { length: 255 }).notNull(),
  runtimeInstanceId: integer("runtime_instance_id").references(() => agentRuntimeInstances.id),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  participantCount: integer("participant_count").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session-level metrics
export const sessionMetrics = pgTable("session_metrics", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().references(() => agentInstanceSessions.sessionId),
  agentId: integer("agent_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  date: date("date").notNull(),
  messageCount: integer("message_count").default(0),
  userMessageCount: integer("user_message_count").default(0),
  agentMessageCount: integer("agent_message_count").default(0),
  avgSttLatency: integer("avg_stt_latency").default(0),
  avgTtsLatency: integer("avg_tts_latency").default(0),
  avgLlmLatency: integer("avg_llm_latency").default(0),
  totalTokens: integer("total_tokens").default(0),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalCost: integer("total_cost").default(0),
  langfuseCost: integer("langfuse_cost").default(0),
  errorCount: integer("error_count").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent metrics (time-series data)
export const agentMetrics = pgTable("agent_metrics", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  metricType: varchar("metric_type", { length: 50 }).notNull(),
  metricValue: integer("metric_value"),
  metricLabel: varchar("metric_label", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tenant metrics aggregation
export const tenantMetrics = pgTable("tenant_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  date: date("date").notNull(),
  activeAgents: integer("active_agents").default(0),
  totalSessions: integer("total_sessions").default(0),
  totalDurationSeconds: integer("total_duration_seconds").default(0),
  totalCost: integer("total_cost").default(0),
  avgLatency: integer("avg_latency").default(0),
  errorCount: integer("error_count").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// LangFuse trace metadata
export const langfuseTraces = pgTable("langfuse_traces", {
  id: serial("id").primaryKey(),
  traceId: varchar("trace_id", { length: 255 }).notNull().unique(),
  agentId: integer("agent_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  name: varchar("name", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  input: json("input"),
  output: json("output"),
  metadata: json("metadata"),
  tags: json("tags"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// LangFuse metrics aggregation
export const langfuseMetrics = pgTable("langfuse_metrics", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  traceId: varchar("trace_id", { length: 255 }).references(() => langfuseTraces.traceId),
  sessionId: varchar("session_id", { length: 255 }),
  date: date("date").notNull(),
  totalTokens: integer("total_tokens").default(0),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalCost: integer("total_cost").default(0),
  avgLatency: integer("avg_latency").default(0),
  traceCount: integer("trace_count").default(0),
  modelName: varchar("model_name", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AgentRuntimeInstance = typeof agentRuntimeInstances.$inferSelect;
export type InsertAgentRuntimeInstance = typeof agentRuntimeInstances.$inferInsert;
export type AgentInstanceSession = typeof agentInstanceSessions.$inferSelect;
export type InsertAgentInstanceSession = typeof agentInstanceSessions.$inferInsert;
export type SessionMetric = typeof sessionMetrics.$inferSelect;
export type InsertSessionMetric = typeof sessionMetrics.$inferInsert;
export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;
export type TenantMetric = typeof tenantMetrics.$inferSelect;
export type InsertTenantMetric = typeof tenantMetrics.$inferInsert;
export type LangfuseTrace = typeof langfuseTraces.$inferSelect;
export type InsertLangfuseTrace = typeof langfuseTraces.$inferInsert;
export type LangfuseMetric = typeof langfuseMetrics.$inferSelect;
export type InsertLangfuseMetric = typeof langfuseMetrics.$inferInsert;
