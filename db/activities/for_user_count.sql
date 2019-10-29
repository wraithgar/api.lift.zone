---
returns: one
---

SELECT
  count(activities.id)::integer as count
FROM
  activities
WHERE
  activities.user_id = ${id}
  AND
  activities.activity_id is null
