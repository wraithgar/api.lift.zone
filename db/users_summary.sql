SELECT
  users.*,
  count(workouts.id)::integer as workouts,
  count(activities.id)::integer as activities
FROM users
LEFT JOIN workouts on workouts.user_id = users.id
LEFT JOIN activities on activities.user_id = users.id
GROUP BY users.id
