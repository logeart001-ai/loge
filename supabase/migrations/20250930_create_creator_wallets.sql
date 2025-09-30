-- Creator wallet schema for Loge Arts platform
-- Tracks creator earnings, commissions, refunds, and payouts

-- 1) Enumerated types -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_type') THEN
    CREATE TYPE wallet_transaction_type AS ENUM (
      'sale',           -- positive earnings credited after commission
      'refund',         -- reversal of previous earnings
      'payout',         -- funds sent to creator outside the platform
      'adjustment'      -- manual corrections / commission tweaks
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_status') THEN
    CREATE TYPE wallet_transaction_status AS ENUM (
      'pending',        -- awaiting confirmation (e.g. pending payout)
      'processing',     -- in progress with payment processor
      'completed',      -- finalized, affects available balance
      'failed',         -- failed transaction, ignored for balances
      'reversed'        -- transaction reversed after completion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_payout_status') THEN
    CREATE TYPE wallet_payout_status AS ENUM (
      'pending',        -- requested and awaiting review
      'in_review',      -- under manual verification
      'scheduled',      -- approved and queued for transfer
      'completed',      -- paid out successfully
      'rejected'        -- denied with reason recorded
    );
  END IF;
END $$;

-- 2) Core wallet tables -----------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_wallets (
  creator_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  lifetime_gross_sales NUMERIC(14,2) NOT NULL DEFAULT 0,
  lifetime_commission NUMERIC(14,2) NOT NULL DEFAULT 0,
  lifetime_refunds NUMERIC(14,2) NOT NULL DEFAULT 0,
  lifetime_payouts NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id UUID,
  transaction_type wallet_transaction_type NOT NULL,
  status wallet_transaction_status NOT NULL DEFAULT 'completed',
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  wallet_delta NUMERIC(12,2) NOT NULL DEFAULT 0, -- signed value applied to wallet
  platform_reference TEXT,                        -- paystack/reference identifiers
  description TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT wallet_transactions_positive_gross CHECK (gross_amount >= 0),
  CONSTRAINT wallet_transactions_commission_nonneg CHECK (commission_amount >= 0)
);

-- Foreign key for order_item_id is optional because some deployments aggregate per order.
-- Add the constraint if/when an order_items table exists.

CREATE TABLE IF NOT EXISTS wallet_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status wallet_payout_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  paystack_transfer_reference TEXT,
  paystack_transfer_id TEXT,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_payout_accounts (
  creator_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_name TEXT,
  account_number TEXT,
  bank_name TEXT,
  bank_code TEXT,
  paystack_recipient_code TEXT,
  paystack_recipient_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Helpful indexes -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_creator_id
  ON wallet_transactions (creator_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id
  ON wallet_transactions (order_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status
  ON wallet_transactions (status);

CREATE INDEX IF NOT EXISTS idx_wallet_payouts_creator_id
  ON wallet_payouts (creator_id, status);

-- 4) Row level security ----------------------------------------------------
ALTER TABLE creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payout_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'creator_wallets' AND policyname = 'Creators can view own wallet'
  ) THEN
    CREATE POLICY "Creators can view own wallet" ON creator_wallets
      FOR SELECT USING (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallet_transactions' AND policyname = 'Creators can view wallet transactions'
  ) THEN
    CREATE POLICY "Creators can view wallet transactions" ON wallet_transactions
      FOR SELECT USING (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallet_payouts' AND policyname = 'Creators can view their payouts'
  ) THEN
    CREATE POLICY "Creators can view their payouts" ON wallet_payouts
      FOR SELECT USING (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'creator_payout_accounts' AND policyname = 'Creators manage their payout account'
  ) THEN
    CREATE POLICY "Creators manage their payout account" ON creator_payout_accounts
      FOR ALL USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
  END IF;
END $$;

-- 5) Aggregation helpers ---------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_creator_wallet_balance(p_creator UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_available NUMERIC(12,2);
  v_pending NUMERIC(12,2);
  v_sales NUMERIC(14,2);
  v_refunds NUMERIC(14,2);
  v_commission_sales NUMERIC(14,2);
  v_commission_refunds NUMERIC(14,2);
  v_payouts NUMERIC(14,2);
  v_last_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status = 'completed' THEN wallet_delta ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN wallet_delta ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN gross_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN gross_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN commission_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN commission_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'payout' THEN ABS(wallet_delta) ELSE 0 END), 0),
    MAX(occurred_at)
  INTO
    v_available,
    v_pending,
    v_sales,
    v_refunds,
    v_commission_sales,
    v_commission_refunds,
    v_payouts,
    v_last_at
  FROM wallet_transactions
  WHERE creator_id = p_creator;

  INSERT INTO creator_wallets (
    creator_id,
    available_balance,
    pending_balance,
    lifetime_gross_sales,
    lifetime_commission,
    lifetime_refunds,
    lifetime_payouts,
    last_transaction_at,
    created_at,
    updated_at
  )
  VALUES (
    p_creator,
    v_available,
    v_pending,
    v_sales - v_refunds,
    v_commission_sales - v_commission_refunds,
    v_refunds,
    v_payouts,
    v_last_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (creator_id)
  DO UPDATE SET
    available_balance = EXCLUDED.available_balance,
    pending_balance = EXCLUDED.pending_balance,
    lifetime_gross_sales = EXCLUDED.lifetime_gross_sales,
    lifetime_commission = EXCLUDED.lifetime_commission,
    lifetime_refunds = EXCLUDED.lifetime_refunds,
    lifetime_payouts = EXCLUDED.lifetime_payouts,
    last_transaction_at = EXCLUDED.last_transaction_at,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION sync_wallet_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_creator UUID;
BEGIN
  v_creator := COALESCE(NEW.creator_id, OLD.creator_id);
  PERFORM refresh_creator_wallet_balance(v_creator);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_transactions_sync ON wallet_transactions;
CREATE TRIGGER trg_wallet_transactions_sync
AFTER INSERT OR UPDATE OR DELETE ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_wallet_on_transaction();

-- Ensure existing creators have wallet rows ready for use
INSERT INTO creator_wallets (creator_id)
SELECT id FROM user_profiles
WHERE role = 'creator'
ON CONFLICT (creator_id) DO NOTHING;
