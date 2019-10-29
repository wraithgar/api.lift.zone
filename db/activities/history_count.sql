---
returns: one
---

SELECT
  count(workouts.id)::integer as count
FROM
  workouts,
  jsonb_to_recordset(workouts.activities) AS workout_activities(id uuid, comment text, sets jsonb)
WHERE
    workouts.user_id = ${user_id}
  AND (
    workout_activities.id = ${id}
    OR
    workout_activities.id in (
      SELECT id
      FROM activities
      WHERE activity_id = ${id}
    )
  )
