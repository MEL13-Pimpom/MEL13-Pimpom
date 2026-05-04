-- recycling_pickup_scheduler_account.sql
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

-- recycling_pickup_scheduler_address.sql
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

-- recycling_pickup_scheduler_audit_log.sql
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

-- recycling_pickup_scheduler_notification.sql
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

-- recycling_pickup_scheduler_pickup_request.sql
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

-- recycling_pickup_scheduler_pickup_time_slot.sql
--
;
--
-- Table structure for table "pickup_time_slot"
--
DROP TABLE IF EXISTS "pickup_time_slot";
CREATE TABLE "pickup_time_slot" (
  "slot_id" SERIAL,
  "service_date" date,
  "start_time" time,
  "end_time" time,
  "service_area" varchar(100),
  "max_capacity" INTEGER,
  "current_booking_count" INTEGER,
  "slot_status" VARCHAR(100),
  PRIMARY KEY ("slot_id")
);
-- Dump completed on 2026-04-12 19:25:46

-- recycling_pickup_scheduler_request_image.sql
--
;
--
-- Table structure for table "request_image"
--
DROP TABLE IF EXISTS "request_image";
CREATE TABLE "request_image" (
  "image_id" SERIAL,
  "request_id" INTEGER,
  "file_name" varchar(255),
  "file_type" varchar(50),
  "image_role" VARCHAR(100),
  "upload_time" TIMESTAMP,
  PRIMARY KEY ("image_id"),
  INDEX on_request_id ("request_id"),
  CONSTRAINT "request_image_ibfk_1" FOREIGN KEY ("request_id") REFERENCES "pickup_request" ("request_id")
);
-- Dump completed on 2026-04-12 19:25:45

-- recycling_pickup_scheduler_request_item.sql
--
;
--
-- Table structure for table "request_item"
--
DROP TABLE IF EXISTS "request_item";
CREATE TABLE "request_item" (
  "request_item_id" SERIAL,
  "request_id" INTEGER,
  "category_id" INTEGER,
  "estimated_quantity" decimal(10,2),
  "quantity_unit" varchar(20),
  "ai_confidence" decimal(5,2),
  "review_status" VARCHAR(100),
  PRIMARY KEY ("request_item_id"),
  INDEX on_request_id ("request_id"),
  INDEX on_category_id ("category_id"),
  CONSTRAINT "request_item_ibfk_1" FOREIGN KEY ("request_id") REFERENCES "pickup_request" ("request_id"),
  CONSTRAINT "request_item_ibfk_2" FOREIGN KEY ("category_id") REFERENCES "waste_category" ("category_id")
);
-- Dump completed on 2026-04-12 19:25:46

-- recycling_pickup_scheduler_waste_category.sql
--
;
--
-- Table structure for table "waste_category"
--
DROP TABLE IF EXISTS "waste_category";
CREATE TABLE "waste_category" (
  "category_id" SERIAL,
  "category_name" varchar(100),
  "description" text,
  PRIMARY KEY ("category_id")
);
-- Dump completed on 2026-04-12 19:25:45