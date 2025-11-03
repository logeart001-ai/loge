import { TestAvatarUpload } from '@/components/test-avatar-upload'

export default function TestAvatarUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Avatar Upload Test
          </h1>
          <p className="text-gray-600">
            Test the profile picture upload functionality
          </p>
        </div>

        <TestAvatarUpload />

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
            <ol className="text-left text-blue-800 space-y-1">
              <li>1. Make sure you're signed in</li>
              <li>2. Click "Test Storage Access" to verify setup</li>
              <li>3. Click on the avatar area to upload an image</li>
              <li>4. Select an image file (JPG, PNG, GIF under 5MB)</li>
              <li>5. Watch the upload progress and see the result</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}