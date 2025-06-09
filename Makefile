# Development shortcuts for No Bad Parts monorepo

.PHONY: agent-dev

# Run FastAPI agent with auto-reload on port 8000
agent-dev:
	uvicorn agent.server:app --reload --port 8000 