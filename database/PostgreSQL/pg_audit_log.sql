--
;
--
-- Table structure for table "audit_log"
--
DROP TABLE IF EXISTS "audit_log";
CREATE TABLE "audit_log" (
  "audit_id" SERIAL,
  "request_id" INTEGER,
  "actor_account_id" INTEGER,
  "action_type" varchar(100),
  "old_value" text,
  "new_value" text,
  "timestamp" TIMESTAMP,
  PRIMARY KEY ("audit_id"),
  INDEX on_request_id ("request_id"),
  INDEX on_actor_account_id ("actor_account_id"),
  CONSTRAINT "audit_log_ibfk_1" FOREIGN KEY ("request_id") REFERENCES "pickup_request" ("request_id"),
  CONSTRAINT "audit_log_ibfk_2" FOREIGN KEY ("actor_account_id") REFERENCES "account" ("account_id")
);
-- Dump completed on 2026-04-12 19:25:46