import { createServerClient } from './supabase'

export interface ViewStats {
  total_views: number
  unique_users: number
  days_with_views: number
 