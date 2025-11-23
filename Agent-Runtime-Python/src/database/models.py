"""SQLAlchemy models matching Drizzle schema exactly.

These models are read-only compatible with Drizzle-managed tables.
All column names, types, and constraints must match exactly.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    DateTime,
    func,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


# Enums matching Drizzle schema
class RoleEnum(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class TenantStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class DeploymentModeEnum(str, enum.Enum):
    DEDICATED = "dedicated"
    SHARED = "shared"


class DeploymentStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    STOPPED = "stopped"


class RoomStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


class AgentSessionStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


# Tables from Agent-Builder schema
class User(Base):
    """Users table from Agent-Builder schema."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    open_id = Column(String(64), nullable=False, unique=True)
    name = Column(Text, nullable=True)
    email = Column(String(320), nullable=True)
    login_method = Column(String(64), nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    last_signed_in = Column(DateTime, default=func.now(), nullable=False)


class Tenant(Base):
    """Tenants table from Agent-Builder schema."""
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(128), nullable=False, unique=True)
    status = Column(Enum(TenantStatusEnum), default=TenantStatusEnum.ACTIVE, nullable=False)
    resource_quota = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class Agent(Base):
    """Agents table from Agent-Builder schema."""
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # STT Configuration
    stt_provider = Column(String(64), nullable=False)
    stt_config = Column(Text, nullable=True)  # JSON

    # TTS Configuration
    tts_provider = Column(String(64), nullable=False)
    tts_config = Column(Text, nullable=True)  # JSON
    voice_id = Column(String(255), nullable=True)

    # LLM Configuration
    llm_provider = Column(String(64), nullable=False)
    llm_model = Column(String(128), nullable=True)
    llm_config = Column(Text, nullable=True)  # JSON

    # Features
    vision_enabled = Column(Integer, default=0, nullable=False)  # 0 = false, 1 = true
    screen_share_enabled = Column(Integer, default=0, nullable=False)
    transcribe_enabled = Column(Integer, default=0, nullable=False)

    # Multi-lingual
    languages = Column(Text, nullable=True)  # JSON array

    # Avatar
    avatar_model = Column(String(255), nullable=True)

    # Prompt/Persona
    system_prompt = Column(Text, nullable=True)

    # MCP Configuration
    mcp_gateway_url = Column(String(512), nullable=True)
    mcp_config = Column(Text, nullable=True)  # JSON

    # Deployment
    deployment_mode = Column(Enum(DeploymentModeEnum), default=DeploymentModeEnum.SHARED, nullable=False)
    deployment_status = Column(Enum(DeploymentStatusEnum), default=DeploymentStatusEnum.DRAFT, nullable=False)
    deployment_namespace = Column(String(128), default="agents", nullable=True)
    max_concurrent_sessions = Column(Integer, default=10, nullable=True)
    resource_limits = Column(Text, nullable=True)  # JSON
    kubernetes_manifest = Column(Text, nullable=True)
    widget_config = Column(Text, nullable=True)  # JSON
    widget_snippet = Column(Text, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class Setting(Base):
    """Settings table from Agent-Builder schema."""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(255), nullable=False, unique=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


# Tables from Agent-Dashboard schema (LiveKit monitoring)
class Room(Base):
    """Rooms table from Agent-Dashboard schema."""
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_sid = Column(String(255), nullable=False, unique=True)
    room_name = Column(String(255), nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    participant_count = Column(Integer, default=0, nullable=True)
    status = Column(Enum(RoomStatusEnum), default=RoomStatusEnum.ACTIVE, nullable=False)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class Participant(Base):
    """Participants table from Agent-Dashboard schema."""
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_sid = Column(String(255), nullable=False, unique=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    identity = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    joined_at = Column(DateTime, nullable=False)
    left_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    state = Column(String(50), nullable=False)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    is_agent = Column(Boolean, default=False, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class AgentRuntimeInstance(Base):
    """Agent runtime instances table from Agent-Dashboard schema."""
    __tablename__ = "agent_runtime_instances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pod_name = Column(String(255), nullable=False, unique=True)
    namespace = Column(String(128), default="livekit", nullable=True)
    status = Column(String(50), nullable=False)
    started_at = Column(DateTime, nullable=False)
    last_heartbeat = Column(DateTime, nullable=False)
    cpu_usage = Column(Integer, nullable=True)
    memory_usage = Column(Integer, nullable=True)
    active_agent_count = Column(Integer, default=0, nullable=True)
    total_sessions_handled = Column(Integer, default=0, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class AgentInstanceSession(Base):
    """Agent instance sessions table - primary table for Agent-Runtime.

    This table tracks sessions created by Agent-Runtime for agents registered
    from Agent-Builder.
    """
    __tablename__ = "agent_instance_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, nullable=False)  # Reference to agents.id (Agent-Builder)
    tenant_id = Column(Integer, nullable=False)  # Reference to tenants.id
    session_id = Column(String(255), nullable=False, unique=True)
    room_name = Column(String(255), nullable=False)
    runtime_instance_id = Column(
        Integer,
        ForeignKey("agent_runtime_instances.id", ondelete="SET NULL"),
        nullable=True
    )
    status = Column(String(50), nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    participant_count = Column(Integer, default=0, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class SessionMetric(Base):
    """Session metrics table from Agent-Dashboard schema."""
    __tablename__ = "session_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), ForeignKey("agent_instance_sessions.session_id"), nullable=False)
    agent_id = Column(Integer, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    message_count = Column(Integer, default=0, nullable=True)
    user_message_count = Column(Integer, default=0, nullable=True)
    agent_message_count = Column(Integer, default=0, nullable=True)
    avg_stt_latency = Column(Integer, default=0, nullable=True)
    avg_tts_latency = Column(Integer, default=0, nullable=True)
    avg_llm_latency = Column(Integer, default=0, nullable=True)
    total_tokens = Column(Integer, default=0, nullable=True)
    input_tokens = Column(Integer, default=0, nullable=True)
    output_tokens = Column(Integer, default=0, nullable=True)
    total_cost = Column(Integer, default=0, nullable=True)
    langfuse_cost = Column(Integer, default=0, nullable=True)
    error_count = Column(Integer, default=0, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class AgentMetric(Base):
    """Agent metrics table from Agent-Dashboard schema."""
    __tablename__ = "agent_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    session_id = Column(String(255), nullable=True)
    metric_type = Column(String(50), nullable=False)
    metric_value = Column(Integer, nullable=True)
    metric_label = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)


class TenantMetric(Base):
    """Tenant metrics table from Agent-Dashboard schema."""
    __tablename__ = "tenant_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    active_agents = Column(Integer, default=0, nullable=True)
    total_sessions = Column(Integer, default=0, nullable=True)
    total_duration_seconds = Column(Integer, default=0, nullable=True)
    total_cost = Column(Integer, default=0, nullable=True)
    avg_latency = Column(Integer, default=0, nullable=True)
    error_count = Column(Integer, default=0, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class LangfuseTrace(Base):
    """LangFuse traces table from Agent-Dashboard schema."""
    __tablename__ = "langfuse_traces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trace_id = Column(String(255), nullable=False, unique=True)
    agent_id = Column(Integer, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    session_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    user_id = Column(String(255), nullable=True)
    input = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    tags = Column(JSON, nullable=True)
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)


class LangfuseMetric(Base):
    """LangFuse metrics table from Agent-Dashboard schema."""
    __tablename__ = "langfuse_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, nullable=False)
    tenant_id = Column(Integer, nullable=False)
    trace_id = Column(String(255), ForeignKey("langfuse_traces.trace_id"), nullable=True)
    session_id = Column(String(255), nullable=True)
    date = Column(Date, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=True)
    input_tokens = Column(Integer, default=0, nullable=True)
    output_tokens = Column(Integer, default=0, nullable=True)
    total_cost = Column(Integer, default=0, nullable=True)
    avg_latency = Column(Integer, default=0, nullable=True)
    trace_count = Column(Integer, default=0, nullable=True)
    model_name = Column(String(255), nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)  # Map to 'metadata' column in DB
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

