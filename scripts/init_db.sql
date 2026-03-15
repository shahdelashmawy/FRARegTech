-- Initialize PostgreSQL database with required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Full text search configuration for Arabic
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS arabic (COPY = simple);
