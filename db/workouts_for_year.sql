SELECT *
FROM WORKOUTS
WHERE date_part('year', date) = ${year}
AND user_id = ${user_id}
