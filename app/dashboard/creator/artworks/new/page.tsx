import { requireAuth } from '@/lib/auth'
import { ArtworkUploadForm } from '@/components/artwork-upload-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewArtworkPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/creator">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Upload New Artwork</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Creativity</CardTitle>
            <p className="text-gray-600">
              Upload your artwork and share it with art lovers around the world.
            </p>
          </CardHeader>
          <CardContent>
            <ArtworkUploadForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}