REPORTER ?= spec

test:
	mocha tests --reporter $(REPORTER)

db:
	npm run-script db

run:
	npm start

doc:
	npm sun-script doc

doc-server:
	npm run-script doc-server

.PHONY: test, db, run