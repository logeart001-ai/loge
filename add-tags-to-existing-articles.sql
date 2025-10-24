-- Add tags to existing blog articles that don't have them
-- Run this in your Supabase SQL editor

UPDATE blog_posts 
SET tags = ARRAY['mixed media', 'contemporary art', 'african art', 'artistic process', 'creativity']
WHERE slug = 'behind-sunlit-market' AND tags IS NULL;

UPDATE blog_posts 
SET tags = ARRAY['mixed media', 'art techniques', 'contemporary art', 'artistic innovation', 'creative expression']
WHERE slug = 'why-mixed-media-matters' AND tags IS NULL;

UPDATE blog_posts 
SET tags = ARRAY['urban art', 'photography', 'street culture', 'documentary art', 'african cities']
WHERE slug = 'documenting-urban-rhythm' AND tags IS NULL;

-- Verify the updates
SELECT 
    title,
    slug,
    array_length(tags, 1) as tag_count,
    tags
FROM blog_posts 
WHERE slug IN ('behind-sunlit-market', 'why-mixed-media-matters', 'documenting-urban-rhythm')
ORDER BY published_at DESC;