# Artwork Approval Flow Analysis & Fixes

## 🔍 **Current Flow Analysis**

### **Submission to Approval Process:**
1. **Creator Submits** → `project_submissions` table (status: 'submitted')
2. **Admin Reviews** → Admin dashboard shows submissions
3. **Admin Approves** → Status changes to 'approved' or 'published'
4. **Artwork Created** → `createMarketplaceItem()` function creates entry in `artworks` table
5. **Display on Site** → `getFeaturedArtworks()` queries `artworks` table

## 🚨 **Identified Issues**

### **1. Incomplete createMarketplaceItem Function**
**Problem:** The function only handles artist submissions, missing books and fashion.

**Current Code:**
```typescript
const createMarketplaceItem = async (submission: Submission) => {
    try {
        if (submission.creator_type === 'artist') {
            await supabase.from('artworks').insert({...})
        }
        // TODO: Add similar logic for books and fashion items
    } catch (error) {
        console.error('Error creating marketplace item:', error)
    }
}
```

**Issue:** Books and fashion submissions get approved but no marketplace items are created.

### **2. Missing Error Handling**
**Problem:** If artwork creation fails, there's no rollback or notification.

### **3. Status Inconsistency**
**Problem:** Submissions can be 'approved' but artwork creation might fail silently.

### **4. Missing Artwork Visibility Logic**
**Problem:** Created artworks might not be set as `is_featured` or `is_available` properly.

### **5. Creator Dashboard Query Issue**
**Problem:** Creator dashboard only shows artworks, not submission status.

## ✅ **Fixes Required**

### **Fix 1: Complete createMarketplaceItem Function**

```typescript
const createMarketplaceItem = async (submission: Submission) => {
    try {
        let createdItem = null;
        
        if (submission.creator_type === 'artist') {
            const { data, error } = await supabase
                .from('artworks')
                .insert({
                    creator_id: submission.creator.id,
                    title: submission.title,
                    description: submission.description,
                    category: submission.artist_details?.medium?.toLowerCase() || 'painting',
                    price: submission.price,
                    currency: submission.currency,
                    is_available: true,
                    is_featured: true, // Make approved items featured
                    thumbnail_url: submission.media_files?.[0]?.file_url,
                    image_urls: submission.media_files?.filter(m => m.file_type === 'image').map(m => m.file_url),
                    tags: submission.cultural_reference ? [submission.cultural_reference] : [],
                    dimensions: submission.artist_details?.dimensions,
                    materials: submission.artist_details?.materials,
                    submission_id: submission.id // Link back to submission
                })
                .select()
                .single()
            
            if (error) throw error
            createdItem = data
            
        } else if (submission.creator_type === 'writer') {
            const { data, error } = await supabase
                .from('books')
                .insert({
                    creator_id: submission.creator.id,
                    title: submission.title,
                    description: submission.description,
                    genre: submission.writer_details?.genre || 'fiction',
                    price: submission.price,
                    currency: submission.currency,
                    is_available: true,
                    is_featured: true,
                    cover_image_url: submission.media_files?.[0]?.file_url,
                    format: submission.writer_details?.format || 'paperback',
                    page_count: submission.writer_details?.page_count,
                    isbn: submission.writer_details?.isbn,
                    submission_id: submission.id
                })
                .select()
                .single()
            
            if (error) throw error
            createdItem = data
            
        } else if (submission.creator_type === 'fashion_designer') {
            const { data, error } = await supabase
                .from('fashion_items')
                .insert({
                    creator_id: submission.creator.id,
                    title: submission.title,
                    description: submission.description,
                    category: submission.fashion_details?.work_type || 'clothing',
                    price: submission.price,
                    currency: submission.currency,
                    is_available: true,
                    is_featured: true,
                    image_urls: submission.media_files?.filter(m => m.file_type === 'image').map(m => m.file_url),
                    sizes: submission.fashion_details?.sizes || [],
                    materials: submission.fashion_details?.materials || [],
                    collection_name: submission.fashion_details?.collection_name,
                    submission_id: submission.id
                })
                .select()
                .single()
            
            if (error) throw error
            createdItem = data
        }
        
        // Update submission with marketplace item reference
        if (createdItem) {
            await supabase
                .from('project_submissions')
                .update({
                    marketplace_item_id: createdItem.id,
                    published_date: new Date().toISOString()
                })
                .eq('id', submission.id)
        }
        
        return createdItem
        
    } catch (error) {
        console.error('Error creating marketplace item:', error)
        
        // Rollback submission status if marketplace creation fails
        await supabase
            .from('project_submissions')
            .update({ 
                status: 'approved_pending_publish',
                error_message: error.message 
            })
            .eq('id', submission.id)
            
        throw error
    }
}
```

### **Fix 2: Enhanced Admin Review Process**

```typescript
const submitReview = async () => {
    if (!selectedSubmission) return

    setSubmitting(true)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Create review record first
        const { error: reviewError } = await supabase
            .from('submission_reviews')
            .insert({
                submission_id: selectedSubmission.id,
                reviewer_id: user.id,
                status: reviewData.status,
                overall_score: reviewData.overall_score,
                quality_score: reviewData.quality_score,
                originality_score: reviewData.originality_score,
                cultural_relevance_score: reviewData.cultural_relevance_score,
                feedback_text: reviewData.feedback_text,
                suggestions: reviewData.suggestions,
                rejection_reason: reviewData.rejection_reason
            })

        if (reviewError) throw reviewError

        // Update submission status
        const newStatus = reviewData.status === 'approved' ? 'approved' : reviewData.status
        const { error: updateError } = await supabase
            .from('project_submissions')
            .update({
                status: newStatus,
                review_date: new Date().toISOString(),
                reviewer_id: user.id,
                review_notes: reviewData.feedback_text
            })
            .eq('id', selectedSubmission.id)

        if (updateError) throw updateError

        // If approved, create marketplace item
        if (reviewData.status === 'approved') {
            try {
                const marketplaceItem = await createMarketplaceItem(selectedSubmission)
                
                // Update status to published only if marketplace item created successfully
                await supabase
                    .from('project_submissions')
                    .update({ status: 'published' })
                    .eq('id', selectedSubmission.id)
                    
                console.log('Marketplace item created:', marketplaceItem)
                
            } catch (marketplaceError) {
                console.error('Marketplace creation failed:', marketplaceError)
                alert(`Submission approved but marketplace item creation failed: ${marketplaceError.message}`)
                // Don't return here - still send notification about approval
            }
        }

        // Send email notification
        const { emailService } = await import('@/lib/email-service')
        await emailService.sendSubmissionStatusNotification(
            selectedSubmission.creator.email,
            reviewData.status,
            {
                creatorName: selectedSubmission.creator.full_name,
                submissionTitle: selectedSubmission.title,
                submissionId: selectedSubmission.id,
                reviewDate: new Date().toISOString(),
                feedback: reviewData.feedback_text,
                suggestions: reviewData.suggestions,
                rejectionReason: reviewData.rejection_reason,
                reviewerName: user.email || 'Loge Arts Team'
            }
        )

        alert('Review submitted successfully! Creator has been notified via email.')
        setSelectedSubmission(null)
        fetchSubmissions()
        
    } catch (error) {
        console.error('Error submitting review:', error)
        alert(`Error submitting review: ${error.message}`)
    } finally {
        setSubmitting(false)
    }
}
```

### **Fix 3: Enhanced Creator Dashboard Query**

```typescript
async function getCreatorArtworks(userId: string) {
  const supabase = await createServerClient()
  
  // Get both artworks and submissions
  const [artworksResult, submissionsResult] = await Promise.allSettled([
    supabase
      .from('artworks')
      .select('*, submission:project_submissions!submission_id(*)')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('project_submissions')
      .select('*')
      .eq('creator_id', userId)
      .eq('creator_type', 'artist')
      .order('submission_date', { ascending: false })
  ])

  const artworks = artworksResult.status === 'fulfilled' ? artworksResult.value.data || [] : []
  const submissions = submissionsResult.status === 'fulfilled' ? submissionsResult.value.data || [] : []

  // Combine and deduplicate
  const combined = [
    ...artworks.map(artwork => ({
      ...artwork,
      type: 'artwork',
      status: 'published'
    })),
    ...submissions
      .filter(sub => !artworks.some(art => art.submission_id === sub.id))
      .map(submission => ({
        ...submission,
        type: 'submission',
        title: submission.title,
        created_at: submission.submission_date
      }))
  ]

  return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
```

### **Fix 4: Enhanced Homepage Query**

```typescript
export async function getFeaturedArtworks(limit = 8) {
  try {
    const supabase = await createServerClient()

    // Primary query - get published artworks with creator info
    const { data, error } = await supabase
      .from('artworks')
      .select(`
        *,
        creator:user_profiles!creator_id (
          id,
          full_name,
          avatar_url,
          location,
          rating,
          is_verified
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching artworks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error in getFeaturedArtworks:', error)
    return []
  }
}
```

## 🔧 **Database Schema Updates Needed**

### **Add Missing Columns to artworks table:**
```sql
-- Add submission reference
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES project_submissions(id);

-- Add marketplace status tracking
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS marketplace_item_id UUID;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS published_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS error_message TEXT;
```

### **Create Missing Tables:**
```sql
-- Books table (if not exists)
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES project_submissions(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  format VARCHAR(50),
  page_count INTEGER,
  isbn VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fashion items table (if not exists)
CREATE TABLE IF NOT EXISTS fashion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES project_submissions(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  image_urls TEXT[],
  sizes TEXT[],
  materials TEXT[],
  collection_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 **Implementation Steps**

1. **Run the debug SQL** to identify current issues
2. **Update database schema** with missing columns/tables
3. **Fix the createMarketplaceItem function** in admin dashboard
4. **Update creator dashboard** to show both artworks and submissions
5. **Test the complete flow** from submission to display
6. **Add monitoring** to track approval-to-display success rate

## 📊 **Testing Checklist**

- [ ] Submit a test artwork as creator
- [ ] Approve it as admin
- [ ] Verify artwork appears in artworks table
- [ ] Check if it shows on homepage
- [ ] Verify it appears in creator dashboard
- [ ] Test with books and fashion submissions
- [ ] Verify error handling for failed marketplace creation

This comprehensive fix should resolve the issue where approved uploads don't appear on the site or in creator dashboards.