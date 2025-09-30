-- Creator wallet earnings accrual logic
-- Automatically credits creator wallets when orders are paid

-- 1) Helper to ensure wallet transactions are created exactly once per order
CREATE OR REPLACE FUNCTION create_wallet_sale_transaction(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_existing UUID;
  v_quantity INTEGER;
  v_gross NUMERIC(12,2);
  v_commission NUMERIC(12,2);
  v_wallet_delta NUMERIC(12,2);
  v_shipping NUMERIC(12,2);
BEGIN
  SELECT
    o.id,
    o.seller_id,
    o.buyer_id,
    COALESCE(o.quantity, 1) AS quantity,
    COALESCE(o.unit_price, 0) AS unit_price,
    COALESCE(o.total_amount, 0) AS total_amount,
    COALESCE(o.shipping_cost, 0) AS shipping_cost,
    o.payment_reference,
    o.item_type,
    o.created_at,
    o.updated_at
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Order % not found for wallet transaction', p_order_id;
    RETURN;
  END IF;

  IF v_order.seller_id IS NULL THEN
    RAISE NOTICE 'Order % missing seller id, skipping wallet transaction', p_order_id;
    RETURN;
  END IF;

  SELECT wt.id
  INTO v_existing
  FROM wallet_transactions wt
  WHERE wt.order_id = v_order.id
    AND wt.transaction_type = 'sale'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    -- Wallet transaction already exists, nothing else to do
    RETURN;
  END IF;

  v_quantity := GREATEST(COALESCE(v_order.quantity, 1), 1);
  v_gross := ROUND(COALESCE(v_order.unit_price, 0) * v_quantity, 2);

  IF v_gross <= 0 THEN
    RAISE NOTICE 'Order % has non-positive gross amount %, skipping wallet transaction', p_order_id, v_gross;
    RETURN;
  END IF;

  v_shipping := COALESCE(v_order.shipping_cost, 0);
  v_commission := ROUND(v_gross * 0.15, 2);
  v_wallet_delta := ROUND(v_gross - v_commission, 2);

  INSERT INTO wallet_transactions (
    creator_id,
    order_id,
    transaction_type,
    status,
    gross_amount,
    commission_amount,
    wallet_delta,
    platform_reference,
    description,
    metadata,
    occurred_at
  ) VALUES (
    v_order.seller_id,
    v_order.id,
    'sale',
    'completed',
    v_gross,
    v_commission,
    v_wallet_delta,
    v_order.payment_reference,
    CONCAT('Order ', LEFT(v_order.id::text, 8)),
    jsonb_build_object(
      'source', 'order',
      'commission_rate', 0.15,
      'quantity', v_quantity,
      'shipping_cost', v_shipping,
      'total_amount', v_order.total_amount,
      'buyer_id', v_order.buyer_id,
      'item_type', v_order.item_type
    ),
    COALESCE(v_order.updated_at, v_order.created_at, NOW())
  );
END;
$$;

COMMENT ON FUNCTION create_wallet_sale_transaction(UUID) IS 'Creates a single wallet sale transaction for an order if it does not already exist.';

-- 1b) Helper to insert refund reversal when orders are cancelled/refunded
CREATE OR REPLACE FUNCTION create_wallet_refund_transaction(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale wallet_transactions%ROWTYPE;
  v_existing UUID;
  v_order RECORD;
  v_quantity INTEGER;
  v_gross NUMERIC(12,2);
  v_commission NUMERIC(12,2);
  v_wallet_delta NUMERIC(12,2);
BEGIN
  -- Ensure a positive sale exists first
  SELECT *
  INTO v_sale
  FROM wallet_transactions
  WHERE order_id = p_order_id
    AND transaction_type = 'sale'
  ORDER BY occurred_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Without a recorded sale we cannot safely reverse; skip.
    RAISE NOTICE 'No sale transaction found for order %, skipping refund entry', p_order_id;
    RETURN;
  END IF;

  -- Skip if a refund entry already exists
  SELECT id
  INTO v_existing
  FROM wallet_transactions
  WHERE order_id = p_order_id
    AND transaction_type = 'refund'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN;
  END IF;

  -- Fetch order snapshot for enrichment and fallbacks
  SELECT
    o.quantity,
    COALESCE(o.unit_price, 0) AS unit_price,
    COALESCE(o.total_amount, 0) AS total_amount,
    COALESCE(o.shipping_cost, 0) AS shipping_cost,
    o.payment_reference,
    o.item_type,
    o.status,
    o.payment_status,
    o.updated_at,
    o.created_at,
    o.seller_id,
    o.buyer_id
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id;

  v_quantity := GREATEST(COALESCE(v_order.quantity, 1), 1);
  v_gross := COALESCE(v_sale.gross_amount, ROUND(COALESCE(v_order.unit_price, 0) * v_quantity, 2));
  v_commission := COALESCE(v_sale.commission_amount, ROUND(v_gross * 0.15, 2));
  v_wallet_delta := COALESCE(-1 * v_sale.wallet_delta, -1 * ROUND(v_gross - v_commission, 2));

  INSERT INTO wallet_transactions (
    creator_id,
    order_id,
    transaction_type,
    status,
    gross_amount,
    commission_amount,
    wallet_delta,
    platform_reference,
    description,
    metadata,
    occurred_at
  ) VALUES (
    COALESCE(v_sale.creator_id, v_order.seller_id),
    p_order_id,
    'refund',
    'completed',
    ABS(v_gross),
    ABS(v_commission),
    v_wallet_delta,
    v_order.payment_reference,
    CONCAT('Refund ', LEFT(p_order_id::text, 8)),
    jsonb_build_object(
      'source', 'order_refund',
      'sale_transaction_id', v_sale.id,
      'quantity', v_quantity,
      'shipping_cost', COALESCE(v_order.shipping_cost, 0),
      'total_amount', v_order.total_amount,
      'buyer_id', v_order.buyer_id,
      'item_type', v_order.item_type,
      'order_status', v_order.status,
      'payment_status', v_order.payment_status
    ),
    COALESCE(v_order.updated_at, v_order.created_at, NOW())
  );
END;
$$;

COMMENT ON FUNCTION create_wallet_refund_transaction(UUID) IS 'Creates a wallet refund entry that reverses a prior sale for the order.';

-- 2) Trigger to invoke helper when orders are paid/confirmed
CREATE OR REPLACE FUNCTION handle_order_wallet_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_completed BOOLEAN := (NEW.payment_status IS NOT NULL AND NEW.payment_status ILIKE 'completed');
  v_status_completed BOOLEAN := (NEW.status IS NOT NULL AND NEW.status ILIKE ANY (ARRAY['confirmed', 'completed', 'delivered']));
  v_payment_was_completed BOOLEAN := (TG_OP = 'UPDATE' AND OLD.payment_status IS NOT NULL AND OLD.payment_status ILIKE 'completed');
  v_status_was_completed BOOLEAN := (TG_OP = 'UPDATE' AND OLD.status IS NOT NULL AND OLD.status ILIKE ANY (ARRAY['confirmed', 'completed', 'delivered']));
  v_payment_refunded BOOLEAN := (NEW.payment_status IS NOT NULL AND NEW.payment_status ILIKE ANY (ARRAY['refunded', 'reversed', 'chargeback']));
  v_status_refunded BOOLEAN := (NEW.status IS NOT NULL AND NEW.status ILIKE ANY (ARRAY['refunded', 'returned', 'cancelled', 'canceled']));
  v_payment_was_refunded BOOLEAN := (TG_OP = 'UPDATE' AND OLD.payment_status IS NOT NULL AND OLD.payment_status ILIKE ANY (ARRAY['refunded', 'reversed', 'chargeback']));
  v_status_was_refunded BOOLEAN := (TG_OP = 'UPDATE' AND OLD.status IS NOT NULL AND OLD.status ILIKE ANY (ARRAY['refunded', 'returned', 'cancelled', 'canceled']));
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF v_payment_completed OR v_status_completed THEN
      PERFORM create_wallet_sale_transaction(NEW.id);
    END IF;
    IF v_payment_refunded OR v_status_refunded THEN
      PERFORM create_wallet_refund_transaction(NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (v_payment_completed AND NOT v_payment_was_completed)
       OR (v_status_completed AND NOT v_status_was_completed) THEN
      PERFORM create_wallet_sale_transaction(NEW.id);
    END IF;
    IF (v_payment_refunded AND NOT v_payment_was_refunded)
       OR (v_status_refunded AND NOT v_status_was_refunded) THEN
      PERFORM create_wallet_refund_transaction(NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_wallet_credit ON orders;
CREATE TRIGGER trg_orders_wallet_credit
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_wallet_credit();
