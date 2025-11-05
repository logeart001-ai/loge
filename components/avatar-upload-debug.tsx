'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export function AvatarUploadDebug() {
  const [status, setStatus] = useState('Ready')

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Avatar Upload Debug</h3>
      <p className="text-sm text-gray-600">Status: {status}</p>
    </div>
  )
}