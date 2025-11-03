import { UserAvatar, CreatorAvatar, AdminAvatar } from '@/components/user-avatar'
import { UserCard } from '@/components/user-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock user data for demonstration
const mockUsers = [
  {
    id: '8b396cf6-6110-45a6-a41a-d0d6fa2ee025',
    full_name: 'Stephen Mayowa',
    email: 'stephenmayowa112@gmail.com',
    role: 'admin',
    avatar_url: null, // Will show initials
    bio: 'Platform administrator and art enthusiast',
    location: 'Lagos, Nigeria',
    discipline: 'Platform Management',
    rating: 5.0,
    is_verified: true,
    created_at: '2025-10-01T17:14:39.738012Z'
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Adunni Olorunnisola',
    email: 'adunni@example.com',
    role: 'creator',
    avatar_url: '/image/AdunniOlorunnisola.jpg',
    bio: 'Contemporary African painter exploring themes of identity and heritage',
    location: 'Lagos, Nigeria',
    discipline: 'Painting',
    rating: 4.8,
    is_verified: true,
    created_at: '2025-09-15T10:00:00Z',
    social_links: {
      instagram: '@adunni_art',
      website: 'https://adunniolorunnisola.com'
    }
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Kwame Asante',
    email: 'kwame@example.com',
    role: 'creator',
    avatar_url: '/image/KwameAsante.jpg',
    bio: 'Sculptor and mixed media artist from Ghana',
    location: 'Accra, Ghana',
    discipline: 'Sculpture',
    rating: 4.6,
    is_verified: true,
    created_at: '2025-08-20T14:30:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Amara Diallo',
    email: 'amara@example.com',
    role: 'creator',
    avatar_url: '/image/AmaraDiallo.jpg',
    bio: 'Fashion designer specializing in contemporary African wear',
    location: 'Dakar, Senegal',
    discipline: 'Fashion Design',
    rating: 4.7,
    is_verified: true,
    created_at: '2025-07-10T09:15:00Z'
  }
]

export default function AvatarDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Avatar System Demo
          </h1>
          <p className="text-gray-600">
            See how profile pictures will appear across the platform
          </p>
        </div>

        {/* Avatar Sizes Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 flex-wrap gap-4">
              <div className="text-center">
                <UserAvatar user={mockUsers[0]} size="xs" />
                <p className="text-xs mt-1">XS</p>
              </div>
              <div className="text-center">
                <UserAvatar user={mockUsers[0]} size="sm" />
                <p className="text-xs mt-1">SM</p>
              </div>
              <div className="text-center">
                <UserAvatar user={mockUsers[0]} size="md" />
                <p className="text-xs mt-1">MD</p>
              </div>
              <div className="text-center">
                <UserAvatar user={mockUsers[0]} size="lg" />
                <p className="text-xs mt-1">LG</p>
              </div>
              <div className="text-center">
                <UserAvatar user={mockUsers[0]} size="xl" />
                <p className="text-xs mt-1">XL</p>
              </div>
              <div className="text-center">
                <UserAvatar user={mockUsers[0]} size="2xl" />
                <p className="text-xs mt-1">2XL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Avatar Types */}
        <Card>
          <CardHeader>
            <CardTitle>Special Avatar Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <AdminAvatar user={mockUsers[0]} size="lg" />
                <p className="text-sm mt-2 font-medium">Admin Avatar</p>
                <p className="text-xs text-gray-500">With admin badge</p>
              </div>
              <div className="text-center">
                <CreatorAvatar user={mockUsers[1]} size="lg" />
                <p className="text-sm mt-2 font-medium">Creator Avatar</p>
                <p className="text-xs text-gray-500">Standard creator</p>
              </div>
              <div className="text-center">
                <UserAvatar user={mockUsers[1]} size="lg" showOnlineStatus isOnline />
                <p className="text-sm mt-2 font-medium">Online Status</p>
                <p className="text-xs text-gray-500">With online indicator</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fallback Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Fallbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <UserAvatar user={{ full_name: 'John Doe', avatar_url: null }} size="lg" />
                <p className="text-sm mt-2">Initials: JD</p>
              </div>
              <div className="text-center">
                <UserAvatar user={{ email: 'artist@example.com', avatar_url: null }} size="lg" />
                <p className="text-sm mt-2">Email: A</p>
              </div>
              <div className="text-center">
                <UserAvatar user={{ avatar_url: null }} size="lg" />
                <p className="text-sm mt-2">Default: U</p>
              </div>
              <div className="text-center">
                <UserAvatar user={{ full_name: 'Very Long Name Here', avatar_url: null }} size="lg" />
                <p className="text-sm mt-2">Long name: VL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Cards Demo */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Cards with Avatars</h2>
          
          {/* Compact Cards */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Compact Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockUsers.slice(0, 2).map(user => (
                <UserCard key={user.id} user={user} variant="compact" />
              ))}
            </div>
          </div>

          {/* Detailed Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detailed Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockUsers.slice(1, 4).map(user => (
                <UserCard key={user.id} user={user} variant="detailed" />
              ))}
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage in Comments/Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUsers.slice(0, 3).map(user => (
                <div key={user.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                  <UserAvatar user={user} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">{user.full_name}</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      This is how avatars would look in comments or message threads. 
                      The avatar provides visual identity and makes conversations more engaging.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Implementation Ready!</h3>
            <p className="text-blue-800 text-sm">
              All these avatar components are ready to use across your platform. 
              Once users upload their profile pictures, they'll automatically appear 
              in all these contexts. The system gracefully handles missing avatars 
              with initials fallbacks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}