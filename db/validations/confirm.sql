---
returns: one || none
---

SELECT *
FROM validations
WHERE
  user_id = ${user_id}
  AND
  token = ${token}
  AND
  created_at > now() - interval '1 day'
