# Development shortcuts for No Bad Parts monorepo

.PHONY: dev agent-dev

# Default developer command (alias): `make dev`
dev: agent-dev

# Run FastAPI agent with auto-reload on port 8000
agent-dev:
	uvicorn agent.server:app --reload --port 8000 