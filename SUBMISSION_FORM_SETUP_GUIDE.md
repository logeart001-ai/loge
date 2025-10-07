# Project Submission Form - Complete Setup Guide

## ✅ **Form is Now Fully Functional!**

### **What's Been Done:**

1. ✅ **Added Form Validation**
   - Client-side validation before submission
   - Required field checking
   - Type-specific field validation
   - Clear error messages

2. ✅ **Made Fields Required**
   - All critical fields now marked with `*`
   - HTML5 `required` attribute added
   - Custom validation function

3. ✅ **Improved Error Handling**
   - Detailed error messages
   - Step-by-step logging
   - Non-blocking email service

---

## 📋 **Required Fields by Creator Type**

### **All Creators (Common Fields)**
- ✅ Title *
- ✅ Description *
- ✅ Price *
- ✅ At least 1 Image *
- ✅ Original Work Confirmation *
- ✅ Terms Agreement *

### **Artists**
- ✅ Medium * (e.g., Oil on canvas)
- ✅ Dimensions * (e.g., 24x36 inches)

### **Writers**
- ✅ Genre * (Fiction, Poetry, etc.)
- ✅ Format * (Book, Short Story, etc.)
- ✅ Word Count *

### **Fashion Designers**
- ✅ Collection Name *
- ✅ Work Type * (Apparel, Textile, etc.)
- ✅ Fabric/Materials * (at least one)

---

## 🗄️ **Database Setup - CRITICAL STEP**

### **Step 1: Verify Tables Exist**

Run this in your Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions',
  'submission_media'
)
ORDER BY table_name;
```

### **Step 2: If Tables Don't Exist, Run Migration**

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/20250929_creator_submission_tables.sql`
3. Copy the entire content
4. Paste into SQL Editor
5. Click "Run"

### **Step 3: Verify RLS Policies**

```sql
-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions'
)
ORDER BY tablename;
```

### **Step 4: Test Insert Permission**

```sql
-- Test if you can insert (as authenticated user)
INSERT INTO project_submissions (
  creator_id,
  creator_type,
  title,
  description,
  price,
  currency,
  status
) VALUES (
  auth.uid(),
  'artist',
  'Test Submission',
  'Test Description',
  100.00,
  'NGN',
  'draft'
) RETURNING id;

-- Clean up test
DELETE FROM project_submissions WHERE title = 'Test Submission';
```

---

## 🧪 **Testing the Form**

### **Test 1: Basic Artist Submission**
1. Navigate to `/dashboard/submissions/new`
2. Select "Artist" as creator type
3. Fill in:
   - Title: "Test Artwork"
   - Description: "This is a test submission"
   - Medium: "Oil on canvas"
   - Dimensions: "24x36 inches"
   - Price: "1000"
4. Upload at least 1 image
5. Check both agreement boxes
6. Click Submit

**Expected Result**: Success message, submission appears in dashboard

### **Test 2: Writer Submission**
1. Select "Writer" as creator type
2. Fill in:
   - Title: "Test Book"
   - Description: "A test book submission"
   - Genre: "Fiction"
   - Format: "Book"
   - Word Count: "50000"
   - Price: "2000"
3. Upload at least 1 image (book cover)
4. Check both agreement boxes
5. Click Submit

### **Test 3: Fashion Designer Submission**
1. Select "Fashion Designer" as creator type
2. Fill in:
   - Title: "Test Collection"
   - Description: "A test fashion collection"
   - Collection Name: "Spring 2025"
   - Work Type: "Apparel"
   - Fabric Materials: "cotton, silk"
   - Price: "5000"
3. Upload at least 1 image
4. Check both agreement boxes
5. Click Submit

### **Test 4: Validation Errors**
1. Try submitting without filling required fields
2. Should see error message listing all missing fields
3. Try submitting without images
4. Should see "At least one image is required"

---

## 🔍 **Troubleshooting**

### **Error: "Failed to create submission: permission denied"**
**Solution**: 
- Check RLS policies are created
- Verify user is authenticated
- Check user has `creator` role in `user_profiles`

### **Error: "relation 'project_submissions' does not exist"**
**Solution**:
- Run the migration SQL script
- Verify tables were created successfully

### **Error: "Failed to send confirmation email"**
**Solution**:
- This is non-critical - submission will still succeed
- Check email service configuration
- Email sending is now non-blocking

### **Error: "At least one image is required"**
**Solution**:
- Upload at least one image file
- Check file size (max 50MB per file)
- Verify file is a valid image format

### **Form submits but data not appearing**
**Solution**:
1. Check browser console for errors
2. Verify in Supabase:
   ```sql
   SELECT * FROM project_submissions 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. Check RLS policies aren't blocking SELECT

---

## 📊 **Verification Queries**

### **Check Recent Submissions**
```sql
SELECT 
  ps.id,
  ps.title,
  ps.creator_type,
  ps.status,
  ps.created_at,
  up.full_name as creator_name
FROM project_submissions ps
LEFT JOIN user_profiles up ON ps.creator_id = up.id
ORDER BY ps.created_at DESC
LIMIT 10;
```

### **Check Type-Specific Data**
```sql
-- Artist submissions
SELECT ps.title, as_data.medium, as_data.dimensions
FROM project_submissions ps
JOIN artist_submissions as_data ON ps.id = as_data.submission_id
WHERE ps.creator_type = 'artist';

-- Writer submissions
SELECT ps.title, ws.genre, ws.word_count
FROM project_submissions ps
JOIN writer_submissions ws ON ps.id = ws.submission_id
WHERE ps.creator_type = 'writer';

-- Fashion submissions
SELECT ps.title, fs.collection_name, fs.work_type
FROM project_submissions ps
JOIN fashion_submissions fs ON ps.id = fs.submission_id
WHERE ps.creator_type = 'fashion_designer';
```

---

## 🎯 **Next Steps**

1. **Run Database Migration** (if not done)
2. **Test Form** with all three creator types
3. **Verify Data** appears in Supabase
4. **Check Admin Dashboard** can see submissions
5. **Test File Uploads** (if file upload service is configured)

---

## 📝 **Form Validation Rules**

```typescript
// Common fields
- title: Required, non-empty string
- description: Required, non-empty string
- price: Required, must be > 0
- images: Required, at least 1 file

// Artist-specific
- medium: Required for artists
- dimensions: Required for artists

// Writer-specific
- genre: Required for writers
- format: Required for writers
- word_count: Required for writers, must be > 0

// Fashion-specific
- collection_name: Required for fashion designers
- work_type: Required for fashion designers
- fabric_materials: Required for fashion designers, at least 1 item
```

---

## ✨ **Features Implemented**

- ✅ Multi-step form with tabs
- ✅ Type-specific fields (Artist/Writer/Fashion)
- ✅ File upload support (images, videos, audio, documents)
- ✅ Real-time validation
- ✅ Clear error messages
- ✅ Required field indicators (*)
- ✅ Database integration
- ✅ Email confirmation (non-blocking)
- ✅ Success/error feedback
- ✅ Form reset after submission

---

**Status**: ✅ **READY FOR TESTING**
**Date**: January 2025
**Next Action**: Run database migration and test the form!
