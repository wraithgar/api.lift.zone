---
returns: one || none
---

SELECT *
FROM validations
WHERE
  user_id = ${user_id}
  AND
  created_at > now() - interval '15 minutes'
