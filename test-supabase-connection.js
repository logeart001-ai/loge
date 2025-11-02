// Simple Node.js script to test Supabase connectivity
// Run with: node test-supabase-connection.js

const https = require('https');

const SUPABASE_URL = 'https://sfwopulinzmpupmgaqyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd29wdWxpbnptcHVwbWdhcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTAzMDgsImV4cCI6MjA3MDA2NjMwOH0.9kpebBsah9IkpW0i3wki0HmFXGhAvzwM1J1xc9GkFqU';

console.log('Testing Supabase connectivity...');
console.log('URL:', SUPABASE_URL);

// Test 1: Basic HTTP connectivity
const testUrl = new URL('/rest/v1/', SUPABASE_URL);
const options = {
  hostname: testUrl.hostname,
  port: 443,
  path: testUrl.pathname,
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
};

console.log('\n1. Testing basic HTTP connectivity...');
const req = https.request(options, (res) => {
  console.log(`✅ HTTP Status: ${res.statusCode}`);
  console.log(`✅ Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response received');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ Response data:', parsed);
      } catch (e) {
        console.log('✅ Raw response:', data.substring(0, 200));
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ HTTP Request failed:', error.message);
  console.error('❌ Error code:', error.code);
  console.error('❌ Full error:', error);
});

req.setTimeout(10000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.end();

// Test 2: DNS resolution
console.log('\n2. Testing DNS resolution...');
const dns = require('dns');
dns.lookup('sfwopulinzmpupmgaqyw.supabase.co', (err, address, family) => {
  if (err) {
    console.error('❌ DNS lookup failed:', err.message);
  } else {
    console.log('✅ DNS resolved to:', address, `(IPv${family})`);
  }
});

// Test 3: Network connectivity
console.log('\n3. Testing network connectivity...');
const net = require('net');
const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(443, 'sfwopulinzmpupmgaqyw.supabase.co', () => {
  console.log('✅ TCP connection successful');
  socket.destroy();
});

socket.on('error', (error) => {
  console.error('❌ TCP connection failed:', error.message);
});

socket.on('timeout', () => {
  console.error('❌ TCP connection timeout');
  socket.destroy();
});