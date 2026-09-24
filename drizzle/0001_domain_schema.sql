CREATE TYPE "public"."actor_kind" AS ENUM('user', 'guest', 'system');--> statement-breakpoint
CREATE TYPE "public"."adjustment_type" AS ENUM('percentage', 'fixed', 'override');--> statement-breakpoint
CREATE TYPE "public"."automation_kind" AS ENUM('arrival_reminder', 'pre_arrival_eta', 'post_stay_review', 'guest_inactivity');--> statement-breakpoint
CREATE TYPE "public"."availability_rule_kind" AS ENUM('closed', 'closed_to_arrival', 'closed_to_departure', 'min_stay');--> statement-breakpoint
CREATE TYPE "public"."booking_source" AS ENUM('walk_in', 'website', 'phone', 'ota_booking_com', 'ota_expedia', 'ota_airbnb', 'agency', 'channel_manager', 'other');--> statement-breakpoint
CREATE TYPE "public"."companion_relationship" AS ENUM('partner', 'child', 'colleague', 'other');--> statement-breakpoint
CREATE TYPE "public"."created_via" AS ENUM('admin', 'widget', 'portal', 'import');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('id_scan', 'contract', 'special_agreement', 'invoice', 'other');--> statement-breakpoint
CREATE TYPE "public"."extra_category" AS ENUM('breakfast', 'parking', 'spa', 'pet', 'late_checkout', 'transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."extra_pricing_mode" AS ENUM('per_booking', 'per_night', 'per_guest', 'per_guest_per_night');--> statement-breakpoint
CREATE TYPE "public"."guest_package_status" AS ENUM('active', 'used_up', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."housekeeping_task_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."housekeeping_task_type" AS ENUM('departure_clean', 'stayover', 'inspection', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'partially_paid', 'void', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."maintenance_severity" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'manager', 'reception', 'housekeeping', 'readonly');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('email', 'sms', 'portal');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."package_kind" AS ENUM('nights_bundle', 'gift_card', 'monthly_pass');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('deposit', 'balance', 'full', 'refund');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'cash', 'card_terminal', 'bank_transfer', 'package', 'voucher');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('core', 'pro', 'scale');--> statement-breakpoint
CREATE TYPE "public"."portal_status" AS ENUM('none', 'invited', 'active');--> statement-breakpoint
CREATE TYPE "public"."promo_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending_validation', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('clean', 'dirty', 'inspected', 'out_of_order');--> statement-breakpoint
CREATE TYPE "public"."sms_ledger_kind" AS ENUM('purchase', 'debit', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."tax_mode" AS ENUM('included', 'added_on_top');--> statement-breakpoint
CREATE TABLE "hotel_counters" (
	"hotel_id" text NOT NULL,
	"name" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hotel_counters_pkey" PRIMARY KEY("hotel_id","name"),
	CONSTRAINT "hotel_counters_value_non_negative" CHECK ("hotel_counters"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hotel_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'Europe/London' NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"address" jsonb,
	"phone" text,
	"email" text,
	"logo_url" text,
	"brand_color" text,
	"check_in_time" time DEFAULT '15:00' NOT NULL,
	"check_out_time" time DEFAULT '11:00' NOT NULL,
	"plan" "plan" DEFAULT 'core' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"stripe_customer_id" text,
	"stripe_connect_account_id" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "hotels_slug_format" CHECK ("hotels"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "hotels_currency_supported" CHECK ("hotels"."currency" in ('GBP', 'EUR', 'USD', 'CAD')),
	CONSTRAINT "hotels_locale_supported" CHECK ("hotels"."locale" in ('en', 'fr', 'de', 'nl', 'es'))
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "staff_calendars" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"google_refresh_token_encrypted" text,
	"calendar_id" text,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_calendars_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "cancellation_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"name" text NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"no_show_charge_bp" integer DEFAULT 10000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "cancellation_policies_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "cancellation_policies_no_show_bp_range" CHECK ("cancellation_policies"."no_show_charge_bp" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"name" text NOT NULL,
	"rate_bp" integer NOT NULL,
	"mode" "tax_mode" DEFAULT 'included' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tax_rates_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "tax_rates_rate_bp_range" CHECK ("tax_rates"."rate_bp" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"kind" "availability_rule_kind" NOT NULL,
	"room_type_id" text,
	"rate_plan_id" text,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"min_nights" smallint,
	"label" text,
	"repeats_yearly" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "availability_rules_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "availability_rules_range_valid" CHECK ("availability_rules"."date_to" >= "availability_rules"."date_from"),
	CONSTRAINT "availability_rules_min_stay_has_nights" CHECK ("availability_rules"."kind" <> 'min_stay' or "availability_rules"."min_nights" >= 1)
);
--> statement-breakpoint
CREATE TABLE "capacity_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"room_type_id" text NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"rooms_available" smallint NOT NULL,
	"label" text NOT NULL,
	"repeats_yearly" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "capacity_overrides_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "capacity_overrides_range_valid" CHECK ("capacity_overrides"."date_to" >= "capacity_overrides"."date_from"),
	CONSTRAINT "capacity_overrides_rooms_non_negative" CHECK ("capacity_overrides"."rooms_available" >= 0)
);
--> statement-breakpoint
CREATE TABLE "extras" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"pricing_mode" "extra_pricing_mode" NOT NULL,
	"category" "extra_category" DEFAULT 'other' NOT NULL,
	"tax_rate_id" text,
	"is_bookable_online" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "extras_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "extras_price_non_negative" CHECK ("extras"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "package_kind" NOT NULL,
	"price" integer NOT NULL,
	"nights_included" smallint,
	"value_amount" integer,
	"validity_days" smallint NOT NULL,
	"applicable_room_type_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "packages_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "packages_price_non_negative" CHECK ("packages"."price" >= 0),
	CONSTRAINT "packages_validity_positive" CHECK ("packages"."validity_days" >= 1)
);
--> statement-breakpoint
CREATE TABLE "price_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"rate_plan_id" text,
	"room_type_id" text,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"type" "adjustment_type" NOT NULL,
	"value" integer NOT NULL,
	"label" text NOT NULL,
	"repeats_yearly" boolean DEFAULT false NOT NULL,
	"weekday_mask" smallint DEFAULT 127 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "price_adjustments_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "price_adjustments_range_valid" CHECK ("price_adjustments"."date_to" >= "price_adjustments"."date_from"),
	CONSTRAINT "price_adjustments_weekday_mask" CHECK ("price_adjustments"."weekday_mask" between 1 and 127),
	CONSTRAINT "price_adjustments_override_non_negative" CHECK ("price_adjustments"."type" <> 'override' or "price_adjustments"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"code" text NOT NULL,
	"type" "promo_type" NOT NULL,
	"value" integer NOT NULL,
	"room_type_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"min_nights" smallint,
	"max_nights" smallint,
	"valid_from" date,
	"valid_to" date,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "promo_codes_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "promo_codes_code_upper" CHECK ("promo_codes"."code" = upper("promo_codes"."code")),
	CONSTRAINT "promo_codes_value_positive" CHECK ("promo_codes"."value" > 0),
	CONSTRAINT "promo_codes_percentage_max" CHECK ("promo_codes"."type" <> 'percentage' or "promo_codes"."value" <= 10000),
	CONSTRAINT "promo_codes_used_within_max" CHECK ("promo_codes"."max_uses" is null or "promo_codes"."used_count" <= "promo_codes"."max_uses")
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"room_type_id" text NOT NULL,
	"name" text NOT NULL,
	"base_nightly_price" integer NOT NULL,
	"includes_breakfast" boolean DEFAULT false NOT NULL,
	"cancellation_policy_id" text,
	"min_nights" smallint DEFAULT 1 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "rate_plans_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "rate_plans_price_non_negative" CHECK ("rate_plans"."base_nightly_price" >= 0),
	CONSTRAINT "rate_plans_min_nights_positive" CHECK ("rate_plans"."min_nights" >= 1)
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_occupancy" smallint DEFAULT 2 NOT NULL,
	"max_occupancy" smallint DEFAULT 2 NOT NULL,
	"bed_config" text,
	"amenities" text[] DEFAULT '{}'::text[] NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_bookable_online" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "room_types_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "room_types_occupancy_valid" CHECK ("room_types"."base_occupancy" >= 1 and "room_types"."max_occupancy" >= "room_types"."base_occupancy")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"room_type_id" text NOT NULL,
	"name" text NOT NULL,
	"floor" text,
	"status" "room_status" DEFAULT 'clean' NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "rooms_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "guest_companions" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"name" text NOT NULL,
	"date_of_birth" date,
	"relationship" "companion_relationship" DEFAULT 'other' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "guest_companions_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "guest_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"package_id" text NOT NULL,
	"status" "guest_package_status" DEFAULT 'active' NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"nights_remaining" smallint,
	"amount_remaining" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_packages_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "guest_packages_remaining_non_negative" CHECK (coalesce("guest_packages"."nights_remaining", 0) >= 0 and coalesce("guest_packages"."amount_remaining", 0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "guest_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"pillow_type" text,
	"floor_preference" text,
	"allergies" text,
	"preferred_room_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_preferences_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" jsonb,
	"nationality" text,
	"language" text DEFAULT 'en' NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"portal_status" "portal_status" DEFAULT 'none' NOT NULL,
	"no_show_count" smallint DEFAULT 0 NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"source" "booking_source" DEFAULT 'other' NOT NULL,
	"lapsed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "guests_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "guests_email_lower" CHECK ("guests"."email" is null or "guests"."email" = lower("guests"."email")),
	CONSTRAINT "guests_phone_e164" CHECK ("guests"."phone" is null or "guests"."phone" ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "guests_no_show_non_negative" CHECK ("guests"."no_show_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "guest_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"reservation_id" text,
	"type" "document_type" NOT NULL,
	"blob_url" text NOT NULL,
	"display_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "guest_documents_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "guest_documents_size_limit" CHECK ("guest_documents"."size_bytes" between 1 and 15728640)
);
--> statement-breakpoint
CREATE TABLE "reservation_extras" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"reservation_id" text NOT NULL,
	"extra_id" text NOT NULL,
	"name" text NOT NULL,
	"pricing_mode" "extra_pricing_mode" NOT NULL,
	"tax_rate_bp" integer DEFAULT 0 NOT NULL,
	"qty" smallint DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"total" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_extras_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "reservation_extras_qty_positive" CHECK ("reservation_extras"."qty" >= 1),
	CONSTRAINT "reservation_extras_amounts_non_negative" CHECK ("reservation_extras"."unit_price" >= 0 and "reservation_extras"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reservation_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"reservation_id" text NOT NULL,
	"room_type_id" text NOT NULL,
	"room_id" text,
	"rate_plan_id" text NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"nightly_prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"companion_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_rooms_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "reservation_rooms_dates_valid" CHECK ("reservation_rooms"."check_out" > "reservation_rooms"."check_in")
);
--> statement-breakpoint
CREATE TABLE "reservation_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"reservation_id" text NOT NULL,
	"from_status" "reservation_status",
	"to_status" "reservation_status" NOT NULL,
	"actor_kind" "actor_kind" NOT NULL,
	"actor_user_id" text,
	"note" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_status_history_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"reference" text NOT NULL,
	"guest_id" text NOT NULL,
	"status" "reservation_status" DEFAULT 'confirmed' NOT NULL,
	"source" "booking_source" NOT NULL,
	"external_ref" text,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"nights" integer GENERATED ALWAYS AS ("check_out" - "check_in") STORED NOT NULL,
	"arrival_time" time,
	"adults" smallint DEFAULT 1 NOT NULL,
	"children" smallint DEFAULT 0 NOT NULL,
	"special_requests" text,
	"internal_notes" text,
	"contract_signed_at" timestamp with time zone,
	"contract_url" text,
	"cancellation_policy_id" text,
	"promo_code_id" text,
	"price_override" jsonb,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"currency" text NOT NULL,
	"created_via" "created_via" NOT NULL,
	"confirmed_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reservations_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "reservations_dates_valid" CHECK ("reservations"."check_out" > "reservations"."check_in"),
	CONSTRAINT "reservations_occupancy_valid" CHECK ("reservations"."adults" >= 1 and "reservations"."children" >= 0),
	CONSTRAINT "reservations_total_non_negative" CHECK ("reservations"."total_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"reservation_id" text,
	"guest_id" text NOT NULL,
	"number" integer,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" text NOT NULL,
	"tax_mode" "tax_mode" DEFAULT 'included' NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "invoices_number_when_issued" CHECK (("invoices"."status" = 'draft') = ("invoices"."number" is null)),
	CONSTRAINT "invoices_amounts_non_negative" CHECK ("invoices"."total" >= 0 and "invoices"."tax_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"reservation_id" text NOT NULL,
	"invoice_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"method" "payment_method" NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_refund_id" text,
	"guest_package_id" text,
	"note" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "payments_sign_matches_kind" CHECK (("payments"."kind" = 'refund' and "payments"."amount" < 0) or ("payments"."kind" <> 'refund' and "payments"."amount" > 0)),
	CONSTRAINT "payments_package_has_reference" CHECK ("payments"."method" <> 'package' or "payments"."guest_package_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"actor_kind" "actor_kind" NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"kind" "automation_kind" NOT NULL,
	"name" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"channels" text[] DEFAULT '{email}'::text[] NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "automations_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "automations_channels_valid" CHECK ("automations"."channels" <@ array['email', 'sms']::text[])
);
--> statement-breakpoint
CREATE TABLE "guest_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"reservation_id" text,
	"channel" "message_channel" NOT NULL,
	"direction" "message_direction" DEFAULT 'outbound' NOT NULL,
	"to_address" text,
	"subject" text,
	"body" text NOT NULL,
	"template_key" text,
	"sms_segments" integer,
	"provider_message_id" text,
	"sent_by_user_id" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_messages_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "housekeeping_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"room_id" text NOT NULL,
	"reservation_id" text,
	"date" date NOT NULL,
	"type" "housekeeping_task_type" NOT NULL,
	"status" "housekeeping_task_status" DEFAULT 'todo' NOT NULL,
	"assigned_to_user_id" text,
	"notes" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "housekeeping_tasks_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "maintenance_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"room_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" "maintenance_severity" DEFAULT 'medium' NOT NULL,
	"status" "maintenance_status" DEFAULT 'open' NOT NULL,
	"photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"reported_by_user_id" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_issues_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_hotel_id_id_key" UNIQUE("hotel_id","id")
);
--> statement-breakpoint
CREATE TABLE "sms_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"hotel_id" text NOT NULL,
	"kind" "sms_ledger_kind" NOT NULL,
	"credits" integer NOT NULL,
	"guest_message_id" text,
	"stripe_payment_intent_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sms_credits_hotel_id_id_key" UNIQUE("hotel_id","id"),
	CONSTRAINT "sms_credits_sign_matches_kind" CHECK (("sms_credits"."kind" in ('purchase', 'refund') and "sms_credits"."credits" > 0) or ("sms_credits"."kind" = 'debit' and "sms_credits"."credits" < 0) or "sms_credits"."kind" = 'adjustment')
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"hotel_id" text NOT NULL,
	"date" date NOT NULL,
	"occupancy_bp" integer DEFAULT 0 NOT NULL,
	"rooms_sold" integer DEFAULT 0 NOT NULL,
	"room_nights_available" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"adr" integer DEFAULT 0 NOT NULL,
	"revpar" integer DEFAULT 0 NOT NULL,
	"arrivals" integer DEFAULT 0 NOT NULL,
	"departures" integer DEFAULT 0 NOT NULL,
	"new_bookings" integer DEFAULT 0 NOT NULL,
	"cancellations" integer DEFAULT 0 NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_stats_pkey" PRIMARY KEY("hotel_id","date")
);
--> statement-breakpoint
ALTER TABLE "hotel_counters" ADD CONSTRAINT "hotel_counters_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_groups" ADD CONSTRAINT "hotel_groups_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_group_id_hotel_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_calendars" ADD CONSTRAINT "staff_calendars_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_calendars" ADD CONSTRAINT "staff_calendars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_policies" ADD CONSTRAINT "cancellation_policies_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_room_type_fk" FOREIGN KEY ("hotel_id","room_type_id") REFERENCES "public"."room_types"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_rate_plan_fk" FOREIGN KEY ("hotel_id","rate_plan_id") REFERENCES "public"."rate_plans"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_overrides" ADD CONSTRAINT "capacity_overrides_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_overrides" ADD CONSTRAINT "capacity_overrides_room_type_fk" FOREIGN KEY ("hotel_id","room_type_id") REFERENCES "public"."room_types"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extras" ADD CONSTRAINT "extras_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extras" ADD CONSTRAINT "extras_tax_rate_fk" FOREIGN KEY ("hotel_id","tax_rate_id") REFERENCES "public"."tax_rates"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_rate_plan_fk" FOREIGN KEY ("hotel_id","rate_plan_id") REFERENCES "public"."rate_plans"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_room_type_fk" FOREIGN KEY ("hotel_id","room_type_id") REFERENCES "public"."room_types"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_room_type_fk" FOREIGN KEY ("hotel_id","room_type_id") REFERENCES "public"."room_types"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_cancellation_policy_fk" FOREIGN KEY ("hotel_id","cancellation_policy_id") REFERENCES "public"."cancellation_policies"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_fk" FOREIGN KEY ("hotel_id","room_type_id") REFERENCES "public"."room_types"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_companions" ADD CONSTRAINT "guest_companions_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_companions" ADD CONSTRAINT "guest_companions_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_packages" ADD CONSTRAINT "guest_packages_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_packages" ADD CONSTRAINT "guest_packages_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_packages" ADD CONSTRAINT "guest_packages_package_fk" FOREIGN KEY ("hotel_id","package_id") REFERENCES "public"."packages"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_preferences" ADD CONSTRAINT "guest_preferences_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_preferences" ADD CONSTRAINT "guest_preferences_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_preferences" ADD CONSTRAINT "guest_preferences_room_fk" FOREIGN KEY ("hotel_id","preferred_room_id") REFERENCES "public"."rooms"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_documents" ADD CONSTRAINT "guest_documents_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_documents" ADD CONSTRAINT "guest_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_documents" ADD CONSTRAINT "guest_documents_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_documents" ADD CONSTRAINT "guest_documents_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_extra_fk" FOREIGN KEY ("hotel_id","extra_id") REFERENCES "public"."extras"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_rooms" ADD CONSTRAINT "reservation_rooms_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_rooms" ADD CONSTRAINT "reservation_rooms_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_rooms" ADD CONSTRAINT "reservation_rooms_room_type_fk" FOREIGN KEY ("hotel_id","room_type_id") REFERENCES "public"."room_types"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_rooms" ADD CONSTRAINT "reservation_rooms_room_fk" FOREIGN KEY ("hotel_id","room_id") REFERENCES "public"."rooms"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_rooms" ADD CONSTRAINT "reservation_rooms_rate_plan_fk" FOREIGN KEY ("hotel_id","rate_plan_id") REFERENCES "public"."rate_plans"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cancellation_policy_fk" FOREIGN KEY ("hotel_id","cancellation_policy_id") REFERENCES "public"."cancellation_policies"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_promo_code_fk" FOREIGN KEY ("hotel_id","promo_code_id") REFERENCES "public"."promo_codes"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_fk" FOREIGN KEY ("hotel_id","invoice_id") REFERENCES "public"."invoices"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_guest_package_fk" FOREIGN KEY ("hotel_id","guest_package_id") REFERENCES "public"."guest_packages"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_messages" ADD CONSTRAINT "guest_messages_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_messages" ADD CONSTRAINT "guest_messages_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_messages" ADD CONSTRAINT "guest_messages_guest_fk" FOREIGN KEY ("hotel_id","guest_id") REFERENCES "public"."guests"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_messages" ADD CONSTRAINT "guest_messages_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_room_fk" FOREIGN KEY ("hotel_id","room_id") REFERENCES "public"."rooms"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_reservation_fk" FOREIGN KEY ("hotel_id","reservation_id") REFERENCES "public"."reservations"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_issues" ADD CONSTRAINT "maintenance_issues_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_issues" ADD CONSTRAINT "maintenance_issues_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_issues" ADD CONSTRAINT "maintenance_issues_room_fk" FOREIGN KEY ("hotel_id","room_id") REFERENCES "public"."rooms"("hotel_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_credits" ADD CONSTRAINT "sms_credits_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_credits" ADD CONSTRAINT "sms_credits_guest_message_fk" FOREIGN KEY ("hotel_id","guest_message_id") REFERENCES "public"."guest_messages"("hotel_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hotels_slug_key" ON "hotels" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "hotels_group_id_idx" ON "hotels" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_token_hash_key" ON "invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invites_hotel_email_idx" ON "invites" USING btree ("hotel_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_hotel_user_key" ON "memberships" USING btree ("hotel_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_calendars_hotel_user_key" ON "staff_calendars" USING btree ("hotel_id","user_id");--> statement-breakpoint
CREATE INDEX "availability_rules_range_idx" ON "availability_rules" USING btree ("hotel_id","date_from","date_to");--> statement-breakpoint
CREATE INDEX "capacity_overrides_range_idx" ON "capacity_overrides" USING btree ("hotel_id","room_type_id","date_from");--> statement-breakpoint
CREATE INDEX "price_adjustments_range_idx" ON "price_adjustments" USING btree ("hotel_id","date_from","date_to");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_codes_hotel_code_key" ON "promo_codes" USING btree ("hotel_id","code") WHERE "promo_codes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "rate_plans_room_type_idx" ON "rate_plans" USING btree ("hotel_id","room_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_hotel_name_key" ON "rooms" USING btree ("hotel_id","name") WHERE "rooms"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "rooms_room_type_idx" ON "rooms" USING btree ("hotel_id","room_type_id");--> statement-breakpoint
CREATE INDEX "guest_companions_guest_idx" ON "guest_companions" USING btree ("hotel_id","guest_id");--> statement-breakpoint
CREATE INDEX "guest_packages_guest_idx" ON "guest_packages" USING btree ("hotel_id","guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_preferences_guest_key" ON "guest_preferences" USING btree ("hotel_id","guest_id");--> statement-breakpoint
CREATE INDEX "guests_hotel_email_idx" ON "guests" USING btree ("hotel_id","email");--> statement-breakpoint
CREATE INDEX "guests_hotel_name_idx" ON "guests" USING btree ("hotel_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "guest_documents_guest_idx" ON "guest_documents" USING btree ("hotel_id","guest_id");--> statement-breakpoint
CREATE INDEX "reservation_extras_reservation_idx" ON "reservation_extras" USING btree ("hotel_id","reservation_id");--> statement-breakpoint
CREATE INDEX "reservation_rooms_reservation_idx" ON "reservation_rooms" USING btree ("hotel_id","reservation_id");--> statement-breakpoint
CREATE INDEX "reservation_rooms_type_dates_idx" ON "reservation_rooms" USING btree ("hotel_id","room_type_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "reservation_status_history_reservation_idx" ON "reservation_status_history" USING btree ("hotel_id","reservation_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_hotel_reference_key" ON "reservations" USING btree ("hotel_id","reference");--> statement-breakpoint
CREATE INDEX "reservations_hotel_check_in_idx" ON "reservations" USING btree ("hotel_id","check_in");--> statement-breakpoint
CREATE INDEX "reservations_hotel_check_out_idx" ON "reservations" USING btree ("hotel_id","check_out");--> statement-breakpoint
CREATE INDEX "reservations_hotel_status_idx" ON "reservations" USING btree ("hotel_id","status");--> statement-breakpoint
CREATE INDEX "reservations_hotel_guest_idx" ON "reservations" USING btree ("hotel_id","guest_id");--> statement-breakpoint
CREATE INDEX "reservations_hotel_created_idx" ON "reservations" USING btree ("hotel_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_hotel_number_key" ON "invoices" USING btree ("hotel_id","number") WHERE "invoices"."number" is not null;--> statement-breakpoint
CREATE INDEX "invoices_reservation_idx" ON "invoices" USING btree ("hotel_id","reservation_id");--> statement-breakpoint
CREATE INDEX "payments_reservation_idx" ON "payments" USING btree ("hotel_id","reservation_id");--> statement-breakpoint
CREATE INDEX "payments_received_idx" ON "payments" USING btree ("hotel_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_stripe_intent_key" ON "payments" USING btree ("stripe_payment_intent_id") WHERE "payments"."stripe_payment_intent_id" is not null and "payments"."kind" <> 'refund';--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("hotel_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_hotel_created_idx" ON "audit_log" USING btree ("hotel_id","created_at");--> statement-breakpoint
CREATE INDEX "guest_messages_guest_idx" ON "guest_messages" USING btree ("hotel_id","guest_id","created_at");--> statement-breakpoint
CREATE INDEX "guest_messages_reservation_idx" ON "guest_messages" USING btree ("hotel_id","reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "housekeeping_tasks_room_date_type_key" ON "housekeeping_tasks" USING btree ("hotel_id","room_id","date","type");--> statement-breakpoint
CREATE INDEX "housekeeping_tasks_hotel_date_idx" ON "housekeeping_tasks" USING btree ("hotel_id","date");--> statement-breakpoint
CREATE INDEX "maintenance_issues_hotel_status_idx" ON "maintenance_issues" USING btree ("hotel_id","status");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "sms_credits_hotel_idx" ON "sms_credits" USING btree ("hotel_id","created_at");