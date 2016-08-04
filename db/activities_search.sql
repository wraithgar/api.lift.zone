SELECT
  id,
  activity_id,
  name,
  ts_rank(to_tsvector('english', name), ${name}) as rank
FROM activities
WHERE
  user_id = ${user_id}
  AND
  to_tsvector('english', name) @@ ${name}
ORDER BY rank DESC
LIMIT 5
