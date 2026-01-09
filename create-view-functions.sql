-- Function to get total views for a creator's artworks
CREATE OR REPLACE FUNCTION get_creator_total_views(creator_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_views INTEGER;
BEGIN
  SELECT COALESCE(SUM(avc.total_views), 0)::INTEGER
  INTO total_views
  FROM artwork_view_counts avc
  INNER JOIN artworks a ON a.id = avc.artwork_id
  WHERE a.creator_id = creator_user_id;
  
  RETURN total_views;
END;
$$;

-- Function to get view stats for a specific artwork
CREATE OR REPLACE FUNCTION get_artwork_view_stats(artwork_uuid UUID)
RETURNS TABLE (
  total_views BIGINT,
  unique_users BIGINT,
  views_today BIGINT,
  views_this_week BIGINT,
  views_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(avc.total_views, 0) as total_views,
    COALESCE(avc.unique_users, 0) as unique_users,
    (SELECT COUNT(*) FROM artwork_views 
     WHERE artwork_id = artwork_uuid 
     AND viewed_at >= CURRENT_DATE)::BIGINT as views_today,
    (SELECT COUNT(*) FROM artwork_views 
     WHERE artwork_id = artwork_uuid 
     AND viewed_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as views_this_week,
    (SELECT COUNT(*) FROM artwork_views 
     WHERE artwork_id = artwork_uuid 
     AND viewed_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as views_this_month
  FROM artwork_view_counts avc
  WHERE avc.artwork_id = artwork_uuid;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_creator_total_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_artwork_view_stats(UUID) TO authenticated, anon;

COMMENT ON FUNCTION get_creator_total_views IS 'Get total views across all artworks for a creator';
COMMENT ON FUNCTION get_artwork_view_stats IS 'Get detailed view statistics for a specific artwork';
