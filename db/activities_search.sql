SELECT
  CASE WHEN activity_id IS NULL THEN id
      ELSE activity_id
  END as id,
  name,
  ts_rank(to_tsvector('english', name), ${name}) as rank
FROM activities
WHERE
  user_id = ${user_id}
  AND
  to_tsvector('english', name) @@ ${name}
ORDER BY rank DESC
LIMIT 5
