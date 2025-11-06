# Loge Database Overview (2025-11-03)

**Environment**: Supabase PostgreSQL — `public` schema  
**Source**: `scripts/database-inspection.sql` execution on 2025-11-03  
**Scope**: All application-managed tables, policies, functions, and operational signals surfaced by the inspection script output supplied by the user.

---

## Schema Snapshot

- **Tables**: 40 base tables detected in `public`.
- **Primary keys**: 40/40 tables expose explicit primary keys (either on `id` or domain identifiers such as `creator_id`).
- **Foreign keys**: 18 declared relationships linking marketplace, content, and submission domains.
- **Unique constraints**: 17 constraints covering slugs, composite natural keys, and reference identifiers (with some duplication on `cart_items`).
- **Enumerated types**: 13 enums modelling roles, workflow states, and categorisations (see [Enumerated Types](#enumerated-types)).
- **Row Level Security**: RLS enabled on every surfaced table; policies skew towards owner-scoped reads/writes with permissive mode.
- **Triggers**: 10 active triggers, primarily for timestamp maintenance and wallet/order synchronisation.
- **User-defined functions**: 17 functions (12 discrete helpers + 5 trigger handlers) backing notifications, wallet accounting, onboarding, and messaging.

---

## Domain Breakdown

### Identity & Account Infrastructure

| Table | Purpose & Highlights |
| --- | --- |
| `user_profiles` | Extended auth profile: `email`, `full_name`, creator metadata, verification flags, timestamps defaulting to `now()`. RLS restricts CRUD to the profile owner while allowing public read of surfaced fields. |
| `notification_preferences` | Stores per-user notification toggles (`id` primary key). Policies enforce owner-only access. |
| `creator_onboarding` | Tracks onboarding state (`creator_id` PK/ FK) with creator-managed policies. |
| `creator_wallets` | One-to-one wallet ledgers by `creator_id`; viewable only by the owning creator. |
| `creator_payout_accounts` / `creator_payouts` / `wallet_payouts` | Capture payout destinations and disbursements. `creator_payout_accounts` uses `creator_id` as PK; payouts reference `orders` and adopt creator-scoped visibility. |
| `wallet_transactions` | Ledger entries with status/type enums, user ownership policies, and the largest index footprint after `notifications`. |
| `auth_audit_log` | Autonomous Supabase audit trail (bigint PK, payload JSONB). |

### Content, Discovery & Engagement

| Table | Purpose & Highlights |
| --- | --- |
| `artworks` | Core listings with category enums, array-backed media (`image_urls`, `tags`), availability flags, and creator foreign key. |
| `artwork_views` | Immutable view log keyed by UUID, capturing IP, user agent, referrer with `viewed_at` defaulting to `now()`. |
| `events` | Rich event model (`event_type` enum) with pricing flags, scheduling columns (`start_date`, `end_date`, `event_date`), organizer FK optionality, and organiser-scoped policies. |
| `blog_posts` & `blog_comments` | Publishing pipeline with slug uniqueness, approval flows, nested comments via self-referencing FK (`parent_id`). |
| `comments` | Generic polymorphic comment stream (`commentable_type/id`). |
| `content_interactions` & `content_reports` | Track likes/saves/flags with enums for `content_type`, `interaction_type`, and `report_reason/status`. RLS ties report visibility to the reporter. |
| `saved_articles`, `wishlists`, `reviews`, `follows` | Standard engagement artefacts guarded by composite unique constraints and ownership policies. |
| `notifications` & `email_logs` | User messaging queues with self-managed read/update policies and system insert support. Notifications table is currently the largest by total index size (200 kB total / 184 kB index). |

### Commerce, Orders & Logistics

| Table | Purpose & Highlights |
| --- | --- |
| `carts` & `cart_items` | Buyer carts with `cart_status` enum. Composite uniqueness on (`cart_id`, `artwork_id`) enforced by two constraints (`cart_items_cart_id_artwork_id_key`, `uq_cart_items_cart_artwork`). |
| `orders` & `order_items` | Core transactional records linking buyers/sellers with wallet and payout triggers (`handle_order_wallet_credit`). Unique `order_number`; dual select policies for buyers and sellers. |
| `shipments`, `shipping_addresses`, `shipping_quotes`, `tracking_events` | Fulfilment pipeline capturing addresses, quotes, shipment lifecycle, and tracking feed with buyer-scoped policies. |
| `messages` & `conversations` | Order and conversation messaging with friend-like uniqueness constraint on `participant_1_id` + `participant_2_id`. Trigger `update_conversation_on_message` maintains conversation recency. |
| `creator_analytics` | Placeholder analytics roll-up keyed by UUID (no rows reported). |

### Submission Pipeline & Moderation

| Table | Purpose & Highlights |
| --- | --- |
| `project_submissions` | Root submission entity for creators; RLS grants full control to the owner and public select for `status = 'published'`. |
| `artist_submissions`, `fashion_submissions`, `writer_submissions` | Domain-specific metadata tables keyed by UUID with FK into `project_submissions`. |
| `submission_media` | Attachment metadata tied to submissions with 6 current rows. |
| `submission_reviews` | Reviewer feedback linked to submissions (9 rows). |
| `content_reports` | Crowd-sourced moderation queue with enums for type/reason/status and moderator notes. |

### Ancillary Tables

- `creator_analytics`: reserved analytics snapshot (empty, 8 kB index-only footprint).
- `creator_wallets`, `wallet_payouts`, `wallet_transactions`: wallet accounting ecosystem (see [Identity & Account Infrastructure](#identity--account-infrastructure)).
- `tracking_events`: logistic history feed (index-only footprint).

---

## Referential Relationships

18 foreign keys enforce critical joins:

| Relationship | Description |
| --- | --- |
| `artworks.creator_id → user_profiles.id` | Connects listings to creators. |
| `artworks.submission_id → project_submissions.id` | Links live listings back to submission pipeline. |
| `blog_posts.author_id → user_profiles.id` | Binds content authorship. |
| `blog_comments.parent_id → blog_comments.id` / `comments.parent_id → comments.id` | Support threaded conversations. |
| `cart_items.cart_id → carts.id` / `cart_items.artwork_id → artworks.id` | Maintain cart integrity. |
| `events.organizer_id → user_profiles.id` | Optional organiser association. |
| `creator_payouts.order_id → orders.id` | Attaches payouts to specific purchases. |
| `messages.conversation_id → conversations.id` and `messages.order_id → orders.id` | Tie messaging to conversations and commerce events. |
| `order_items.order_id → orders.id` | Ensure line items map to parent order. |
| `shipments.order_id → orders.id` / `tracking_events.shipment_id → shipments.id` | Enforce fulfilment chaining. |
| `submission_*.*_submission_id → project_submissions.id` (artist, fashion, writer, media, reviews) | Guarantee vertical metadata traces back to the root submission record. |

No foreign key currently references `books`, matching the absence of that table.

---

## Primary & Unique Keys

- Every table defines a primary key; `creator_payout_accounts` and `creator_wallets` deliberately employ `creator_id` as their PK for one-to-one semantics.
- Unique constraints reinforce business rules:
  - `blog_posts.slug`, `orders.order_number`, `shipments.tracking_number`, `wallet_transactions.reference`.
  - Composite uniqueness: `conversations_unique_participants`, `follows_follower_id_following_id_key`, `saved_articles_user_id_article_id_key`, `wishlists_user_id_artwork_id_key`.
  - `cart_items` duplicates composite uniqueness via two differently named constraints—consider pruning `uq_cart_items_cart_artwork` to avoid redundancy.

---

## Enumerated Types

| Enum | Values |
| --- | --- |
| `account_status` | `active`, `suspended`, `banned` |
| `artwork_category` | `art_design`, `painting`, `sculpture`, `book`, `fashion` |
| `cart_status` | `active`, `converted`, `abandoned` |
| `content_type` | `artwork`, `comment`, `review`, `message` |
| `creator_status` | `pending`, `approved`, `rejected`, `suspended` |
| `event_type` | `virtual`, `physical`, `hybrid`, `exhibition`, `workshop`, `gallery_opening`, `art_fair`, `networking` |
| `report_reason` | `spam`, `inappropriate`, `harassment`, `copyright`, `violence`, `hate_speech`, `misinformation`, `other` |
| `report_status` | `pending`, `reviewed`, `resolved`, `dismissed` |
| `user_role` | `buyer`, `creator`, `admin` |
| `wallet_payout_status` | `pending`, `in_review`, `scheduled`, `completed`, `rejected` |
| `wallet_transaction_status` | `pending`, `processing`, `completed`, `failed`, `reversed` |
| `wallet_transaction_type` | `sale`, `refund`, `payout`, `adjustment` |

These enums underpin RLS predicates and UI filters; ensure Supabase client mappings stay synchronised when values evolve.

---

## Row-Level Security Overview

All surfaced tables report `rowsecurity = true`. Policy inventory highlights:

- **Owner-Scoped CRUD**: `carts`, `cart_items`, `shipping_addresses`, `shipping_quotes`, `notifications`, `messages`, and wallet tables rely on `auth.uid()` comparisons for direct ownership enforcement.
- **Creator-Controlled Submissions**: `project_submissions`, `artist_submissions`, `fashion_submissions`, `writer_submissions`, `submission_media`, and `submission_reviews` share a consistent join-back policy via `project_submissions.creator_id = auth.uid()`.
- **Public Read, Conditional Write**: `blog_posts`, `events`, `artworks`, `reviews`, and `follows` permit public SELECT (often restricted by status flags) while retaining authenticated-only mutations.
- **Authenticated Inserts with With-Check**: Many INSERT policies (e.g., `notifications`, `order_items`, `content_reports`) use `WITH CHECK` clauses to ensure the inserting user is the owner of the row being created.
- **Redundancies**: Several tables (notably `carts` and `cart_items`) include both verb-specific policies and aggregate "modify/select own" policies; consolidate where possible to simplify administration.

No restrictive (DENY) policies observed; every policy is `PERMISSIVE`, so overlapping definitions combine via OR logic.

---

## Triggers & Functions

### Triggers

| Trigger | Table | Event | Function | Intent |
| --- | --- | --- | --- | --- |
| `update_blog_comments_updated_at` | `blog_comments` | BEFORE UPDATE | `update_updated_at_column()` | Maintain timestamp freshness. |
| `content_reports_updated_at` | `content_reports` | BEFORE UPDATE | `update_content_reports_updated_at()` | Dedicated update timestamp management. |
| `trigger_update_conversation_on_message` | `messages` | AFTER INSERT | `update_conversation_on_message()` | Sync conversation metadata when messages arrive. |
| `update_notifications_updated_at` | `notifications` | BEFORE UPDATE | `update_updated_at_column()` | Timestamp maintenance. |
| `trg_orders_wallet_credit` | `orders` | AFTER INSERT/UPDATE | `handle_order_wallet_credit()` | Synchronise wallet credits after order changes. |
| `update_orders_updated_at` | `orders` | BEFORE UPDATE | `update_updated_at_column()` | Timestamp maintenance. |
| `update_project_submissions_updated_at` | `project_submissions` | BEFORE UPDATE | `update_updated_at_column()` | Timestamp maintenance. |
| `update_shipments_updated_at` | `shipments` | BEFORE UPDATE | `update_updated_at_column()` | Timestamp maintenance. |
| `update_shipping_addresses_updated_at` | `shipping_addresses` | BEFORE UPDATE | `update_updated_at_column()` | Timestamp maintenance. |
| `create_creator_onboarding` (trigger function) | (not listed in trigger table) | — | — | Ensure presence of onboarding data on new creators (function exists; corresponding trigger likely defined elsewhere). |

### User-Defined Functions & Procedures

| Function | Type | Summary |
| --- | --- | --- |
| `create_notification` | function | Inserts notification row with optional payload, returns UUID. |
| `create_wallet_transaction` & `create_wallet_sale_transaction` | function | Record manual or order-driven wallet entries. |
| `get_creator_orders` | function returning table | Convenience view for creator order history. |
| `get_or_create_conversation` | function | Ensures canonical conversation between two participants. |
| `get_wallet_balance` | function | Aggregates wallet transactions for balance display. |
| `handle_new_user`, `update_onboarding_progress`, `sync_wallet_on_transaction` | trigger functions | Automation hooks for onboarding and wallet consistency. |
| `mark_all_notifications_read`, `mark_notification_read`, `mark_messages_as_read` | function | Bulk/batched state transitions. |
| Various `update_*` trigger helpers | trigger | Standardised `updated_at` stamping. |

These functions underpin application logic; maintain parity with Supabase RPC clients where exposed.

---

## Storage & Volume Signals

- **Largest tables by total footprint**: `notifications` (200 kB), `wallet_transactions` (128 kB), `blog_posts` / `orders` / `project_submissions` (112 kB each), `cart_items` (104 kB), `artworks` & `events` (96 kB).
- **Index-heavy tables**: `notifications` and `wallet_transactions` exhibit index size significantly exceeding heap size, indicating reliance on indexed lookups.
- **Primarily index-only footprint**: `messages`, `conversations`, `content_reports`, `shipments`, `email_logs`, `comments`, `saved_articles`, `tracking_events`, `shipping_addresses`, and several submission tables currently have zero-byte heaps (no data yet) but pre-created indexes.

---

## Data Snapshot

| Table | Status | Approximate Rows |
| --- | --- | --- |
| `orders` | EXISTS | 12 |
| `carts` | EXISTS | 6 |
| `artworks` | EXISTS | 6 |
| `submission_media` | EXISTS | 6 |
| `events` | EXISTS | 4 |
| `blog_posts` | EXISTS | 4 |
| `user_profiles` | EXISTS | 4 |
| `submission_reviews` | EXISTS | 9 |
| `project_submissions` | EXISTS | 2 |
| `writer_submissions` | EXISTS | 2 |
| `artist_submissions`, `fashion_submissions`, `cart_items`, `content_reports`, `order_items` | EXISTS | 0 |
| `books` | **MISSING** | 0 |

> **Note**: `books` table referenced in application code is absent; plan remediation before enabling book listings.

---

## Operational Observations & Recommendations

1. **Normalize RLS policies**: Consolidate redundant `ALL` + verb-specific policies (notably on cart tables) to ease future audits.
2. **Books table gap**: Create and seed the `books` table (and related foreign keys) or adjust frontend fallbacks to avoid runtime errors.
3. **Index hygiene**: Validate necessity of large composite indexes on `notifications` and `wallet_transactions` as data grows; consider partial indexes for unread notifications.
4. **Constraint duplication**: Remove redundant `uq_cart_items_cart_artwork` constraint after confirming no dependency in Supabase migrations.
5. **Trigger coverage audit**: Ensure functions such as `create_creator_onboarding` are attached to their intended tables—no trigger record surfaced in the inspection output.

---

## Change Log

- **2025-11-03**: Initial compilation from inspection output delivered by the user. Future updates should regenerate the inspection script to keep this document current.
