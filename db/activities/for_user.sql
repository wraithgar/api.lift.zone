SELECT
  activities.*,
  CASE WHEN count(aliases) = 0 THEN '[]'::json ELSE json_agg(aliases) END AS aliases
FROM
  activities
LEFT JOIN
  activities AS aliases on activities.id = aliases.activity_id
WHERE
  activities.user_id = ${id}
  AND
  activities.activity_id is null
GROUP BY activities.id
ORDER BY activities.name
LIMIT ${limit}
OFFSET ${page}
