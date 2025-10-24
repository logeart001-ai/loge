-- Fix blog_posts table structure and create articles
-- Run this in your Supabase SQL editor

-- First, let's check and fix the blog_posts table structure
DO $$
BEGIN
    -- Add featured_image_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'featured_image_url'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN featured_image_url TEXT;
    END IF;
    
    -- Add views_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'views_count'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add likes_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Clear existing sample blog posts
DELETE FROM blog_posts WHERE slug IN (
  'evolution-contemporary-african-art',
  'sculpting-stories-bronze-art',
  'evolution-african-contemporary-art',
  'art-from-waste-sustainability',
  'african-fashion-global-stage',
  'renaissance-contemporary-african-art',
  'traditional-crafts-modern-expression',
  'african-fashion-global-revolution',
  'digital-dreams-african-art-technology',
  'art-activism-social-change-africa',
  'guide-collecting-african-art'
);

-- Now create the blog articles
DO $$
DECLARE
    author_id UUID;
BEGIN
    -- Try to get an existing user with creator role
    SELECT id INTO author_id 
    FROM user_profiles 
    WHERE role = 'creator' 
    LIMIT 1;
    
    -- If no creator found, try any user
    IF author_id IS NULL THEN
        SELECT id INTO author_id 
        FROM user_profiles 
        LIMIT 1;
    END IF;
    
    -- Insert blog articles
    INSERT INTO blog_posts (
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        is_published,
        published_at,
        tags,
        author_id
    ) VALUES 

    -- Article 1: Contemporary African Art
    (
        'The Renaissance of Contemporary African Art: Breaking Boundaries and Redefining Identity',
        'renaissance-contemporary-african-art',
        'From Lagos to London, African artists are reshaping the global art landscape with bold expressions that challenge stereotypes and celebrate cultural heritage.',
        'The contemporary African art scene is experiencing an unprecedented renaissance. Artists across the continent are creating works that not only celebrate their rich cultural heritage but also address pressing global issues with a uniquely African perspective.

In cities like Lagos, Dakar, and Cape Town, art galleries are buzzing with energy as young artists experiment with mixed media, digital art, and traditional techniques. These creators are not just making art; they are making statements about identity, politics, and the future of Africa.

Take, for example, the work of emerging artists who blend traditional Yoruba symbols with contemporary urban themes, or sculptors who use recycled materials to comment on environmental issues while honoring ancestral craftsmanship techniques.

The global art market has taken notice. African art sales at international auctions have increased by over 300% in the past decade, with collectors worldwide recognizing the depth, sophistication, and relevance of contemporary African artistic expression.

What makes this movement particularly exciting is its diversity. From the abstract paintings that explore post-colonial identity to the digital installations that envision Africa''s technological future, contemporary African art refuses to be categorized or limited by external expectations.

This renaissance is not just about individual success stories; it represents a collective awakening of African creative consciousness that is reshaping how the world sees and understands African culture in the 21st century.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '2 days',
        ARRAY['contemporary art', 'african art', 'cultural identity', 'global market', 'renaissance'],
        author_id
    ),

    -- Article 2: Traditional Crafts
    (
        'Ancient Wisdom, Modern Expression: How Traditional African Crafts Are Inspiring Today''s Artists',
        'traditional-crafts-modern-expression',
        'Discover how contemporary African artists are breathing new life into ancient crafting techniques, creating a bridge between ancestral wisdom and modern artistic expression.',
        'The intricate beadwork of the Maasai, the bronze casting techniques of Benin, the textile traditions of Kente weaving – these are not just historical artifacts but living traditions that continue to inspire and inform contemporary African art.

Today''s artists are finding innovative ways to honor these traditional crafts while making them relevant to modern audiences. They are not simply copying ancient techniques but rather engaging in a dialogue between past and present, creating works that speak to both heritage and contemporary experience.

Consider the contemporary sculptors who have learned traditional bronze casting from master craftsmen in Nigeria, then applied these techniques to create modern pieces that address current social issues. Or the fashion designers who study traditional textile patterns and adapt them for contemporary clothing that can be worn in both Lagos and New York.

This approach represents more than just artistic innovation; it''s a form of cultural preservation and evolution. By incorporating traditional techniques into contemporary work, artists ensure that these ancient skills are not lost but rather transformed and passed on to new generations.

The process often involves deep research and collaboration with traditional craftspeople. Many contemporary artists spend months or even years learning from master artisans, understanding not just the technical aspects of the craft but also its cultural significance and spiritual dimensions.

What emerges from this fusion is art that is both deeply rooted and thoroughly contemporary – works that can speak to global audiences while maintaining their authentic African identity.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '5 days',
        ARRAY['traditional crafts', 'cultural preservation', 'modern art', 'heritage', 'innovation'],
        author_id
    ),

    -- Article 3: African Fashion
    (
        'Fashion Forward: How African Designers Are Revolutionizing Global Style',
        'african-fashion-global-revolution',
        'From Ankara prints on international runways to sustainable fashion innovations, African designers are leading a global style revolution that celebrates both tradition and innovation.',
        'The global fashion industry is experiencing an African awakening. From the runways of Paris Fashion Week to the streets of New York, African-inspired designs and African designers themselves are making an indelible mark on international style.

This revolution goes far beyond the appropriation of African prints by international brands. It''s about African designers taking control of their narrative, creating fashion that is authentically African while appealing to global markets.

Designers like those featured on our platform are creating pieces that tell stories – garments that carry the weight of history while looking boldly toward the future. They''re using traditional techniques like hand-weaving and natural dyeing, but applying them to contemporary silhouettes that work in both traditional and modern contexts.

Sustainability is a key component of this movement. Many African fashion designers have always worked with sustainable practices out of necessity and cultural tradition. Now, as the global fashion industry grapples with its environmental impact, these designers find themselves at the forefront of the sustainable fashion movement.

What''s particularly exciting is how these designers are creating economic opportunities in their home countries while building international brands. They''re proving that African fashion can compete on the global stage while maintaining its authentic identity and supporting local communities.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '7 days',
        ARRAY['african fashion', 'sustainable fashion', 'global style', 'cultural identity', 'innovation'],
        author_id
    );

END $$;

-- Verify the blog posts were created
SELECT 
    title,
    slug,
    author_id,
    published_at,
    is_published,
    array_length(tags, 1) as tag_count
FROM blog_posts 
WHERE is_published = true 
ORDER BY published_at DESC;