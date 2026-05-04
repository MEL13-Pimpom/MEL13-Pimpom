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