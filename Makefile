# RIVA Docker Commands

.PHONY: help build up down dev logs clean setup

help: ## Show this help message
	@echo "🎤 RIVA Docker Commands"
	@echo "======================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup - copy env files
	@echo "🚀 Setting up RIVA..."
	@cp backend/.env.example backend/.env || echo "⚠️  Please create backend/.env manually"
	@echo "✅ Setup complete! Edit backend/.env with your API keys"

build: ## Build all Docker images
	@echo "🔨 Building RIVA images..."
	@docker compose build

up: ## Start production services
	@echo "🚀 Starting RIVA production..."
	@docker compose up -d
	@echo "✅ RIVA running at http://localhost:3000"

dev: ## Start development services with hot reload
	@echo "🔥 Starting RIVA development..."
	@docker compose -f docker-compose.dev.yml up -d
	@echo "✅ RIVA dev running at http://localhost:3000"

down: ## Stop all services
	@echo "🛑 Stopping RIVA..."
	@docker compose down
	@docker compose -f docker-compose.dev.yml down

logs: ## Show logs from all services
	@docker compose logs -f

logs-backend: ## Show backend logs only
	@docker compose logs -f backend

logs-frontend: ## Show frontend logs only
	@docker compose logs -f frontend

logs-face: ## Show face recognition logs only
	@docker compose logs -f face-recognition

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up..."
	@docker compose down -v
	@docker compose -f docker-compose.dev.yml down -v
	@docker system prune -f
	@echo "✅ Cleanup complete"

restart: ## Restart all services
	@make down
	@make up

restart-dev: ## Restart development services
	@docker compose -f docker-compose.dev.yml down
	@docker compose -f docker-compose.dev.yml up -d

shell-backend: ## Open shell in backend container
	@docker compose exec backend sh

shell-frontend: ## Open shell in frontend container
	@docker compose exec frontend sh

shell-face: ## Open shell in face recognition container
	@docker compose exec face-recognition sh

status: ## Show service status
	@docker compose ps