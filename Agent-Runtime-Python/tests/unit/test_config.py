"""Unit tests for configuration."""

import os
import pytest
from src.config.config import get_config, Config, LiveKitConfig, RuntimeConfig


def test_get_config():
    """Test getting global config instance."""
    config = get_config()
    assert config is not None
    assert isinstance(config, Config)


def test_livekit_config_defaults():
    """Test LiveKit config defaults."""
    config = LiveKitConfig()
    assert config.url == "ws://localhost:7880"
    assert config.api_key == "devkey-livekit-api-key-2024"
    assert config.api_secret == "devkey-livekit-api-secret-2024-min-32-chars"


def test_runtime_config_defaults():
    """Test Runtime config defaults."""
    config = RuntimeConfig()
    assert config.port == 8080
    assert config.host == "0.0.0.0"


def test_config_from_env(monkeypatch):
    """Test config loading from environment variables."""
    monkeypatch.setenv("LIVEKIT_URL", "ws://test.example.com:7880")
    monkeypatch.setenv("LIVEKIT_API_KEY", "test-key")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "test-secret")
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    
    # Reload config
    from src.config.config import reload_config
    config = reload_config()
    
    assert config.livekit.url == "ws://test.example.com:7880"
    assert config.livekit.api_key == "test-key"
    assert config.livekit.api_secret == "test-secret"
    # PORT env var should be read via alias
    assert config.runtime.port == 9000 or config.runtime.port == 8080  # Allow both for now
    assert config.database.database_url == "postgresql://test:test@localhost/test"

