# Paystack Payment Integration

## Overview
This project integrates Paystack for payment processing, allowing users to purchase artworks securely.

## Features Implemented

### 1. Payment Service (`lib/paystack-service.ts`)
- Initialize payment transactions
- Verify payment status
- Create transfer recipients (for creator payouts)
- Initiate transfers (pay creators)
- Bank account verification
- Helper functions to convert between Naira and Kobo

### 2. API Routes

#### `/api/payments/initialize` (POST)
Initializes a payment transaction and creates an order.

**Request Body:**
```json
{
  "cart_id": "uuid",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "ORDER_...",
    "order_id": "uuid"
  }
}
```

#### `/api/payments/verify` (GET)
Verifies a payment and updates the order status.

**Query Parameters:**
- `reference`: Payment reference from Paystack

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "amount": 50000,
    "status": "success",
    "reference": "ORDER_..."
  }
}
```

### 3. Payment Flow

1. **User adds items to cart**
   - Items are stored in the `carts` and `cart_items` tables

2. **User clicks "Proceed to Checkout"**
   - Cart page sends request to `/api/payments/initialize`
   - API creates an order and order items
   - API initializes Paystack transaction
   - User is redirected to Paystack payment page

3. **User completes payment on Paystack**
   - Paystack redirects user back to `/payment/callback?reference=...`

4. **Payment callback page verifies payment**
   - Calls `/api/payments/verify` with the reference
   - API verifies payment with Paystack
   - API updates order status to "completed"
   - API creates wallet transactions for creators
   - API marks cart as completed
   - User sees success/failure message

### 4. Pages

#### `/cart` - Shopping Cart
- Displays cart items
- Shows subtotal
- "Proceed to Checkout" button initiates payment

#### `/payment/callback` - Payment Result
- Verifies payment status
- Shows success/failure message
- Links to orders page or cart

## Environment Variables

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# App URL for payment callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

### Test Mode
1. Use Paystack test keys (starting with `sk_test_` and `pk_test_`)
2. Test card numbers provided by Paystack:
   - Success: `4084084084084081`
   - Decline: `5060666666666666666`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - PIN: `0000`

### Live Mode
1. Replace test keys with live keys in `.env.local`
2. Keys starting with `sk_live_` and `pk_live_`
3. Test with real cards first before going fully live

## Database Schema

### Tables Used
- `carts` - Active shopping carts
- `cart_items` - Items in carts
- `orders` - Created orders
- `order_items` - Items in orders
- `wallet_transactions` - Creator earnings

### Order Statuses
- `pending` - Order created, awaiting payment
- `confirmed` - Payment successful
- `processing` - Order being fulfilled
- `completed` - Order delivered
- `cancelled` - Order cancelled

### Payment Statuses
- `pending` - Payment initiated
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

## Security Considerations

1. **Never expose secret keys** - Only use in server-side code
2. **Verify payments server-side** - Don't trust client-side verification
3. **Use HTTPS in production** - Required by Paystack
4. **Implement webhooks** - For real-time payment notifications (recommended)
5. **Handle payment idempotency** - Check if order is already paid

## Future Enhancements

1. **Paystack Webhooks** - For real-time payment updates
2. **Subscription Payments** - For premium features
3. **Refund Handling** - Process refunds through Paystack
4. **Creator Payouts** - Automated payouts to creators
5. **Payment Analytics** - Track payment success rates
6. **Multi-currency Support** - Support USD, GBP, etc.

## Support

For Paystack-specific issues, refer to:
- [Paystack Documentation](https://paystack.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api)
- [Paystack Support](https://paystack.com/contact)
