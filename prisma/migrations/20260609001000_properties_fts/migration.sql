ALTER TABLE properties ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('arabic', coalesce(title_ar,'')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(description_ar,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(title_en,'')), 'C')
  ) STORED;

CREATE INDEX idx_properties_fts ON properties USING GIN(search_vector);
CREATE INDEX idx_properties_trgm ON properties USING GIN(title_ar gin_trgm_ops);
