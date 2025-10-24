-- Add more high-quality blog articles
-- Run this in your Supabase SQL editor

DO $$
DECLARE
    author_id UUID;
BEGIN
    -- Get an existing user as author
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
    
    -- Insert additional blog articles
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

    -- Article 4: Digital Art Revolution
    (
        'Digital Dreams: How Technology is Transforming African Art',
        'digital-dreams-african-art-technology',
        'From NFTs to virtual galleries, African artists are embracing digital technologies to reach global audiences and create entirely new forms of artistic expression.',
        'The digital revolution has opened unprecedented opportunities for African artists to showcase their work to global audiences. Through social media platforms, online galleries, and digital marketplaces, creators across the continent are breaking down traditional barriers and connecting directly with collectors worldwide.

Virtual reality installations are allowing artists to create immersive experiences that transport viewers into African landscapes and cultural narratives. Digital artists are experimenting with AI-generated art, creating pieces that blend traditional African motifs with cutting-edge technology.

The rise of NFTs has provided new revenue streams for artists, with several African creators achieving significant success in the digital art market. These platforms have democratized art collection, making it possible for people worldwide to own and trade African digital art.

Online art education platforms are also flourishing, with master artists sharing their techniques through video tutorials and virtual workshops. This knowledge transfer is preserving traditional techniques while adapting them for digital mediums.

The COVID-19 pandemic accelerated this digital transformation, forcing galleries and artists to pivot to online platforms. What started as a necessity has become a permanent expansion of the African art ecosystem, creating hybrid models that combine physical and digital experiences.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '10 days',
        ARRAY['digital art', 'technology', 'NFTs', 'virtual reality', 'online galleries', 'african art'],
        author_id
    ),

    -- Article 5: Art as Activism
    (
        'Art as Activism: How African Creators Are Driving Social Change',
        'art-activism-social-change-africa',
        'Across the continent, artists are using their platforms to address social issues, challenge injustices, and inspire positive change in their communities.',
        'African art has always been deeply connected to social and political commentary, and today''s artists continue this tradition with powerful works that address contemporary challenges. From climate change to social inequality, artists are using their creativity to spark important conversations.

Street art and murals have become powerful tools for community engagement, with artists creating large-scale works that address local issues while beautifying urban spaces. These public artworks serve as catalysts for community dialogue and social awareness.

Performance art is being used to highlight issues such as gender equality, youth empowerment, and environmental conservation. Artists are collaborating with NGOs and community organizations to create impactful campaigns that reach beyond traditional art audiences.

Photography projects are documenting social changes and preserving cultural heritage, creating visual narratives that tell the stories of African communities. These projects often involve community participation, empowering local voices and perspectives.

The intersection of art and activism is creating new funding models, with social impact investors and international organizations supporting artists whose work addresses pressing social issues. This support is enabling artists to create larger-scale projects with measurable community impact.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '12 days',
        ARRAY['activism', 'social change', 'community art', 'street art', 'photography', 'social impact'],
        author_id
    ),

    -- Article 6: Collecting African Art
    (
        'The Collector''s Guide: Building Your African Art Collection',
        'guide-collecting-african-art',
        'Whether you''re a seasoned collector or just starting out, this comprehensive guide will help you navigate the exciting world of African art collecting.',
        'Building an African art collection is both a passion and an investment opportunity. The key to successful collecting lies in understanding the market, developing relationships with artists and galleries, and staying true to your personal aesthetic preferences.

Start by educating yourself about different artistic movements, techniques, and regional styles. Visit galleries, attend art fairs, and engage with online platforms to develop your eye and understanding of quality and authenticity.

Consider your budget and collecting goals. Are you interested in supporting emerging artists, or do you prefer established names? Do you want to focus on a particular medium, region, or theme? Having clear objectives will guide your purchasing decisions.

Building relationships with reputable galleries, dealers, and artists is crucial. These connections provide access to new works, market insights, and authentication services. Many collectors also join art societies and attend collector events to network and learn.

Proper care and documentation of your collection is essential. This includes professional framing, climate-controlled storage, insurance coverage, and maintaining detailed provenance records. These practices protect your investment and preserve the artworks for future generations.

Consider the impact of your collecting. By purchasing directly from artists or supporting galleries that work closely with creators, you contribute to the sustainability of the African art ecosystem and help artists build sustainable careers.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '15 days',
        ARRAY['art collecting', 'investment', 'galleries', 'emerging artists', 'art market', 'provenance'],
        author_id
    ),

    -- Article 7: Sustainable Art Practices
    (
        'Green Creativity: Sustainable Practices in African Art',
        'sustainable-practices-african-art',
        'Environmental consciousness is shaping how African artists create, with many embracing eco-friendly materials and practices that honor both creativity and conservation.',
        'Sustainability has become a central concern for many African artists, who are finding innovative ways to create beautiful works while minimizing environmental impact. This movement reflects both global environmental awareness and traditional African values of living in harmony with nature.

Many artists are turning to locally sourced, natural materials such as clay, plant dyes, recycled metals, and organic fibers. These materials not only reduce environmental impact but also connect the artwork to its geographic and cultural origins.

Upcycling and repurposing have become popular techniques, with artists transforming waste materials into stunning artworks. Plastic bottles become sculptural elements, old textiles are rewoven into new patterns, and discarded electronics are incorporated into mixed-media pieces.

Traditional techniques are being rediscovered and celebrated for their inherent sustainability. Natural dyeing processes, traditional pottery methods, and indigenous weaving techniques require minimal energy and produce no toxic waste.

Artists are also considering the lifecycle of their works, designing pieces that can be easily recycled or that will biodegrade naturally over time. This approach challenges traditional notions of permanence in art while creating new aesthetic possibilities.

The sustainable art movement is supported by galleries and collectors who prioritize environmental responsibility. This market demand is encouraging more artists to adopt sustainable practices and is creating new opportunities for eco-conscious creators.',
        '/image/Blog Post Featured Images.png',
        true,
        NOW() - INTERVAL '18 days',
        ARRAY['sustainability', 'eco-friendly', 'natural materials', 'upcycling', 'traditional techniques', 'environmental art'],
        author_id
    );

END $$;

-- Verify the new articles were created
SELECT 
    title,
    slug,
    published_at,
    array_length(tags, 1) as tag_count
FROM blog_posts 
WHERE is_published = true 
ORDER BY published_at DESC;