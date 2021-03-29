help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

prepareLocalLeader: ## Prepare application for local run.
	docker start local-postgres 2>/dev/null || docker run  -p 5432:5432 --name local-postgres -e POSTGRES_DB=spammer -e POSTGRES_USER=spammer -e POSTGRES_PASSWORD=spammer -d postgres
	docker start postgres-ui 2>/dev/null || docker run --net=host --name postgres-ui -p 8080:8080 -d adminer

startLeader: prepareLocalLeader ## Start a leader.
	npm start

startFollower: ## Start a follower.
	SPAMMER_TYPE=follower SPAMMER_PORT=1234 npm start 

test: ## Runs the test for this project.
	npm test
