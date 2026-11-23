import type { Contribution } from "@/lib/types";

export interface ContributionRepository {
  recordContribution(contribution: Contribution): Promise<Contribution>;
  getContribution(id: string): Promise<Contribution | null>;
  getContributions(): Promise<Contribution[]>;
  hasWebhookEvent(eventId: string): Promise<boolean>;
  recordWebhookEvent(eventId: string, event: string): Promise<boolean>;
}
