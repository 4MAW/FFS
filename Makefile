REPORTER ?= spec

test:
	mocha tests --reporter $(REPORTER)

db:
	npm run-script db

run:
	npm start

.PHONY: test, db, run