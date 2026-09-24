-- Database-level guarantee: an assigned room can never hold two active stays on the same night.
-- The application also locks before creating (spec §6.1); this is the backstop if a code path
-- ever forgets. Stays are half-open [check_in, check_out), so a checkout on day D and a check-in
-- on day D do not conflict. Cancelled and no-show stays set is_active = false and drop out.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "reservation_rooms"
  ADD CONSTRAINT "reservation_rooms_no_double_booking"
  EXCLUDE USING gist (
    "hotel_id" WITH =,
    "room_id" WITH =,
    daterange("check_in", "check_out", '[)') WITH &&
  ) WHERE ("room_id" IS NOT NULL AND "is_active");
