--
;
--
-- Table structure for table "account"
--
DROP TABLE IF EXISTS "account";
CREATE TABLE "account" (
  "account_id" SERIAL,
  "full_name" varchar(100),
  "email" varchar(100),
  "password" varchar(255),
  "phone_number" varchar(20),
  "role" VARCHAR(100),
  "account_status" VARCHAR(100),
  "created_at" TIMESTAMP,
  PRIMARY KEY ("account_id"),
  UNIQUE ("email")
);
-- Dump completed on 2026-04-12 19:25:45