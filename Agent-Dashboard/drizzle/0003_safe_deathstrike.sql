CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."agent_session_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "agent_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"joined_at" timestamp NOT NULL,
	"left_at" timestamp,
	"status" "agent_session_status" DEFAULT 'active' NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" varchar(255) NOT NULL,
	"agent_name" varchar(255),
	"agent_type" varchar(100),
	"total_sessions" integer DEFAULT 0,
	"metadata" json,
	"first_seen_at" timestamp NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "cost_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"cost_per_participant_minute" integer NOT NULL,
	"cost_per_egress_gb" integer NOT NULL,
	"cost_per_ingress_gb" integer DEFAULT 0,
	"cost_per_recording_minute" integer DEFAULT 0,
	"custom_rates" json,
	"is_active" boolean DEFAULT true,
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"participant_minutes" integer DEFAULT 0,
	"egress_gb" integer DEFAULT 0,
	"ingress_gb" integer DEFAULT 0,
	"participant_cost" integer DEFAULT 0,
	"egress_cost" integer DEFAULT 0,
	"ingress_cost" integer DEFAULT 0,
	"total_cost" integer DEFAULT 0,
	"cost_breakdown" json,
	"calculated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "costs_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "egress_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"egress_id" varchar(255) NOT NULL,
	"room_id" integer NOT NULL,
	"egress_type" varchar(50) NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"size_gb" integer DEFAULT 0,
	"status" varchar(50) NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "egress_records_egress_id_unique" UNIQUE("egress_id")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_sid" varchar(255) NOT NULL,
	"room_id" integer NOT NULL,
	"identity" varchar(255) NOT NULL,
	"name" varchar(255),
	"joined_at" timestamp NOT NULL,
	"left_at" timestamp,
	"duration_seconds" integer,
	"state" varchar(50) NOT NULL,
	"metadata" json,
	"is_agent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "participants_participant_sid_unique" UNIQUE("participant_sid")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_sid" varchar(255) NOT NULL,
	"room_name" varchar(255) NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"participant_count" integer DEFAULT 0,
	"status" "room_status" DEFAULT 'active' NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_sid_unique" UNIQUE("room_sid")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_sid" varchar(255) NOT NULL,
	"room_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"track_name" varchar(255) NOT NULL,
	"track_type" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"published_at" timestamp NOT NULL,
	"unpublished_at" timestamp,
	"duration_seconds" integer,
	"egress_bytes" integer DEFAULT 0,
	"ingress_bytes" integer DEFAULT 0,
	"muted" boolean DEFAULT false,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_track_sid_unique" UNIQUE("track_sid")
);
--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "costs" ADD CONSTRAINT "costs_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egress_records" ADD CONSTRAINT "egress_records_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;