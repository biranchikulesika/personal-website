-- Remove the remaining public (anonymous) write policy. subscribeNewsletter now
-- uses the admin client, and all other writes to "subscribers" go through
-- authenticated admin actions, so this policy was an unused spam vector.
-- After this, anonymous users have zero write access across the public schema.

DROP POLICY IF EXISTS "Public can subscribe" ON "public"."subscribers";