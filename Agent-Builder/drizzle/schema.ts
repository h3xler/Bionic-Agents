import { integer, pgEnum, pgTable, text, timestamp, varchar, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Converted from MySQL to PostgreSQL to share database with Dashboard and Runtime.
 * Columns use snake_case for PostgreSQL consistency.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tenants table - users are tenants in multi-tenant system
 */
export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended", "inactive"]);
export const deploymentModeEnum = pgEnum("deployment_mode", ["dedicated", "shared"]);
export const deploymentStatusEnum = pgEnum("deployment_status", ["draft", "deploying", "deployed", "failed", "stopped"]);

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  status: tenantStatusEnum("status").default("active").notNull(),
  resourceQuota: text("resource_quota"), // JSON: { cpu: "4", memory: "8Gi", maxAgents: 10 }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Agents table for storing LiveKit agent configurations
 * Converted from MySQL to PostgreSQL, added tenant and deployment mode fields
 */
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // STT Configuration
  sttProvider: varchar("stt_provider", { length: 64 }).notNull(), // deepgram, speechmatics, etc.
  sttConfig: text("stt_config"), // JSON config for STT provider
  
  // TTS Configuration
  ttsProvider: varchar("tts_provider", { length: 64 }).notNull(), // elevenlabs, speechmatics, cartesia
  ttsConfig: text("tts_config"), // JSON config for TTS provider
  voiceId: varchar("voice_id", { length: 255 }), // Selected voice ID
  
  // LLM Configuration
  llmProvider: varchar("llm_provider", { length: 64 }).notNull(), // openai, anthropic, gemini, realtime
  llmModel: varchar("llm_model", { length: 128 }), // Model name
  llmConfig: text("llm_config"), // JSON config for LLM provider
  
  // Features
  visionEnabled: integer("vision_enabled").default(0).notNull(), // 0 = false, 1 = true
  screenShareEnabled: integer("screen_share_enabled").default(0).notNull(),
  transcribeEnabled: integer("transcribe_enabled").default(0).notNull(),
  
  // Multi-lingual
  languages: text("languages"), // JSON array of language codes
  
  // Avatar
  avatarModel: varchar("avatar_model", { length: 255 }), // BitHuman model name
  
  // Prompt/Persona
  systemPrompt: text("system_prompt"),
  
  // MCP Configuration
  mcpGatewayUrl: varchar("mcp_gateway_url", { length: 512 }),
  mcpConfig: text("mcp_config"), // JSON config for MCP
  
  // Deployment
  deploymentMode: deploymentModeEnum("deployment_mode").default("shared").notNull(),
  deploymentStatus: deploymentStatusEnum("deployment_status").default("draft").notNull(),
  deploymentNamespace: varchar("deployment_namespace", { length: 128 }).default("agents"),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(10),
  resourceLimits: text("resource_limits"), // JSON: { cpu: "2", memory: "4Gi" }
  kubernetesManifest: text("kubernetes_manifest"), // Generated K8s manifest
  
  // Widget Configuration
  widgetConfig: text("widget_config"), // JSON config for widget appearance
  widgetSnippet: text("widget_snippet"), // Generated embed code
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Global settings table for LiveKit and LangFuse configuration
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;