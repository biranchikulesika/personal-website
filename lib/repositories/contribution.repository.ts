import type { Contribution } from "@/lib/types";

export interface ContributionRepository {
  recordContribution(contribution: Contribution): Promise<Contribution>;
  getContribution(id: string): Promise<Contribution | null>;
  getContributions(): Promise<Contribution[]>;
}
