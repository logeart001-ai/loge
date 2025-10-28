// Simple test to verify Paystack configuration
// Run with: node test-paystack.js

require('dotenv').config({ path: '.env.local' })

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

console.log('🔥 Testing Paystack configuration...')
console.log('🔥 Has secret key:', !!PAYSTACK_SECRET_KEY)
console.log('🔥 Key starts with sk_test:', PAYSTACK_SECRET_KEY?.startsWith('sk_test_'))

async function testPaystackAPI() {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('🔥 Paystack API response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('🔥 Paystack API working! Banks count:', data.data?.length || 0)
    } else {
      const error = await response.text()
      console.log('🔥 Paystack API error:', error)
    }
  } catch (error) {
    console.log('🔥 Network error:', error.message)
  }
}

testPaystackAPI()