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