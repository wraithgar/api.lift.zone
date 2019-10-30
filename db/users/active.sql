---
returns: one || none
---

SELECT
  users.id,
  users.name,
  users.email,
  users.logout,
  users.validated,
  users.scope,
  users.preferences
FROM users WHERE
  users.active = TRUE AND
  lower(users.email)=lower($1);
