# Bionic-Agents

Multi-tenant LiveKit Agent Platform - A comprehensive platform for building, deploying, and monitoring AI agents with LiveKit.

## Overview

This repository contains three main components:

### 1. Agent-Builder
Agent configuration and management platform. Allows users to:
- Create and configure LiveKit agents
- Manage STT, TTS, and LLM providers
- Deploy agents to Kubernetes (dedicated or shared mode)
- Generate embeddable widgets

### 2. Agent-Runtime
Shared agent execution platform that:
- Manages multiple agent instances in a single runtime
- Handles concurrent user sessions
- Provides efficient resource utilization
- Supports horizontal scaling

### 3. Dashboard (livekit-dashboard-frontend)
Monitoring and analytics dashboard featuring:
- Real-time session monitoring
- Agent performance metrics
- Tenant-level analytics
- Cost tracking and reporting
- LangFuse integration for LLM observability

## Architecture

- **Database**: Shared PostgreSQL database (`liveagents`)
- **Deployment**: Kubernetes (LiveKit namespace)
- **Multi-tenancy**: Tenant isolation with resource quotas
- **Metrics**: Near real-time (30-second polling)

## Quick Start

See individual component READMEs for setup instructions:
- [Agent-Builder README](Agent-Builder/README.md)
- [Dashboard README](livekit-dashboard-frontend/README.md)

## Database Setup

The platform uses a shared PostgreSQL database. See [SETUP-DATABASE-K8S.md](../SETUP-DATABASE-K8S.md) for setup instructions.

## License

MIT
