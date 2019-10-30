---
returns: one || none
---

SELECT
  workouts.*,
  users.name as user_name
FROM
  workouts
JOIN
  users ON users.id = workouts.user_id
WHERE
  workouts.id = ${id}
  AND (
    (
      users.preferences->>'visible' = 'true'
      AND
      workouts.visible IS NULL
    )
    OR workouts.visible = true
  )
