SELECT id, name, to_char(date, 'YYYY-MM-DD') as date
FROM WORKOUTS
WHERE user_id = ${user_id}

