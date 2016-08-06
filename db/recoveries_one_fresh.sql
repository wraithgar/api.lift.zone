SELECT *
FROM recoveries
WHERE
  email = ${email}
  AND
  created_at > now() - interval '3 hours'
