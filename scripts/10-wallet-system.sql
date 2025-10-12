-- Wallet System Setup
-- Creates wallet_transactions table, balance view, and related functions

-- Drop existing objects if they exist
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP VIEW IF EXISTS wallet_balances CASCADE;
DROP FUNCTION IF EXISTS get_wallet_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_wallet_transaction(UUID, DECIMAL, TEXT, TEXT, TEXT) CASCADE;

-- Create wallet_transactions table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'withdrawal', 'refund')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Create wallet_balances view
CREATE OR REPLACE VIEW wallet_balances AS
SELECT 
  user_id,
  COALESCE(
    SUM(
      CASE 
        WHEN transaction_type IN ('credit', 'refund') AND status = 'completed' THEN amount
        WHEN transaction_type IN ('debit', 'withdrawal') AND status = 'completed' THEN -amount
        ELSE 0
      END
    ), 
    0
  ) as balance,
  COUNT(*) FILTER (WHERE status = 'completed') as total_transactions,
  SUM(amount) FILTER (WHERE transaction_type IN ('credit', 'refund') AND status = 'completed') as total_credits,
  SUM(amount) FILTER (WHERE transaction_type IN ('debit', 'withdrawal') AND status = 'completed') as total_debits,
  MAX(created_at) FILTER (WHERE status = 'completed') as last_transaction_date
FROM wallet_transactions
GROUP BY user_id;

-- Function to get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(10, 2);
BEGIN
  SELECT balance INTO v_balance
  FROM wallet_balances
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$;

-- Function to create wallet transaction
CREATE OR REPLACE FUNCTION create_wallet_transaction(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance DECIMAL(10, 2);
BEGIN
  -- Get current balance
  v_current_balance := get_wallet_balance(p_user_id);
  
  -- For debits/withdrawals, ensure sufficient balance
  IF p_type IN ('debit', 'withdrawal') THEN
    IF v_current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance. Current balance: %, Required: %', v_current_balance, p_amount;
    END IF;
  END IF;
  
  -- Insert transaction
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference,
    status
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_description,
    p_reference,
    'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- RLS Policies
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own wallet transactions"
  ON wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions (for withdrawals/manual entries)
CREATE POLICY "Users can create their own transactions"
  ON wallet_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON wallet_transactions TO authenticated;
GRANT INSERT ON wallet_transactions TO authenticated;
GRANT SELECT ON wallet_balances TO authenticated;
GRANT EXECUTE ON FUNCTION get_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_wallet_transaction(UUID, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON TABLE wallet_transactions IS 'Stores all wallet transactions for creators including credits from sales and debits from withdrawals';
COMMENT ON VIEW wallet_balances IS 'Real-time view of wallet balances per user';
COMMENT ON FUNCTION get_wallet_balance(UUID) IS 'Returns the current wallet balance for a user';
COMMENT ON FUNCTION create_wallet_transaction IS 'Creates a new wallet transaction with balance validation';
