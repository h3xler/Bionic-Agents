# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-18

### Added
- Initial release of LiveKit Dashboard
- Real-time session tracking with webhook integration
- AI agent monitoring and analytics
- Cost tracking and analysis with configurable rates
- Comprehensive dashboard UI with React 19 and Tailwind CSS 4
- PostgreSQL database schema with Drizzle ORM
- Kubernetes deployment manifests
- Docker multi-stage build configuration
- Webhook signature verification
- Cost configuration management
- Session, agent, and cost statistics APIs
- Database migration jobs for Kubernetes

### Fixed
- Webhook raw body parsing for signature verification
- SQL GROUP BY issues in session queries
- Drizzle result extraction across all queries
- Cost configuration save/retrieve functionality
- Value conversion between frontend (dollars) and database (integers)
- Boolean handling in PostgreSQL queries

### Technical Details
- Custom Express middleware for raw body capture
- Proper Drizzle ORM result handling
- Multi-stage Docker builds for optimization
- Kubernetes-ready deployment configuration
- Comprehensive error handling and logging

