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