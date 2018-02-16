SELECT
  users.id,
  users.name,
  users.email,
  users.active,
  users.validated,
  (SELECT count(workouts.id)::integer from workouts where workouts.user_id = users.id) as workouts,
  (SELECT count(activities.id)::integer from activities where activities.user_id = users.id) as activities,
  (SELECT count(invites.token)::integer from invites where invites.user_id = users.id and invites.claimed_by is null) as invites,
  (SELECT max(workouts.created_at) from workouts where workouts.user_id = users.id) as last_workout
FROM users
