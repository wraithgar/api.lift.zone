SELECT
  id,
  CASE WHEN activity_id IS NULL THEN id
  ELSE activity_id
  END as activity_id,
  name,
  1 - ts_rank(to_tsvector('english', name), to_tsquery(${name})) as rank
FROM activities
WHERE
  user_id = ${user_id}
  AND
  to_tsvector('english', name) @@ to_tsquery(${name})
ORDER BY rank DESC
LIMIT 5
