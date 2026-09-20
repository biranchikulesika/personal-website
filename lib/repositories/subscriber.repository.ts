import type { NewsletterSubscriber } from "@/lib/types";

export interface SubscriberRepository {
  addSubscriber(email: string, source?: string): Promise<NewsletterSubscriber>;
  getSubscribers(): Promise<NewsletterSubscriber[]>;
  deleteSubscriber(id: string): Promise<boolean>;
}
