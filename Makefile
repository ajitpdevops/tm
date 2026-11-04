.PHONY: test unit integration quality e2e ci down
COMPOSE=docker compose

unit:        ; $(COMPOSE) --profile test run --rm unit
integration: ; $(COMPOSE) --profile test run --rm integration; $(COMPOSE) down -v
quality:     ; $(COMPOSE) --profile test run --rm quality
e2e:         ; $(COMPOSE) --profile e2e run --rm e2e; $(COMPOSE) --profile e2e down -v
test: quality unit integration   ## everything except e2e
ci: test e2e                     ## exactly what GitHub Actions runs
down:        ; $(COMPOSE) --profile test --profile e2e down -v
