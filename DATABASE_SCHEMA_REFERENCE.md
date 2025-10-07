# Loge Arts Database Schema Reference

**Project**: Loge Arts - African Arts, Books & Fashion Marketplace  
**Database**: Supabase PostgreSQL  
**Last Updated**: September 29, 2025  
**Status**: Production Ready ✅

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Logistics Tables](#logistics-tables)
4. [Authentication & Security](#authentication--security)
5. [Sample Data](#sample-data)
6. [API Integration](#api-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Loge Arts platform uses **22 main tables** to support:

- **User Management**: Profiles, authentication, roles
- **Marketplace**: Artworks, books, fashion items
- **Content**: Events, blog posts
- **Commerce**: Carts, orders, reviews, wishlists
- **Logistics**: Shipping, tracking, quotes
- **Social**: Follows, reviews
- **Creator Submissions**: Project submissions, reviews, onboarding

### Current Data Status

- **2 Featured Creators** (users with creator role)
- **3 Featured Artworks** (available and featured)
- **3 Published Events** (upcoming events)
- **3 Published Blog Posts** (published content)

---

## 🗄️ Core Tables

### 1. **user_profiles**

**Purpose**: Extended user information beyond Supabase auth  
**Relationship**: One-to-one with `auth.users`

| Column           | Type         | Nullable | Default | Notes                       |
| ---------------- | ------------ | -------- | ------- | --------------------------- |
| `id`             | uuid         | NO       | -       | FK to auth.users(id)        |
| `email`          | text         | NO       | -       | User email                  |
| `full_name`      | text         | NO       | -       | Display name                |
| `role`           | text         | NO       | -       | 'buyer', 'creator', 'admin' |
| `bio`            | text         | YES      | -       | User biography              |
| `location`       | text         | YES      | -       | User location               |
| `discipline`     | text         | YES      | -       | Creator specialty           |
| `avatar_url`     | text         | YES      | -       | Profile image URL           |
| `social_links`   | jsonb        | YES      | '{}'    | Social media links          |
| `rating`         | numeric      | YES      | -       | Creator rating (0-5)        |
| `created_at`     | timestamptz  | YES      | now()   | Account creation            |
| `updated_at`     | timestamptz  | YES      | now()   | Last update                 |
| `creator_status` | user-defined | YES      | -       | Creator verification status |
| `is_verified`    | boolean      | YES      | false   | Verified creator badge      |
| `is_featured`    | boolean      | YES      | false   | Featured on homepage        |

**Key Features**:

- ✅ RLS enabled with public read policy
- ✅ Auto-updated timestamps
- ✅ Featured creators for homepage

---

### 2. **artworks**

**Purpose**: Art pieces, paintings, sculptures, digital art  
**Relationship**: Many-to-one with `user_profiles` (creator)

| Column           | Type        | Nullable | Default           | Notes                         |
| ---------------- | ----------- | -------- | ----------------- | ----------------------------- |
| `id`             | uuid        | NO       | gen_random_uuid() | Primary key                   |
| `creator_id`     | uuid        | YES      | -                 | FK to user_profiles(id)       |
| `title`          | text        | YES      | -                 | Artwork title                 |
| `description`    | text        | YES      | -                 | Artwork description           |
| `price`          | numeric     | YES      | -                 | Price in local currency       |
| `original_price` | numeric     | YES      | -                 | Original price (for sales)    |
| `is_available`   | boolean     | YES      | true              | Available for purchase        |
| `created_at`     | timestamptz | YES      | now()             | Creation timestamp            |
| `updated_at`     | timestamptz | YES      | now()             | Last update                   |
| `category`       | text        | YES      | -                 | 'painting', 'sculpture', etc. |
| `subcategory`    | text        | YES      | -                 | More specific category        |
| `currency`       | text        | YES      | 'USD'             | Price currency                |
| `image_urls`     | text[]      | YES      | -                 | Array of image URLs           |
| `thumbnail_url`  | text        | YES      | -                 | Main display image            |
| `tags`           | text[]      | YES      | -                 | Search tags                   |
| `dimensions`     | text        | YES      | -                 | Physical dimensions           |
| `materials`      | text        | YES      | -                 | Materials used                |
| `is_featured`    | boolean     | YES      | false             | Featured on homepage          |
| `views_count`    | integer     | YES      | 0                 | View counter                  |

**Key Features**:

- ✅ RLS enabled with public read policy
- ✅ Featured artworks for homepage
- ✅ Support for image galleries
- ✅ Pricing and availability management

---

### 3. **events**

**Purpose**: Art exhibitions, workshops, fashion shows  
**Relationship**: Many-to-one with `user_profiles` (organizer)

| Column             | Type        | Nullable | Default           | Notes                                |
| ------------------ | ----------- | -------- | ----------------- | ------------------------------------ |
| `id`               | uuid        | NO       | gen_random_uuid() | Primary key                          |
| `title`            | text        | NO       | -                 | Event title                          |
| `description`      | text        | YES      | -                 | Event description                    |
| `event_type`       | text        | NO       | -                 | 'exhibition', 'workshop', etc.       |
| `event_date`       | timestamptz | NO       | -                 | Event date/time                      |
| `start_date`       | timestamptz | YES      | -                 | **GENERATED ALWAYS AS (event_date)** |
| `location`         | text        | YES      | -                 | Event location                       |
| `image_url`        | text        | YES      | -                 | Event image                          |
| `registration_url` | text        | YES      | -                 | Registration link                    |
| `is_featured`      | boolean     | YES      | false             | Featured on homepage                 |
| `is_published`     | boolean     | YES      | true              | Published status                     |
| `is_free`          | boolean     | YES      | true              | Free or paid event                   |
| `ticket_price`     | numeric     | YES      | -                 | Ticket price if paid                 |
| `created_at`       | timestamptz | YES      | now()             | Creation timestamp                   |
| `updated_at`       | timestamptz | YES      | now()             | Last update                          |

**⚠️ Important**: `start_date` is a **GENERATED COLUMN** - never insert into it directly!

**Key Features**:

- ✅ RLS enabled with public read policy
- ✅ Featured events for homepage
- ✅ Support for free and paid events

---

### 4. **blog_posts**

**Purpose**: Blog articles, artist stories, cultural content  
**Relationship**: Many-to-one with `user_profiles` (author)

| Column               | Type        | Nullable | Default           | Notes                   |
| -------------------- | ----------- | -------- | ----------------- | ----------------------- |
| `id`                 | uuid        | NO       | gen_random_uuid() | Primary key             |
| `author_id`          | uuid        | NO       | -                 | FK to user_profiles(id) |
| `title`              | text        | NO       | -                 | Post title              |
| `slug`               | text        | NO       | -                 | URL slug (unique)       |
| `excerpt`            | text        | YES      | -                 | Short description       |
| `content`            | text        | NO       | -                 | Full post content       |
| `featured_image_url` | text        | YES      | -                 | Header image            |
| `is_published`       | boolean     | YES      | false             | Published status        |
| `published_at`       | timestamptz | YES      | -                 | Publication date        |
| `tags`               | text[]      | YES      | -                 | Content tags            |
| `created_at`         | timestamptz | YES      | now()             | Creation timestamp      |
| `updated_at`         | timestamptz | YES      | now()             | Last update             |

**Key Features**:

- ✅ RLS enabled with public read policy
- ✅ SEO-friendly slugs
- ✅ Published blog posts for homepage

---

## 🚚 Logistics Tables

### 5. **orders**

**Purpose**: Purchase orders and transactions  
**Relationships**: Links buyers, sellers, and items

| Column              | Type          | Nullable | Default           | Notes                     |
| ------------------- | ------------- | -------- | ----------------- | ------------------------- |
| `id`                | uuid          | NO       | gen_random_uuid() | Primary key               |
| `buyer_id`          | uuid          | NO       | -                 | FK to auth.users(id)      |
| `seller_id`         | uuid          | NO       | -                 | FK to auth.users(id)      |
| `item_id`           | uuid          | NO       | -                 | Reference to artwork/item |
| `item_type`         | varchar(50)   | NO       | -                 | 'art', 'book', 'fashion'  |
| `quantity`          | integer       | YES      | 1                 | Item quantity             |
| `unit_price`        | decimal(10,2) | NO       | -                 | Price per unit            |
| `total_amount`      | decimal(10,2) | NO       | -                 | Total order amount        |
| `shipping_cost`     | decimal(10,2) | YES      | 0                 | Shipping fee              |
| `status`            | varchar(50)   | YES      | 'pending'         | Order status              |
| `payment_status`    | varchar(50)   | YES      | 'pending'         | Payment status            |
| `payment_reference` | varchar(255)  | YES      | -                 | Paystack reference        |
| `created_at`        | timestamptz   | YES      | now()             | Order creation            |
| `updated_at`        | timestamptz   | YES      | now()             | Last update               |

---

### 6. **shipments**

**Purpose**: Shipping and delivery tracking  
**Relationship**: One-to-one with `orders`

| Column                    | Type          | Nullable | Default           | Notes                    |
| ------------------------- | ------------- | -------- | ----------------- | ------------------------ |
| `id`                      | uuid          | NO       | gen_random_uuid() | Primary key              |
| `order_id`                | uuid          | NO       | -                 | FK to orders(id)         |
| `tracking_number`         | varchar(255)  | NO       | -                 | Unique tracking ID       |
| `provider`                | varchar(100)  | NO       | -                 | 'Sendbox', 'GIG', 'Kwik' |
| `service_type`            | varchar(100)  | YES      | -                 | Service level            |
| `pickup_address`          | jsonb         | NO       | -                 | Pickup location          |
| `delivery_address`        | jsonb         | NO       | -                 | Delivery location        |
| `package_details`         | jsonb         | NO       | -                 | Weight, dimensions, etc. |
| `shipping_cost`           | decimal(10,2) | NO       | -                 | Shipping fee             |
| `insurance_cost`          | decimal(10,2) | YES      | 0                 | Insurance fee            |
| `status`                  | varchar(50)   | YES      | 'pending'         | Shipment status          |
| `current_location`        | text          | YES      | -                 | Current package location |
| `estimated_delivery_date` | timestamptz   | YES      | -                 | ETA                      |
| `actual_delivery_date`    | timestamptz   | YES      | -                 | Actual delivery          |
| `label_url`               | text          | YES      | -                 | Shipping label URL       |
| `special_instructions`    | text          | YES      | -                 | Handling instructions    |
| `created_at`              | timestamptz   | YES      | now()             | Creation timestamp       |
| `updated_at`              | timestamptz   | YES      | now()             | Last update              |

---

### 7. **tracking_events**

**Purpose**: Detailed shipment tracking history  
**Relationship**: Many-to-one with `shipments`

| Column        | Type         | Nullable | Default           | Notes               |
| ------------- | ------------ | -------- | ----------------- | ------------------- |
| `id`          | uuid         | NO       | gen_random_uuid() | Primary key         |
| `shipment_id` | uuid         | NO       | -                 | FK to shipments(id) |
| `timestamp`   | timestamptz  | NO       | -                 | Event timestamp     |
| `status`      | varchar(100) | NO       | -                 | Status update       |
| `location`    | text         | YES      | -                 | Event location      |
| `description` | text         | YES      | -                 | Event description   |
| `created_at`  | timestamptz  | YES      | now()             | Record creation     |

---

### 8. **shipping_addresses**

**Purpose**: User saved delivery addresses  
**Relationship**: Many-to-one with `auth.users`

| Column           | Type         | Nullable | Default           | Notes                |
| ---------------- | ------------ | -------- | ----------------- | -------------------- |
| `id`             | uuid         | NO       | gen_random_uuid() | Primary key          |
| `user_id`        | uuid         | NO       | -                 | FK to auth.users(id) |
| `recipient_name` | varchar(255) | NO       | -                 | Recipient name       |
| `phone`          | varchar(20)  | NO       | -                 | Contact phone        |
| `email`          | varchar(255) | YES      | -                 | Contact email        |
| `street`         | text         | NO       | -                 | Street address       |
| `city`           | varchar(100) | NO       | -                 | City                 |
| `state`          | varchar(100) | NO       | -                 | State/Province       |
| `country`        | varchar(100) | YES      | 'Nigeria'         | Country              |
| `postal_code`    | varchar(20)  | YES      | -                 | Postal code          |
| `landmark`       | text         | YES      | -                 | Landmark reference   |
| `is_default`     | boolean      | YES      | false             | Default address      |
| `created_at`     | timestamptz  | YES      | now()             | Creation timestamp   |
| `updated_at`     | timestamptz  | YES      | now()             | Last update          |

---

### 9. **shipping_quotes**

**Purpose**: Temporary storage of shipping quotes  
**Relationship**: Many-to-one with `auth.users`

| Column                    | Type          | Nullable | Default           | Notes                  |
| ------------------------- | ------------- | -------- | ----------------- | ---------------------- |
| `id`                      | uuid          | NO       | gen_random_uuid() | Primary key            |
| `user_id`                 | uuid          | NO       | -                 | FK to auth.users(id)   |
| `provider`                | varchar(100)  | NO       | -                 | Logistics provider     |
| `service_type`            | varchar(100)  | NO       | -                 | Service level          |
| `price`                   | decimal(10,2) | NO       | -                 | Quote price            |
| `estimated_delivery_days` | integer       | YES      | -                 | Delivery estimate      |
| `pickup_address`          | jsonb         | NO       | -                 | Pickup details         |
| `delivery_address`        | jsonb         | NO       | -                 | Delivery details       |
| `package_details`         | jsonb         | NO       | -                 | Package specifications |
| `expires_at`              | timestamptz   | YES      | now() + 24h       | Quote expiration       |
| `created_at`              | timestamptz   | YES      | now()             | Creation timestamp     |

---

## 🛒 Commerce Tables

### 10. **carts**

**Purpose**: Shopping cart management  
**Relationship**: One-to-many with `cart_items`

| Column       | Type        | Nullable | Default           | Notes                |
| ------------ | ----------- | -------- | ----------------- | -------------------- |
| `id`         | uuid        | NO       | gen_random_uuid() | Primary key          |
| `user_id`    | uuid        | NO       | -                 | FK to auth.users(id) |
| `status`     | varchar(50) | YES      | 'active'          | Cart status          |
| `created_at` | timestamptz | YES      | now()             | Creation timestamp   |
| `updated_at` | timestamptz | YES      | now()             | Last update          |

---

### 11. **cart_items**

**Purpose**: Individual items in shopping carts  
**Relationship**: Many-to-one with `carts` and `artworks`

| Column       | Type          | Nullable | Default           | Notes                |
| ------------ | ------------- | -------- | ----------------- | -------------------- |
| `id`         | uuid          | NO       | gen_random_uuid() | Primary key          |
| `cart_id`    | uuid          | NO       | -                 | FK to carts(id)      |
| `artwork_id` | uuid          | NO       | -                 | FK to artworks(id)   |
| `quantity`   | integer       | YES      | 1                 | Item quantity        |
| `unit_price` | decimal(10,2) | YES      | -                 | Price at time of add |
| `created_at` | timestamptz   | YES      | now()             | Creation timestamp   |
| `updated_at` | timestamptz   | YES      | now()             | Last update          |

---

## 👥 Social Tables

### 12. **follows**

**Purpose**: Creator following relationships  
**Relationship**: Many-to-many between users

| Column         | Type        | Nullable | Default           | Notes                   |
| -------------- | ----------- | -------- | ----------------- | ----------------------- |
| `id`           | uuid        | NO       | gen_random_uuid() | Primary key             |
| `follower_id`  | uuid        | NO       | -                 | FK to auth.users(id)    |
| `following_id` | uuid        | NO       | -                 | FK to user_profiles(id) |
| `created_at`   | timestamptz | YES      | now()             | Follow timestamp        |

**Unique Constraint**: `(follower_id, following_id)`

---

### 13. **reviews**

**Purpose**: Creator and artwork reviews  
**Relationship**: Links reviewers to creators

| Column        | Type        | Nullable | Default           | Notes                   |
| ------------- | ----------- | -------- | ----------------- | ----------------------- |
| `id`          | uuid        | NO       | gen_random_uuid() | Primary key             |
| `reviewer_id` | uuid        | NO       | -                 | FK to auth.users(id)    |
| `creator_id`  | uuid        | NO       | -                 | FK to user_profiles(id) |
| `order_id`    | uuid        | YES      | -                 | FK to orders(id)        |
| `rating`      | integer     | YES      | -                 | 1-5 star rating         |
| `comment`     | text        | YES      | -                 | Review text             |
| `is_verified` | boolean     | YES      | false             | Verified purchase       |
| `created_at`  | timestamptz | YES      | now()             | Review timestamp        |
| `updated_at`  | timestamptz | YES      | now()             | Last update             |

**Constraint**: `rating >= 1 AND rating <= 5`

---

### 14. **wishlists**

**Purpose**: User saved items for later  
**Relationship**: Many-to-many between users and artworks

| Column       | Type        | Nullable | Default           | Notes                |
| ------------ | ----------- | -------- | ----------------- | -------------------- |
| `id`         | uuid        | NO       | gen_random_uuid() | Primary key          |
| `user_id`    | uuid        | NO       | -                 | FK to auth.users(id) |
| `artwork_id` | uuid        | NO       | -                 | FK to artworks(id)   |
| `created_at` | timestamptz | YES      | now()             | Addition timestamp   |

**Unique Constraint**: `(user_id, artwork_id)`

---

### 15. **auth_audit_log**

**Purpose**: Authentication event logging  
**System Table**: Managed by Supabase

---

## 🔐 Authentication & Security

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

#### **Public Read Policies** (Homepage Access)

```sql
-- Allow public reading for homepage content
CREATE POLICY "Allow public read user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read artworks" ON artworks FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public read blog_posts" ON blog_posts FOR SELECT USING (true);
```

#### **User-Specific Policies**

- **Orders**: Users can view their own orders as buyer or seller
- **Shipments**: Users can view shipments for their orders
- **Carts**: Users can manage their own carts
- **Shipping Addresses**: Users can manage their own addresses
- **Wishlists**: Users can manage their own wishlists
- **Follows**: Users can manage their own follows

### Authentication Flow

1. **Supabase Auth** handles user registration/login
2. **Automatic Profile Creation** via trigger on `auth.users` insert
3. **Role Assignment** during profile creation or update
4. **RLS Enforcement** on all data access

---

## 📊 Sample Data

### Current Data Status (Production Ready)

```sql
-- Verification Query Results
Featured Creators Count:    2
Featured Artworks Count:    3
Published Events Count:     3
Published Blog Posts Count: 3
```

### Sample Blog Posts

- "Behind 'Sunlit Market'" (`behind-sunlit-market`)
- "Why Mixed Media Matters" (`why-mixed-media-matters`)
- "Documenting Urban Rhythm" (`documenting-urban-rhythm`)

### Data Relationships

- **2 Users** with creator role, featured and verified
- **3 Artworks** available and featured for homepage
- **3 Events** published and featured for homepage
- **3 Blog Posts** published for homepage content

---

## 🔌 API Integration

### Logistics Providers

The platform supports multiple Nigerian logistics providers:

1. **Sendbox** - Primary recommendation

   - API Base: `https://api.sendbox.co/shipping`
   - Features: Multi-courier, real-time tracking
   - Environment: `SENDBOX_API_KEY`

2. **GIG Logistics** - Premium service

   - API Base: `https://api.giglogistics.com/v1`
   - Features: Fragile item handling, insurance
   - Environment: `GIG_API_KEY`

3. **Kwik Delivery** - Same-day delivery
   - API Base: `https://kwik.delivery/api`
   - Features: Fast delivery in major cities
   - Environment: `KWIK_API_KEY`

### Payment Integration

- **Paystack** integration ready
- Environment: `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- Order flow: Cart → Payment → Order → Shipment → Tracking

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. **Homepage Errors**

**Problem**: `Error fetching featured creators/artworks`
**Solution**: Ensure RLS policies allow public read access

```sql
-- Check and fix RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read user_profiles" ON user_profiles FOR SELECT USING (true);
```

#### 2. **Generated Column Errors**

**Problem**: `cannot insert into generated column "start_date"`
**Solution**: Never insert into `events.start_date` - it's auto-generated from `event_date`

```sql
-- Correct: Only insert event_date
INSERT INTO events (title, event_type, event_date) VALUES (...);
-- Wrong: Don't insert start_date
INSERT INTO events (title, event_type, event_date, start_date) VALUES (...);
```

#### 3. **Missing Featured Content**

**Problem**: Homepage sections showing "No data available"
**Solution**: Update existing data to be featured

```sql
-- Make content featured for homepage
UPDATE user_profiles SET is_featured = true WHERE role = 'creator';
UPDATE artworks SET is_featured = true, is_available = true;
UPDATE events SET is_featured = true, is_published = true;
```

#### 4. **Logistics API Errors**

**Problem**: Shipping quotes failing
**Solution**: Check API keys and provider availability

```bash
# Verify environment variables
echo $SENDBOX_API_KEY
echo $GIG_API_KEY
echo $KWIK_API_KEY
```

### Database Maintenance

#### **Regular Cleanup**

```sql
-- Clean expired shipping quotes
DELETE FROM shipping_quotes WHERE expires_at < NOW();

-- Archive completed orders older than 1 year
UPDATE orders SET status = 'archived'
WHERE status = 'completed' AND created_at < NOW() - INTERVAL '1 year';
```

#### **Performance Monitoring**

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

---

## 📝 Migration History

### Applied Migrations

1. `20250918_fix_signup_trigger.sql` - User profile creation
2. `20250918234500_fix_signup_trigger.sql` - Signup trigger fixes
3. `20250918234700_cleanup_auth_user_triggers.sql` - Auth cleanup
4. `20250929_add_shipping_tables.sql` - Logistics tables
5. `20250929_create_core_tables.sql` - Core platform tables
6. `20250929_insert_sample_data.sql` - Sample data
7. `perfect_fix.sql` - Final homepage fixes

### Schema Version

**Current Version**: v1.0 (Production Ready)  
**Last Schema Update**: September 29, 2025  
**Next Planned Updates**:

- Payment processing enhancements
- Advanced search functionality
- Analytics tables

---

## 🎯 Summary

The Loge Arts database is a comprehensive, production-ready schema supporting:

✅ **Full Marketplace Functionality**  
✅ **Complete Logistics Integration**  
✅ **Secure Authentication & Authorization**  
✅ **Scalable Architecture**  
✅ **Nigerian Market Optimization**

**Total Tables**: 15  
**Total Relationships**: 20+  
**Security**: RLS enabled on all tables  
**Performance**: Indexed for optimal queries  
**Status**: Ready for production deployment

---

_This document serves as the definitive reference for the Loge Arts database schema. Keep it updated as the platform evolves._
