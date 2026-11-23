import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Stable Razorpay event ids, so a retried webhook is applied only once. */
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  eventId: text("event_id").primaryKey(),
  event: text("event").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
