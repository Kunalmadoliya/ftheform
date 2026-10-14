UPDATE "form"
SET "form_url" = regexp_replace(
  split_part(split_part("form_url", '?', 1), '#', 1),
  '^.*/form/',
  ''
)
WHERE "form_url" ~* '^https?://[^/]+/form/';