

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."application_status" AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."artwork_category" AS ENUM (
    'art_design',
    'painting',
    'sculpture',
    'book',
    'fashion'
);


ALTER TYPE "public"."artwork_category" OWNER TO "postgres";


CREATE TYPE "public"."artwork_subcategory" AS ENUM (
    'digital',
    'print',
    'abstract',
    'minimalist',
    'afrofuturist',
    'traditional',
    'oil',
    'acrylic',
    'mixed_media',
    'watercolor',
    'wood',
    'clay',
    'bronze',
    'recycled',
    'stone',
    'poetry',
    'photography',
    'essays',
    'fiction',
    'non_fiction',
    'biography',
    'religious',
    'political',
    'women',
    'men',
    'accessories',
    'jewelry',
    'bags'
);


ALTER TYPE "public"."artwork_subcategory" OWNER TO "postgres";


CREATE TYPE "public"."book_format" AS ENUM (
    'physical',
    'digital',
    'both'
);


ALTER TYPE "public"."book_format" OWNER TO "postgres";


CREATE TYPE "public"."creator_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);


ALTER TYPE "public"."creator_status" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'virtual',
    'physical',
    'hybrid'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE TYPE "public"."fashion_size" AS ENUM (
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
    'XXXL',
    'one_size'
);


ALTER TYPE "public"."fashion_size" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'buyer',
    'creator',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("user_uuid" "uuid", "notification_type" "text", "notification_title" "text", "notification_message" "text", "notification_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (user_uuid, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create notification: %', SQLERRM;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."create_notification"("user_uuid" "uuid", "notification_type" "text", "notification_title" "text", "notification_message" "text", "notification_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  order_num TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = order_num) INTO exists_check;
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN order_num;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_role text;
  v_role_enum public.user_role;
  v_full_name text;
  v_creator_status public.creator_status;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'user_type', 'buyer');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User');

  -- Map string to enum safely
  IF v_role NOT IN ('buyer','creator','admin') THEN
    v_role_enum := 'buyer';
  ELSE
    v_role_enum := v_role::public.user_role;
  END IF;

  v_creator_status := CASE WHEN v_role_enum = 'creator' THEN 'pending' ELSE NULL END;

  INSERT INTO public.user_profiles (id, email, full_name, role, creator_status)
  VALUES (NEW.id, NEW.email, v_full_name, v_role_enum, v_creator_status)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        creator_status = EXCLUDED.creator_status,
        updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block signup; log as a warning
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_review_rating_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_creator_rating(NEW.creator_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_creator_rating(OLD.creator_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to handle review rating update: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."handle_review_rating_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_artwork_views"("artwork_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE artworks 
  SET views_count = views_count + 1 
  WHERE id = artwork_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to increment artwork views: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."increment_artwork_views"("artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_creator_rating"("creator_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) 
  INTO avg_rating, review_count
  FROM reviews 
  WHERE creator_id = creator_uuid;
  
  UPDATE user_profiles 
  SET rating = COALESCE(avg_rating, 0),
      review_count = review_count
  WHERE id = creator_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update creator rating: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."update_creator_rating"("creator_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artworks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "public"."artwork_category" NOT NULL,
    "price" numeric(10,2),
    "original_price" numeric(10,2),
    "image_urls" "text"[] DEFAULT '{}'::"text"[],
    "thumbnail_url" "text",
    "is_available" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artworks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_audit_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "event_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."auth_audit_log" IS 'Logs significant events related to user authentication.';



ALTER TABLE "public"."auth_audit_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."auth_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text",
    "featured_image_url" "text",
    "is_published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "slug" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "parent_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "commentable_type" "text" NOT NULL,
    "commentable_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "is_approved" boolean DEFAULT true,
    "likes_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "creator_id" "uuid",
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "text" DEFAULT 'percentage'::"text" NOT NULL,
    "discount_value" numeric(10,2) DEFAULT 0 NOT NULL,
    "minimum_order_amount" numeric(10,2),
    "usage_limit" integer,
    "used_count" integer DEFAULT 0,
    "usage_limit_per_user" integer DEFAULT 1,
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creator_applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "application_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "public"."application_status" DEFAULT 'pending'::"public"."application_status",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "review_notes" "text",
    "portfolio_urls" "text"[] DEFAULT '{}'::"text"[],
    "experience_years" integer,
    "artistic_statement" "text",
    "previous_exhibitions" "text"[] DEFAULT '{}'::"text"[],
    "education_background" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."creator_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_data" "jsonb" DEFAULT '{}'::"jsonb",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "attended" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organizer_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "public"."event_type" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "city" "text",
    "country" "text",
    "is_free" boolean DEFAULT true,
    "ticket_price" numeric(10,2),
    "is_featured" boolean DEFAULT false,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "artwork_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "variant_info" "jsonb" DEFAULT '{}'::"jsonb",
    "creator_commission_rate" numeric(5,4) DEFAULT 0.85,
    "platform_fee_rate" numeric(5,4) DEFAULT 0.15,
    "creator_earnings" numeric(10,2) DEFAULT 0,
    "platform_earnings" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_number" "text" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "shipping_amount" numeric(12,2) DEFAULT 0,
    "discount_amount" numeric(12,2) DEFAULT 0,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'NGN'::"text",
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_method" "text",
    "payment_reference" "text",
    "shipping_address" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "billing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_method" "text",
    "tracking_number" "text",
    "estimated_delivery" "date",
    "delivered_at" timestamp with time zone,
    "notes" "text",
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "page_type" "text" NOT NULL,
    "page_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "referrer" "text",
    "country" "text",
    "city" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "artwork_id" "uuid",
    "creator_id" "uuid",
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "title" "text",
    "comment" "text",
    "images" "text"[] DEFAULT '{}'::"text"[],
    "is_verified_purchase" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "helpful_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_rates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "shipping_zone_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "rate" numeric(10,2) DEFAULT 0 NOT NULL,
    "estimated_days_min" integer,
    "estimated_days_max" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_zones" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "countries" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_zones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'buyer'::"public"."user_role" NOT NULL,
    "creator_status" "public"."creator_status",
    "bio" "text",
    "location" "text",
    "country" "text",
    "phone" "text",
    "discipline" "text",
    "avatar_url" "text",
    "is_verified" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "rating" numeric(3,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "artwork_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_audit_log"
    ADD CONSTRAINT "auth_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_applications"
    ADD CONSTRAINT "creator_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_zones"
    ADD CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_artwork_id_key" UNIQUE ("user_id", "artwork_id");



CREATE INDEX "idx_artworks_creator_id" ON "public"."artworks" USING "btree" ("creator_id");



CREATE INDEX "idx_artworks_is_available" ON "public"."artworks" USING "btree" ("is_available");



CREATE INDEX "idx_artworks_is_featured" ON "public"."artworks" USING "btree" ("is_featured");



CREATE INDEX "idx_comments_commentable" ON "public"."comments" USING "btree" ("commentable_type", "commentable_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_events_is_published" ON "public"."events" USING "btree" ("is_published");



CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");



CREATE INDEX "idx_follows_follower" ON "public"."follows" USING "btree" ("follower_id", "created_at" DESC);



CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_order_items_artwork_id" ON "public"."order_items" USING "btree" ("artwork_id");



CREATE INDEX "idx_order_items_creator_id" ON "public"."order_items" USING "btree" ("creator_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_buyer_id" ON "public"."orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_reviews_artwork_id" ON "public"."reviews" USING "btree" ("artwork_id");



CREATE INDEX "idx_reviews_creator_id" ON "public"."reviews" USING "btree" ("creator_id");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");



CREATE INDEX "idx_user_profiles_is_featured" ON "public"."user_profiles" USING "btree" ("is_featured");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE INDEX "idx_wishlists_artwork" ON "public"."wishlists" USING "btree" ("artwork_id");



CREATE INDEX "idx_wishlists_user" ON "public"."wishlists" USING "btree" ("user_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "handle_review_rating_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."handle_review_rating_update"();



CREATE OR REPLACE TRIGGER "handle_updated_at_comments" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_orders" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_reviews" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_audit_log"
    ADD CONSTRAINT "auth_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_audit_log"
    ADD CONSTRAINT "fk_auth_audit_log_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_shipping_zone_id_fkey" FOREIGN KEY ("shipping_zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can insert page views" ON "public"."page_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active coupons" ON "public"."coupons" FOR SELECT USING ((("is_active" = true) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Anyone can view active shipping rates" ON "public"."shipping_rates" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view approved comments" ON "public"."comments" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Anyone can view approved reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view categories" ON "public"."categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view shipping zones" ON "public"."shipping_zones" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Buyers can create orders" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can update own orders" ON "public"."orders" FOR UPDATE USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Creators can manage own coupons" ON "public"."coupons" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Creators can manage own shipping rates" ON "public"."shipping_rates" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Creators can view orders for their items" ON "public"."orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."order_items" "oi"
  WHERE (("oi"."order_id" = "orders"."id") AND ("oi"."creator_id" = "auth"."uid"())))));



CREATE POLICY "System can manage order items" ON "public"."order_items" USING (true);



CREATE POLICY "Users can create comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own applications" ON "public"."creator_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can manage own follows" ON "public"."follows" USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can manage own registrations" ON "public"."event_registrations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own wishlist" ON "public"."wishlists" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own pending applications" ON "public"."creator_applications" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."application_status")));



CREATE POLICY "Users can update own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can view order items for their orders" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND (("o"."buyer_id" = "auth"."uid"()) OR ("order_items"."creator_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view own applications" ON "public"."creator_applications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own orders as buyer" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Users can view who follows them" ON "public"."follows" FOR SELECT USING (("auth"."uid"() = "following_id"));



CREATE POLICY "allow_signup_profile_creation" ON "public"."user_profiles" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."creator_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follows_delete_self" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_insert_self" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_select_self_or_target" ON "public"."follows" FOR SELECT USING ((("auth"."uid"() = "follower_id") OR ("auth"."uid"() = "following_id")));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_zones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_select_public" ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "user_profiles_update_own" ON "public"."user_profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "user_profiles_update_self" ON "public"."user_profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlists_delete_own" ON "public"."wishlists" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "wishlists_insert_own" ON "public"."wishlists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "wishlists_select_own" ON "public"."wishlists" FOR SELECT USING (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("user_uuid" "uuid", "notification_type" "text", "notification_title" "text", "notification_message" "text", "notification_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("user_uuid" "uuid", "notification_type" "text", "notification_title" "text", "notification_message" "text", "notification_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("user_uuid" "uuid", "notification_type" "text", "notification_title" "text", "notification_message" "text", "notification_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_review_rating_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_review_rating_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_review_rating_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_artwork_views"("artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_artwork_views"("artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_artwork_views"("artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_creator_rating"("creator_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_creator_rating"("creator_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_creator_rating"("creator_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."artworks" TO "anon";
GRANT ALL ON TABLE "public"."artworks" TO "authenticated";
GRANT ALL ON TABLE "public"."artworks" TO "service_role";



GRANT ALL ON TABLE "public"."auth_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."auth_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."auth_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."auth_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."auth_audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."creator_applications" TO "anon";
GRANT ALL ON TABLE "public"."creator_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_applications" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_rates" TO "anon";
GRANT ALL ON TABLE "public"."shipping_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_rates" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_zones" TO "anon";
GRANT ALL ON TABLE "public"."shipping_zones" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_zones" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
