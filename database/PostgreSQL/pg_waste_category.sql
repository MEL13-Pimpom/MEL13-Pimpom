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