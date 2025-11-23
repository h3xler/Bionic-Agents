# API Contracts Documentation

This document defines all HTTP API endpoints for Agent-Runtime, ensuring 100% compatibility with the Node.js version.

## Base URL

All endpoints are prefixed with `/api` unless otherwise specified.

## Authentication

Most endpoints require API key authentication via `Authorization: Bearer <api-key>` header.

---

## Agent Endpoints

### POST /api/agents/register

Register a new agent with the runtime.

**Request Headers:**
```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "agentId": 1,
  "tenantId": 1,
  "config": {
    "agentId": 1,
    "tenantId": 1,
    "name": "Support Agent",
    "description": "Customer support agent",
    "sttProvider": "deepgram",
    "ttsProvider": "elevenlabs",
    "llmProvider": "openai",
    "llmModel": "gpt-4",
    "systemPrompt": "You are a helpful customer support agent.",
    "visionEnabled": false,
    "screenShareEnabled": false,
    "transcribeEnabled": true,
    "languages": ["en"],
    "voiceId": "voice-id-123",
    "avatarModel": "bithuman-model-1",
    "maxConcurrentSessions": 10,
    "livekitConfig": {
      "url": "ws://localhost:7880",
      "apiKey": "devkey-livekit-api-key-2024",
      "apiSecret": "devkey-livekit-api-secret-2024-min-32-chars"
    },
    "langfuseConfig": {
      "enabled": true,
      "publicKey": "pk-...",
      "secretKey": "sk-...",
      "baseUrl": "https://cloud.langfuse.com"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "agentId": 1
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid agent configuration"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

### DELETE /api/agents/:agentId

Unregister an agent from the runtime.

**Request Headers:**
```
Authorization: Bearer <api-key>
```

**Path Parameters:**
- `agentId` (integer): The ID of the agent to unregister

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Agent not found"
}
```

---

### GET /api/agents/:agentId

Get the status of a specific agent.

**Path Parameters:**
- `agentId` (integer): The ID of the agent

**Response (200 OK):**
```json
{
  "registered": true,
  "active": true,
  "activeSessions": 2,
  "maxSessions": 10
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Agent not found"
}
```

---

### GET /api/agents/

List all registered agents.

**Response (200 OK):**
```json
{
  "agents": [1, 2, 3]
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Internal server error"
}
```

---

## Session Endpoints

### POST /api/sessions/create

Create a new agent session.

**Request Body:**
```json
{
  "agentId": 1,
  "tenantId": 1,
  "roomName": "agent-1-room",
  "participantName": "Guest"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "sessionId": "session-abc123",
    "roomName": "agent-1-room"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Agent not registered"
}
```

---

### POST /api/sessions/:sessionId/end

End an active session.

**Path Parameters:**
- `sessionId` (string): The ID of the session to end

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Session not found"
}
```

---

### GET /api/sessions/:sessionId

Get session details.

**Path Parameters:**
- `sessionId` (string): The ID of the session

**Response (200 OK):**
```json
{
  "sessionId": "session-abc123",
  "agentId": 1,
  "tenantId": 1,
  "roomName": "agent-1-room",
  "status": "active",
  "startedAt": "2024-01-15T10:30:00Z",
  "participantCount": 2
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Session not found"
}
```

---

## Metrics Endpoints

### GET /api/metrics/agent/:agentId

Get metrics for a specific agent.

**Query Parameters:**
- `startDate` (optional, string): Start date for metrics (ISO 8601)
- `endDate` (optional, string): End date for metrics (ISO 8601)

**Path Parameters:**
- `agentId` (integer): The ID of the agent

**Response (200 OK):**
```json
{
  "agentId": 1,
  "totalSessions": 150,
  "activeSessions": 5,
  "avgLatency": 250,
  "totalCost": 45.50
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to get agent metrics"
}
```

---

### GET /api/metrics/tenant/:tenantId

Get metrics for a specific tenant.

**Query Parameters:**
- `startDate` (optional, string): Start date for metrics (ISO 8601)
- `endDate` (optional, string): End date for metrics (ISO 8601)

**Path Parameters:**
- `tenantId` (integer): The ID of the tenant

**Response (200 OK):**
```json
{
  "tenantId": 1,
  "activeAgents": 3,
  "totalSessions": 500,
  "totalCost": 125.75
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to get tenant metrics"
}
```

---

### GET /api/metrics/session/:sessionId

Get metrics for a specific session.

**Path Parameters:**
- `sessionId` (string): The ID of the session

**Response (200 OK):**
```json
{
  "sessionId": "session-abc123",
  "messageCount": 25,
  "avgLatency": 200,
  "totalCost": 0.15
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Session not found"
}
```

---

## Health Endpoints

### GET /health

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### GET /ready

Readiness check endpoint (includes database connectivity check).

**Response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "not ready",
  "reason": "database not connected"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server error)

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All numeric IDs are integers
- All string IDs (like sessionId) are alphanumeric strings
- Request/response bodies use camelCase for JSON keys (matching Node.js version)
- API key authentication is optional if `AGENT_RUNTIME_API_KEY` is not configured

