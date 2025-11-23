-- Create missing tables for Agent-Runtime tests
-- Based on Agent-Builder and Agent-Dashboard schemas

-- Agent-Builder tables (if not already created)
-- Note: These should be created by Drizzle migrations, but we'll create them here for testing

-- Settings table (from Agent-Builder)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tenants table (from Agent-Builder)
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM('active', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deployment_mode AS ENUM('dedicated', 'shared');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deployment_status AS ENUM('draft', 'deploying', 'deployed', 'failed', 'stopped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    status tenant_status DEFAULT 'active' NOT NULL,
    resource_quota TEXT, -- JSON: { cpu: "4", memory: "8Gi", maxAgents: 10 }
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Agents table (from Agent-Builder - different from Dashboard agents table)
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- STT Configuration
    stt_provider VARCHAR(64) NOT NULL,
    stt_config TEXT,
    
    -- TTS Configuration
    tts_provider VARCHAR(64) NOT NULL,
    tts_config TEXT,
    voice_id VARCHAR(255),
    
    -- LLM Configuration
    llm_provider VARCHAR(64) NOT NULL,
    llm_model VARCHAR(128),
    llm_config TEXT,
    
    -- Features
    vision_enabled INTEGER DEFAULT 0 NOT NULL,
    screen_share_enabled INTEGER DEFAULT 0 NOT NULL,
    transcribe_enabled INTEGER DEFAULT 0 NOT NULL,
    
    -- Multi-lingual
    languages TEXT, -- JSON array of language codes
    
    -- Avatar
    avatar_model VARCHAR(255),
    
    -- Prompt/Persona
    system_prompt TEXT,
    
    -- MCP Configuration
    mcp_gateway_url VARCHAR(512),
    mcp_config TEXT,
    
    -- Deployment
    deployment_mode deployment_mode DEFAULT 'shared' NOT NULL,
    deployment_status deployment_status DEFAULT 'draft' NOT NULL,
    deployment_namespace VARCHAR(128) DEFAULT 'agents',
    max_concurrent_sessions INTEGER DEFAULT 10,
    resource_limits TEXT, -- JSON: { cpu: "2", memory: "4Gi" }
    kubernetes_manifest TEXT,
    
    -- Widget Configuration
    widget_config TEXT,
    widget_snippet TEXT,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Agent Instance Sessions table (from Agent-Builder) - Created after agent_runtime_instances
CREATE TABLE IF NOT EXISTS agent_instance_sessions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    room_name VARCHAR(255) NOT NULL,
    runtime_instance_id INTEGER,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    participant_count INTEGER DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Agent Runtime Instances table (from Agent-Dashboard) - MUST be created before agent_instance_sessions
CREATE TABLE IF NOT EXISTS agent_runtime_instances (
    id SERIAL PRIMARY KEY,
    pod_name VARCHAR(255) NOT NULL UNIQUE,
    namespace VARCHAR(128) DEFAULT 'livekit',
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    last_heartbeat TIMESTAMP NOT NULL,
    cpu_usage INTEGER,
    memory_usage INTEGER,
    active_agent_count INTEGER DEFAULT 0,
    total_sessions_handled INTEGER DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Session Metrics table (from Agent-Dashboard)
CREATE TABLE IF NOT EXISTS session_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES agent_instance_sessions(session_id),
    agent_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    date DATE NOT NULL,
    message_count INTEGER DEFAULT 0,
    user_message_count INTEGER DEFAULT 0,
    agent_message_count INTEGER DEFAULT 0,
    avg_stt_latency INTEGER DEFAULT 0,
    avg_tts_latency INTEGER DEFAULT 0,
    avg_llm_latency INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_cost INTEGER DEFAULT 0,
    langfuse_cost INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Agent Metrics table (from Agent-Dashboard)
CREATE TABLE IF NOT EXISTS agent_metrics (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    session_id VARCHAR(255),
    metric_type VARCHAR(50) NOT NULL,
    metric_value INTEGER,
    metric_label VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tenant Metrics table (from Agent-Dashboard)
CREATE TABLE IF NOT EXISTS tenant_metrics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    date DATE NOT NULL,
    active_agents INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    total_cost INTEGER DEFAULT 0,
    avg_latency INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- LangFuse Traces table (from Agent-Dashboard)
CREATE TABLE IF NOT EXISTS langfuse_traces (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(255) NOT NULL UNIQUE,
    agent_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    session_id VARCHAR(255),
    name VARCHAR(255),
    user_id VARCHAR(255),
    input JSON,
    output JSON,
    metadata JSON,
    tags JSON,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- LangFuse Metrics table (from Agent-Dashboard)
CREATE TABLE IF NOT EXISTS langfuse_metrics (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    trace_id VARCHAR(255) REFERENCES langfuse_traces(trace_id),
    session_id VARCHAR(255),
    date DATE NOT NULL,
    total_tokens INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_cost INTEGER DEFAULT 0,
    avg_latency INTEGER DEFAULT 0,
    trace_count INTEGER DEFAULT 0,
    model_name VARCHAR(255),
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

