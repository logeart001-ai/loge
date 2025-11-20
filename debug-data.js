const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sfwopulinzmpupmgaqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd29wdWxpbnptcHVwbWdhcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTAzMDgsImV4cCI6MjA3MDA2NjMwOH0.9kpebBsah9IkpW0i3wki0HmFXGhAvzwM1J1xc9GkFqU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Checking featured artworks...');
  
  const { data: featured, error: featuredError } = await supabase
    .from('artworks')
    .select('id, title, thumbnail_url, image_urls, is_featured, is_available')
    .eq('is_featured', true)
    .eq('is_available', true)
    .limit(5);

  if (featuredError) {
    console.error('Error fetching featured:', featuredError);
  } else {
    console.log(`Found ${featured.length} featured artworks:`);
    featured.forEach(art => {
      console.log(`- ${art.title}: thumb=${art.thumbnail_url}, images=${JSON.stringify(art.image_urls)}`);
    });
  }

  console.log('\nChecking any available artworks (fallback)...');
  const { data: available, error: availableError } = await supabase
    .from('artworks')
    .select('id, title, thumbnail_url, image_urls')
    .eq('is_available', true)
    .limit(5);

  if (availableError) {
    console.error('Error fetching available:', availableError);
  } else {
    console.log(`Found ${available.length} available artworks:`);
    available.forEach(art => {
      console.log(`- ${art.title}: thumb=${art.thumbnail_url}, images=${JSON.stringify(art.image_urls)}`);
    });
  }
}

checkData();
