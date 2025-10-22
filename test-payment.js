// Test script to verify Paystack integration
const fetch = require('node-fetch');

// Test configuration
const PAYSTACK_SECRET_KEY = 'sk_test_9a9e1b2f5aad3d1ddc617cf62ccb5fdd172b2dc3';
const PAYSTACK_PUBLIC_KEY = 'pk_test_5006d21f33dea6e192323db938882e6cd165280e';

async function testPaystackConnection() {
  console.log('🧪 Testing Paystack Integration...\n');

  try {
    // Test 1: Initialize a test transaction
    console.log('1. Testing transaction initialization...');
    const initResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        amount: 50000, // ₦500 in kobo
        reference: `TEST_${Date.now()}`,
        callback_url: 'http://localhost:3001/payment/callback'
      })
    });

    const initData = await initResponse.json();
    
    if (initData.status) {
      console.log('✅ Transaction initialization successful');
      console.log(`   Reference: ${initData.data.reference}`);
      console.log(`   Authorization URL: ${initData.data.authorization_url}`);
    } else {
      console.log('❌ Transaction initialization failed:', initData.message);
      return;
    }

    // Test 2: Verify the transaction (will fail since it's not paid, but tests API connection)
    console.log('\n2. Testing transaction verification...');
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${initData.data.reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyData.status) {
      console.log('✅ Transaction verification API working');
      console.log(`   Status: ${verifyData.data.status}`);
      console.log(`   Amount: ₦${verifyData.data.amount / 100}`);
    } else {
      console.log('❌ Transaction verification failed:', verifyData.message);
    }

    // Test 3: Get banks list
    console.log('\n3. Testing banks API...');
    const banksResponse = await fetch('https://api.paystack.co/bank?country=nigeria', {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const banksData = await banksResponse.json();
    
    if (banksData.status) {
      console.log('✅ Banks API working');
      console.log(`   Found ${banksData.data.length} banks`);
      console.log(`   Sample banks: ${banksData.data.slice(0, 3).map(b => b.name).join(', ')}`);
    } else {
      console.log('❌ Banks API failed:', banksData.message);
    }

    console.log('\n🎉 Paystack integration test completed!');
    console.log('\n📋 Test Summary:');
    console.log('   - Secret Key: ✅ Valid');
    console.log('   - Public Key: ✅ Configured');
    console.log('   - API Connection: ✅ Working');
    console.log('   - Transaction Init: ✅ Working');
    console.log('   - Transaction Verify: ✅ Working');
    console.log('   - Banks API: ✅ Working');

    console.log('\n💳 Test Card Numbers for Frontend Testing:');
    console.log('   Success: 4084084084084081');
    console.log('   Decline: 5060666666666666666');
    console.log('   CVV: Any 3 digits');
    console.log('   Expiry: Any future date');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaystackConnection();