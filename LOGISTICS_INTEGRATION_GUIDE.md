# Logistics Integration Guide for Loge Arts

## Overview
This guide covers the integration of logistics and shipping functionality into the Loge Arts platform, enabling seamless delivery of artworks, books, and fashion items to buyers across Nigeria.

## Supported Logistics Providers

### 1. Sendbox (Recommended)
- **Best for**: General ecommerce, multiple courier options
- **Coverage**: Nationwide
- **Features**: Real-time tracking, multiple service levels
- **API Documentation**: https://docs.sendbox.co/
- **Setup**: Sign up at https://sendbox.co/

### 2. GIG Logistics
- **Best for**: Fragile items (artworks), premium service
- **Coverage**: Major cities with expansion
- **Features**: Specialized handling, insurance options
- **API Documentation**: https://developers.giglogistics.com/
- **Setup**: Contact GIG Logistics for API access

### 3. Kwik Delivery
- **Best for**: Same-day delivery in Lagos/Abuja
- **Coverage**: Lagos, Abuja, Port Harcourt
- **Features**: Fast delivery, real-time tracking
- **API Documentation**: https://kwik.delivery/developers
- **Setup**: Register at https://kwik.delivery/

## Installation & Setup

### 1. Install Dependencies
```bash
# No additional dependencies needed - uses built-in fetch API
```

### 2. Environment Variables
Add these to your `.env.local` file:
```env
SENDBOX_API_KEY=your_sendbox_api_key
GIG_API_KEY=your_gig_logistics_api_key
KWIK_API_KEY=your_kwik_delivery_api_key
```

### 3. Database Migration
Run the shipping tables migration:
```bash
supabase db push
```

## API Endpoints

### Get Shipping Quotes
```typescript
POST /api/shipping/quote
{
  "pickup_address": {
    "street": "123 Creator Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "recipient_name": "Artist Name",
    "phone": "+234123456789"
  },
  "delivery_address": {
    "street": "456 Buyer Avenue",
    "city": "Abuja",
    "state": "FCT",
    "country": "Nigeria",
    "recipient_name": "Buyer Name",
    "phone": "+234987654321"
  },
  "package_details": {
    "weight": 2.5,
    "length": 40,
    "width": 30,
    "height": 15,
    "value": 75000,
    "description": "Artwork painting",
    "fragile": true,
    "category": "art"
  }
}
```

### Create Shipment
```typescript
POST /api/shipping/create
{
  "order_id": "uuid",
  "pickup_address": {...},
  "delivery_address": {...},
  "package_details": {...},
  "provider_name": "Sendbox", // Optional
  "shipping_cost": 2500,
  "insurance_cost": 500,
  "special_instructions": "Handle with care - fragile artwork"
}
```

### Track Shipment
```typescript
GET /api/shipping/track/{tracking_number}
```

## React Components Usage

### Shipping Calculator
```tsx
import { ShippingCalculator } from '@/components/shipping/shipping-calculator'

function CheckoutPage() {
  const handleQuoteSelect = (quote) => {
    console.log('Selected quote:', quote)
    // Add to order total
  }

  return (
    <ShippingCalculator
      itemType="art"
      itemValue={75000}
      itemWeight={2.5}
      itemDimensions={{ length: 40, width: 30, height: 15 }}
      onQuoteSelect={handleQuoteSelect}
    />
  )
}
```

### Tracking Display
```tsx
import { TrackingDisplay } from '@/components/shipping/tracking-display'

function OrderTrackingPage({ trackingNumber }) {
  return (
    <TrackingDisplay 
      trackingNumber={trackingNumber}
      autoRefresh={true}
    />
  )
}
```

## Integration with Checkout Flow

### 1. Product Page Integration
```tsx
// In your artwork/book/fashion product page
const [shippingQuote, setShippingQuote] = useState(null)

// Calculate shipping during checkout
<ShippingCalculator
  itemType={product.category}
  itemValue={product.price}
  itemWeight={product.weight}
  itemDimensions={product.dimensions}
  onQuoteSelect={setShippingQuote}
/>
```

### 2. Order Processing
```tsx
// After successful payment
const createShipment = async (orderId, shippingDetails) => {
  const response = await fetch('/api/shipping/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      ...shippingDetails
    })
  })
  
  const { tracking_number } = await response.json()
  // Save tracking number to order
}
```

## Special Handling by Item Type

### Artworks
- Always marked as fragile
- Insurance recommended for items > ₦50,000
- Special packaging instructions
- Photo documentation before shipping

### Books
- Standard packaging
- Bulk shipping discounts available
- Moisture protection for valuable books

### Fashion Items
- Garment bags for delicate items
- Size/weight optimization
- Return shipping considerations

## Error Handling

### Provider Fallbacks
The system automatically falls back to alternative providers if the primary provider fails:

```typescript
// Automatic fallback in LogisticsService
if (primaryProvider.fails()) {
  try {
    return await secondaryProvider.createShipment(request)
  } catch (error) {
    // Log error and notify admin
  }
}
```

### Tracking Failures
If live tracking fails, the system returns cached data from the database.

## Testing

### Test with Sandbox APIs
Most providers offer sandbox/test environments:

```env
# Use test API keys
SENDBOX_API_KEY=test_key_here
GIG_API_KEY=test_key_here
```

### Mock Data for Development
```typescript
// Use mock responses during development
if (process.env.NODE_ENV === 'development') {
  return mockShippingQuotes
}
```

## Monitoring & Analytics

### Key Metrics to Track
- Shipping quote success rate
- Average delivery times by provider
- Customer satisfaction with delivery
- Failed delivery rates
- Cost optimization opportunities

### Logging
```typescript
// Log important shipping events
console.log('Shipment created:', {
  orderId,
  trackingNumber,
  provider,
  estimatedDelivery
})
```

## Security Considerations

### API Key Management
- Store API keys in environment variables
- Use different keys for production/staging
- Rotate keys regularly
- Monitor API usage

### Data Protection
- Encrypt sensitive shipping data
- Implement rate limiting
- Validate all input data
- Use HTTPS for all API calls

## Cost Optimization

### Strategies
1. **Provider Comparison**: Always show multiple quotes
2. **Bulk Shipping**: Combine multiple items when possible
3. **Zone Optimization**: Use local providers for regional deliveries
4. **Insurance**: Only add insurance for high-value items

### Pricing Display
```tsx
// Show transparent pricing
<div className="shipping-breakdown">
  <div>Base Shipping: ₦{baseShipping}</div>
  <div>Insurance: ₦{insurance}</div>
  <div>Total: ₦{total}</div>
</div>
```

## Customer Communication

### Automated Notifications
- Order confirmation with tracking number
- Pickup notifications
- In-transit updates
- Delivery confirmations
- Delivery failure alerts

### SMS/Email Integration
```typescript
// Send tracking updates
await sendSMS(customer.phone, `Your order ${trackingNumber} is now in transit`)
await sendEmail(customer.email, trackingUpdateTemplate)
```

## Troubleshooting

### Common Issues
1. **Invalid Address**: Validate addresses before creating shipments
2. **Weight Limits**: Check provider weight restrictions
3. **Service Areas**: Verify delivery coverage
4. **API Timeouts**: Implement retry logic

### Debug Mode
```typescript
// Enable detailed logging
if (process.env.DEBUG_SHIPPING) {
  console.log('Shipping request:', request)
  console.log('Provider response:', response)
}
```

## Next Steps

1. **Set up provider accounts** and obtain API keys
2. **Run database migrations** to create shipping tables
3. **Test with sandbox APIs** before going live
4. **Integrate components** into your checkout flow
5. **Set up monitoring** and error tracking
6. **Train customer service** on shipping processes

## Support

For technical support with this integration:
- Check provider documentation
- Review error logs
- Test with sandbox environments
- Contact provider support teams

Remember to test thoroughly with real addresses and package dimensions before launching to production!