'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Search, 
  MoreVertical, 
  Ban, 
  CheckCircle, 
  Mail
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  creator_status?: string | null
  is_verified?: boolean
  created_at: string
  avatar_url?: string
  bio?: string
  discipline?: string
  location?: string
  country?: string
  phone?: string
  rating?: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Add a small delay to ensure auth is ready
    const timer = setTimeout(() => {
      fetchUsers()
    }, 100)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    filterUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true)
        setError(null)
      }
      
      console.log('Fetching users...')
      
      // First check if we have a valid Supabase client
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error('Authentication failed')
      }
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('User authenticated, fetching all users...')

      // First, get all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, creator_status, is_verified, created_at, avatar_url, bio, discipline, location, country, phone, rating')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Supabase error details:', {
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          code: profilesError.code
        })
        throw new Error(`Database error: ${profilesError.message}`)
      }

      // Try to get additional users from auth.users that might not have profiles
      // This uses a custom API endpoint since auth.users is not directly accessible
      let allUsers = profilesData || []
      
      try {
        console.log('Fetching additional auth users...')
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const authUsersData = await response.json()
          console.log('Auth users response:', authUsersData)
          
          if (authUsersData.users) {
            // Merge auth users with profile data
            const profileMap = new Map(allUsers.map(p => [p.id, p]))
            
            authUsersData.users.forEach((authUser: any) => {
              if (!profileMap.has(authUser.id)) {
                // Add users who don't have profiles yet
                allUsers.push({
                  id: authUser.id,
                  email: authUser.email,
                  full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown User',
                  role: 'buyer', // Default role
                  creator_status: null,
                  is_verified: authUser.email_confirmed_at ? true : false,
                  created_at: authUser.created_at,
                  avatar_url: authUser.user_metadata?.avatar_url || null,
                  bio: null,
                  discipline: null,
                  location: null,
                  country: null,
                  phone: null,
                  rating: 0
                })
              }
            })
          }
        } else {
          console.warn('Could not fetch auth users, showing profile users only')
        }
      } catch (authFetchError) {
        console.warn('Failed to fetch auth users:', authFetchError)
        console.log('Showing profile users only')
      }
      
      setUsers(allUsers)
      setError(null)
      console.log(`✅ Successfully loaded ${allUsers.length} users (${profilesData?.length || 0} with profiles)`)
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      
      // More specific error messages
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchUsers(true)
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') {
        filtered = filtered.filter(user => user.is_verified === true)
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(user => user.is_verified === false)
      }
    }

    setFilteredUsers(filtered)
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First check if user has a profile, if not create one
      const userToUpdate = users.find(u => u.id === userId)
      if (!userToUpdate) {
        throw new Error('User not found')
      }

      // Try to update existing profile
      let { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      // If profile doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', userId)
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userToUpdate.email,
            full_name: userToUpdate.full_name,
            role: newRole,
            is_verified: userToUpdate.is_verified || false
          })

        if (insertError) throw insertError
      } else if (error) {
        throw error
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      alert(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const updateUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      // First check if user has a profile, if not create one
      const userToUpdate = users.find(u => u.id === userId)
      if (!userToUpdate) {
        throw new Error('User not found')
      }

      // Try to update existing profile
      let { error } = await supabase
        .from('user_profiles')
        .update({ is_verified: newStatus })
        .eq('id', userId)
        .select()

      // If profile doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', userId)
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userToUpdate.email,
            full_name: userToUpdate.full_name,
            role: userToUpdate.role || 'buyer',
            is_verified: newStatus
          })

        if (insertError) throw insertError
      } else if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to update user verification status')
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_verified: newStatus } : user
      ))

      alert(`User verification status updated to ${newStatus ? 'verified' : 'unverified'}`)
    } catch (error) {
      console.error('Error updating user status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to update user status: ${errorMessage}`)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      creator: { color: 'bg-blue-100 text-blue-800', label: 'Creator' },
      collector: { color: 'bg-green-100 text-green-800', label: 'Collector' },
      user: { color: 'bg-gray-100 text-gray-800', label: 'User' }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getStatusBadge = (isVerified?: boolean) => {
    if (isVerified) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Users</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <p className="text-xs text-gray-500">
                Retry attempt: {retryCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="collector">Collector</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.discipline || 'No discipline set'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.is_verified)}
                  
                  <div className="flex items-center space-x-2">
                    <Dialog open={isDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage User: {user.full_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Change Role</Label>
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="collector">Collector</SelectItem>
                                <SelectItem value="creator">Creator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Verification Status</Label>
                            <Select
                              value={user.is_verified ? 'verified' : 'unverified'}
                              onValueChange={(value) => updateUserStatus(user.id, value === 'verified')}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="unverified">Unverified</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserStatus(user.id, !user.is_verified)}
                            >
                              {user.is_verified ? (
                                <>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Unverify
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Verify
                                </>
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="w-4 h-4 mr-2" />
                              Email User
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}