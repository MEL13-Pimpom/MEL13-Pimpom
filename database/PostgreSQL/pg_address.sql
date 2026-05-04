--
;
--
-- Table structure for table "address"
--
DROP TABLE IF EXISTS "address";
CREATE TABLE "address" (
  "address_id" SERIAL,
  "account_id" INTEGER,
  "street" varchar(150),
  "suburb" varchar(100),
  "postcode" varchar(10),
  "state" varchar(50),
  "latitude" decimal(10,7),
  "longitude" decimal(10,7),
  "geocode_status" VARCHAR(100),
  PRIMARY KEY ("address_id"),
  INDEX on_account_id ("account_id"),
  CONSTRAINT "address_ibfk_1" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id")
);
-- Dump completed on 2026-04-12 19:25:46