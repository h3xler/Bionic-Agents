# Kubernetes Deployment

This directory contains Kubernetes deployment configurations and documentation for the Bionic Agents platform.

## Quick Start

1. **Build Images**: See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
2. **Deploy**: Follow setup guide in [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
3. **Check Status**: See [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)

## Documentation

- **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)**: Current deployment status, test results, and known issues
- **[DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)**: Complete setup and deployment guide
- **[ACCESS_LINKS.md](./ACCESS_LINKS.md)**: Access URLs and port forwarding instructions
- **[REBUILD_INSTRUCTIONS.md](./REBUILD_INSTRUCTIONS.md)**: Instructions for rebuilding Docker images

## Architecture

All services are deployed in the `livekit` namespace:

- **livekit-server**: LiveKit real-time communication server
- **agent-runtime-python**: Python-based agent runtime (API + Agent Server)
- **agent-builder**: Agent configuration and management UI
- **livekit-dashboard**: Agent monitoring and analytics dashboard

## Services

- All services use ClusterIP for internal communication
- Port forwarding required for local access
- See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for port forwarding commands

## Troubleshooting

See [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) for current issues and [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for troubleshooting steps.

