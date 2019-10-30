SELECT
  workouts.id,
  name,
  to_char(workouts.date, 'YYYY-MM-DD') as date,
  jsonb_array_length(workouts.activities) as activities
FROM workouts
WHERE user_id = ${user_id}
GROUP BY workouts.id
