--
;
--
-- Table structure for table "pickup_request"
--
DROP TABLE IF EXISTS "pickup_request";
CREATE TABLE "pickup_request" (
  "request_id" SERIAL,
  "account_id" INTEGER,
  "address_id" INTEGER,
  "slot_id" INTEGER,
  "assigned_collector_id" INTEGER,
  "request_status" VARCHAR(100),
  "sorting_confirmed" BOOLEAN,
  "priority_score" INTEGER,
  "duplicate_flag" BOOLEAN,
  "manual_review_flag" BOOLEAN,
  "submitted_at" TIMESTAMP,
  "scheduled_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "cancelled_at" TIMESTAMP,
  PRIMARY KEY ("request_id"),
  INDEX on_account_id ("account_id"),
  INDEX on_address_id ("address_id"),
  INDEX on_slot_id ("slot_id"),
  INDEX on_assigned_collector_id ("assigned_collector_id"),
  CONSTRAINT "pickup_request_ibfk_1" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id"),
  CONSTRAINT "pickup_request_ibfk_2" FOREIGN KEY ("address_id") REFERENCES "address" ("address_id"),
  CONSTRAINT "pickup_request_ibfk_3" FOREIGN KEY ("slot_id") REFERENCES "pickup_time_slot" ("slot_id"),
  CONSTRAINT "pickup_request_ibfk_4" FOREIGN KEY ("assigned_collector_id") REFERENCES "account" ("account_id")
);
-- Dump completed on 2026-04-12 19:25:46