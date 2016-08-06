SELECT
  activities.id,
  activities.activity_id,
  activities.name,
  aliases.name AS alias
FROM
  activities
LEFT JOIN
  activities AS aliases on activities.activity_id = aliases.id
WHERE
  activities.user_id = ${user_id}
  AND
  activities.name = ${name}
