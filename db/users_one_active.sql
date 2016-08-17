SELECT
  users.id,
  users.name,
  users.hash,
  users.email,
  users.logout,
  users.validated,
  users.scope,
  users.preferences
FROM users WHERE
  users.active = TRUE AND
  users.email=$1;
