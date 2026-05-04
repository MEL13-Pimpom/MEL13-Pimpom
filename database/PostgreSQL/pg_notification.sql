--
;
--
-- Table structure for table "notification"
--
DROP TABLE IF EXISTS "notification";
CREATE TABLE "notification" (
  "notification_id" SERIAL,
  "request_id" INTEGER,
  "recipient_account_id" INTEGER,
  "notification_type" varchar(100),
  "message" text,
  "sent_at" TIMESTAMP,
  "read_status" BOOLEAN,
  PRIMARY KEY ("notification_id"),
  INDEX on_request_id ("request_id"),
  INDEX on_recipient_account_id ("recipient_account_id"),
  CONSTRAINT "notification_ibfk_1" FOREIGN KEY ("request_id") REFERENCES "pickup_request" ("request_id"),
  CONSTRAINT "notification_ibfk_2" FOREIGN KEY ("recipient_account_id") REFERENCES "account" ("account_id")
);
-- Dump completed on 2026-04-12 19:25:45