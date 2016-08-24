SELECT
  workouts.name as workout_name,
  to_char(workouts.date, 'YYYY-MM-DD') as workout_date,
  workout_activities.comment,
  workout_activities.sets
FROM
  workouts,
  jsonb_to_recordset(workouts.activities) AS workout_activities(id uuid, comment text, sets jsonb)
WHERE
    workouts.user_id = ${user_id}
  AND
    workout_activities.id in (SELECT id FROM activities WHERE activity_id = ${id} or id = ${id})
