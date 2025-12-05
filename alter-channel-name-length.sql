-- Increase the name column size to handle longer channel names
ALTER TABLE channels_v2 
ALTER COLUMN name TYPE VARCHAR(1000);

-- Also increase URL column for very long URLs
ALTER TABLE channels_v2 
ALTER COLUMN url TYPE VARCHAR(2000);