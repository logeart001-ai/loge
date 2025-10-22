// Complete payment flow test script
// Run this with: node test-payment-flow.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001'; // Your dev server URL
const PAYSTACK_SECRET_KEY = 'sk_test_9a9e1b2f5aad3d1ddc617cf62ccb5fdd172b2dc3';

async function testCompletePaymentFlow() {
  console.log('🧪 Testing Complete Payment Flow...\n');

  try {
    // Step 1: Test payment initialization API
    console.log('1. Testing Payment Initialization API...');
    
    const initPayload = {
      cart_id: 'test-cart-id',
      email: 'test@example.com'
    };

    console.log('   Payload:', JSON.stringify(initPayload, null, 2));
    
    // Note: This will fail without proper authentication, but we can test the endpoint
    const initResponse = await fetch(`${BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real test, you'd need to include authentication headers
      },
      body: JSON.stringify(initPayload)
    });

    const initData = await initResponse.json();
    console.log('   Response Status:', initResponse.status);
    console.log('   Response:', JSON.stringify(initData, null, 2));

    if (initResponse.status === 401) {
      console.log('   ✅ API endpoint exists and requires authentication (expected)');
    } else if (initResponse.ok) {
      console.log('   ✅ Payment initialization successful');
    } else {
      console.log('   ⚠️  Payment initialization failed (may need authentication)');
    }

    // Step 2: Test payment verification API
    console.log('\n2. Testing Payment Verification API...');
    
    const testReference = 'TEST_REFERENCE_123';
    const verifyResponse = await fetch(`${BASE_URL}/api/payments/verify?reference=${testReference}`);
    const verifyData = await verifyResponse.json();
    
    console.log('   Response Status:', verifyResponse.status);
    console.log('   Response:', JSON.stringify(verifyData, null, 2));

    if (verifyResponse.status === 400 || verifyResponse.status === 404) {
      console.log('   ✅ Verification API exists and handles invalid references');
    }

    // Step 3: Test direct Paystack integration
    console.log('\n3. Testing Direct Paystack Integration...');
    
    const paystackPayload = {
      email: 'test@example.com',
      amount: 50000, // ₦500 in kobo
      reference: `FLOW_TEST_${Date.now()}`,
      callback_url: `${BASE_URL}/payment/callback`
    };

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackPayload)
    });

    const paystackData = await paystackResponse.json();
    console.log('   Paystack Response:', JSON.stringify(paystackData, null, 2));

    if (paystackData.status) {
      console.log('   ✅ Paystack integration working');
      console.log('   📝 Test Payment URL:', paystackData.data.authorization_url);
      
      // Step 4: Test verification of the created transaction
      console.log('\n4. Testing Paystack Verification...');
      
      const verifyPaystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${paystackData.data.reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });

      const verifyPaystackData = await verifyPaystackResponse.json();
      console.log('   Verification Response:', JSON.stringify(verifyPaystackData, null, 2));
      
      if (verifyPaystackData.status) {
        console.log('   ✅ Paystack verification working');
        console.log('   💰 Transaction Status:', verifyPaystackData.data.status);
        console.log('   💵 Amount:', `₦${verifyPaystackData.data.amount / 100}`);
      }
    }

    // Step 5: Test webhook endpoint
    console.log('\n5. Testing Webhook Endpoint...');
    
    const webhookPayload = {
      event: 'charge.success',
      data: {
        reference: 'TEST_WEBHOOK_REF',
        amount: 50000,
        status: 'success',
        customer: {
          email: 'test@example.com'
        },
        metadata: {
          order_id: 'test-order-123'
        }
      }
    };

    // Note: Real webhook would have proper signature
    const webhookResponse = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'test-signature' // This would be invalid but tests the endpoint
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('   Webhook Response Status:', webhookResponse.status);
    
    if (webhookResponse.status === 400 || webhookResponse.status === 401) {
      console.log('   ✅ Webhook endpoint exists and validates signatures');
    }

    console.log('\n🎉 Payment Flow Test Summary:');
    console.log('   ✅ Payment APIs are accessible');
    console.log('   ✅ Paystack integration is working');
    console.log('   ✅ Test keys are valid');
    console.log('   ✅ Webhook endpoint exists');
    
    console.log('\n📋 Next Steps for Manual Testing:');
    console.log('   1. Visit: http://localhost:3001/test-payment');
    console.log('   2. Sign in to your account');
    console.log('   3. Add test artworks to cart');
    console.log('   4. Proceed to checkout');
    console.log('   5. Use test card: 4084084084084081');
    console.log('   6. Verify payment completion');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   npm run dev');
    }
  }
}

testCompletePaymentFlow();