import { NextResponse } from 'next/server'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    },
    tests: {} as any
  }

  // Test 1: Basic fetch to Supabase
  try {
    console.log('Testing basic fetch to Supabase...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json'
      }
    })
    
    results.tests.basicFetch = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    }
    
    if (response.ok) {
      const text = await response.text()
      results.tests.basicFetch.responseLength = text.length
      results.tests.basicFetch.responsePreview = text.substring(0, 200)
    }
  } catch (error) {
    results.tests.basicFetch = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }
  }

  // Test 2: Test with different user agent
  try {
    console.log('Testing with different user agent...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Loge-Art-Test/1.0'
      }
    })
    
    results.tests.userAgentFetch = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    }
  } catch (error) {
    results.tests.userAgentFetch = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // Test 3: Test DNS resolution (if possible)
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    results.tests.urlParsing = {
      success: true,
      hostname: url.hostname,
      protocol: url.protocol,
      port: url.port || (url.protocol === 'https:' ? '443' : '80')
    }
  } catch (error) {
    results.tests.urlParsing = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }

  return NextResponse.json(results)
}