-- First, let's make sure the events table exists and insert sample events
INSERT INTO public.events (title, description, event_type, event_date, location, is_featured) 
VALUES
('Artist Talk: Contemporary African Literature', 'Join us for an inspiring conversation about modern African storytelling and the voices shaping literature today.', 'virtual', '2024-11-15 18:00:00+00', 'Virtual Event', true),
('Fashion Show: Lagos Design Week', 'Showcase of the latest African fashion designs featuring emerging and established designers from across the continent.', 'in_person', '2024-12-03 19:00:00+00', 'Lagos, Nigeria', true),
('Book Launch: Whispers of the Savannah', 'Celebrate the launch of this captivating novel exploring family secrets across generations in Mali.', 'virtual', '2024-12-22 16:00:00+00', 'Virtual Event', true),
('Art Exhibition: Digital Africa', 'A virtual gallery showcasing contemporary digital art from African creators around the world.', 'virtual', '2024-11-28 14:00:00+00', 'Virtual Event', false),
('Fashion Workshop: Traditional Textiles', 'Learn about traditional African textile techniques and their modern applications in fashion design.', 'in_person', '2024-12-10 10:00:00+00', 'Accra, Ghana', false),
('Poetry Reading: Voices of the Diaspora', 'An evening of poetry celebrating African voices across the diaspora.', 'hybrid', '2024-12-05 19:30:00+00', 'Cape Town, South Africa', false);

-- Verify the data was inserted
SELECT COUNT(*) as event_count FROM public.events;
SELECT title, event_type, event_date FROM public.events ORDER BY event_date;
