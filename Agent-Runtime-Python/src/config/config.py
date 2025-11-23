"""Configuration management using Pydantic Settings.

Matches the Node.js config structure exactly.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class LiveKitConfig(BaseSettings):
    """LiveKit server configuration."""
    model_config = SettingsConfigDict(env_prefix="LIVEKIT_")

    url: str = Field(default="ws://localhost:7880", description="LiveKit server URL")
    api_key: str = Field(default="devkey-livekit-api-key-2024", description="LiveKit API key")
    api_secret: str = Field(
        default="devkey-livekit-api-secret-2024-min-32-chars",
        description="LiveKit API secret"
    )


class RuntimeConfig(BaseSettings):
    """Agent Runtime configuration."""
    model_config = SettingsConfigDict(env_prefix="AGENT_RUNTIME_")

    api_key: Optional[str] = Field(default=None, description="API key for authentication")
    port: int = Field(default=8080, description="Server port", alias="PORT")
    host: str = Field(default="0.0.0.0", description="Server host")


class DatabaseConfig(BaseSettings):
    """Database configuration."""
    model_config = SettingsConfigDict(env_prefix="")

    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/liveagents",
        alias="DATABASE_URL",
        description="PostgreSQL database URL"
    )


class LangFuseConfig(BaseSettings):
    """LangFuse configuration."""
    model_config = SettingsConfigDict(env_prefix="LANGFUSE_")

    enabled: bool = Field(default=False, description="Enable LangFuse integration")
    public_key: Optional[str] = Field(default=None, description="LangFuse public key")
    secret_key: Optional[str] = Field(default=None, description="LangFuse secret key")
    base_url: str = Field(
        default="https://cloud.langfuse.com",
        description="LangFuse base URL"
    )


class Config(BaseSettings):
    """Main application configuration."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # LiveKit configuration
    livekit: LiveKitConfig = Field(default_factory=LiveKitConfig)

    # Runtime configuration
    runtime: RuntimeConfig = Field(default_factory=RuntimeConfig)

    # Database configuration
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)

    # LangFuse configuration
    langfuse: LangFuseConfig = Field(default_factory=LangFuseConfig)

    # Environment
    node_env: str = Field(default="development", alias="NODE_ENV")
    debug: bool = Field(default=False, description="Enable debug mode")

    def __init__(self, **kwargs):
        """Initialize config with nested settings."""
        super().__init__(**kwargs)
        # Initialize nested configs if not provided
        if "livekit" not in kwargs:
            self.livekit = LiveKitConfig()
        if "runtime" not in kwargs:
            self.runtime = RuntimeConfig()
        if "database" not in kwargs:
            self.database = DatabaseConfig()
        if "langfuse" not in kwargs:
            self.langfuse = LangFuseConfig()


# Global config instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get global configuration instance."""
    global _config
    if _config is None:
        _config = Config()
    return _config


def reload_config() -> Config:
    """Reload configuration from environment."""
    global _config
    _config = Config()
    return _config

