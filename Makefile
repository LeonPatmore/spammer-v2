help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

prepareLocalLeader: ## Prepare application for local run.
	docker run -p 8080:8080 --name local-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres

startLeader: prepareLocalLeader
	npm start

test: ## Runs the test for this project.
	npm test
