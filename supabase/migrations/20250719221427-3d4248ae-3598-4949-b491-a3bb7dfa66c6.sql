-- Clear existing mock data
DELETE FROM chat_messages;
DELETE FROM chat_channels;

-- Create the actual channels that are being used in the UI
INSERT INTO chat_channels (name, description, type, is_admin_only, created_by) VALUES
('general', 'Academy-wide announcements and discussions', 'public', false, auth.uid()),
('beginners', 'Great progress in class today!', 'public', false, auth.uid()),
('admin-team', 'Staff meeting notes', 'private', true, auth.uid());

-- Enable realtime for chat messages
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE chat_messages;