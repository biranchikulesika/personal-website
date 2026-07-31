export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

import { PostSupabaseRepository } from './post.repository.supabase';
import { FieldNoteSupabaseRepository } from './fieldNote.repository.supabase';
import { ThoughtFragmentSupabaseRepository } from './thoughtFragment.repository.supabase';
import { QuestionSupabaseRepository } from './question.repository.supabase';
import { JournalMomentSupabaseRepository } from './journalMoment.repository.supabase';
import { FragmentSupabaseRepository } from './fragment.repository.supabase';
import { BuilderStatusSupabaseRepository } from './builderStatus.repository.supabase';
import { ActiveSystemSupabaseRepository } from './activeSystem.repository.supabase';
import { BuildLogSupabaseRepository } from './buildLog.repository.supabase';
import { OperatorFocusSupabaseRepository } from './operatorFocus.repository.supabase';
import { RedistributionRecordSupabaseRepository } from './redistributionRecord.repository.supabase';
import { NewsletterIssueSupabaseRepository } from './newsletterIssue.repository.supabase';
import { NewsletterProfileSupabaseRepository } from './newsletterProfile.repository.supabase';
import { BookSupabaseRepository } from './book.repository.supabase';
import { SubscriberSupabaseRepository } from './subscriber.repository.supabase';
import { SubscriptionSupabaseRepository } from './subscription.repository.supabase';
import { DonationSupabaseRepository } from './donation.repository.supabase';

export class RepositoryRegistry {
  private static instance: RepositoryRegistry;

  private constructor() {}

  public static getInstance(): RepositoryRegistry {
    if (!RepositoryRegistry.instance) {
      RepositoryRegistry.instance = new RepositoryRegistry();
    }
    return RepositoryRegistry.instance;
  }

  getPostRepository(): IRepository<any> & { getBySlug: (slug: string) => Promise<any> } { return new PostSupabaseRepository() as any; }
  getFieldNoteRepository(): IRepository<any> { return new FieldNoteSupabaseRepository(); }
  getThoughtFragmentRepository(): IRepository<any> { return new ThoughtFragmentSupabaseRepository(); }
  getQuestionRepository(): IRepository<any> { return new QuestionSupabaseRepository(); }
  getJournalMomentRepository(): IRepository<any> { return new JournalMomentSupabaseRepository(); }
  getFragmentRepository(): IRepository<any> { return new FragmentSupabaseRepository(); }
  getBuilderStatusRepository(): IRepository<any> { return new BuilderStatusSupabaseRepository(); }
  getActiveSystemRepository(): IRepository<any> { return new ActiveSystemSupabaseRepository(); }
  getBuildLogRepository(): IRepository<any> { return new BuildLogSupabaseRepository(); }
  getOperatorFocusRepository(): IRepository<any> { return new OperatorFocusSupabaseRepository(); }
  getRedistributionRecordRepository(): IRepository<any> { return new RedistributionRecordSupabaseRepository(); }
  getNewsletterIssueRepository(): IRepository<any> { return new NewsletterIssueSupabaseRepository(); }
  getNewsletterProfileRepository(): IRepository<any> { return new NewsletterProfileSupabaseRepository(); }
  getBookRepository(): IRepository<any> { return new BookSupabaseRepository() as any; }
  getSubscriberRepository(): IRepository<any> { return new SubscriberSupabaseRepository() as any; }
  getSubscriptionRepository(): IRepository<any> { return new SubscriptionSupabaseRepository() as any; }
  getDonationRepository(): IRepository<any> { return new DonationSupabaseRepository() as any; }
}

export const repositoryRegistry = RepositoryRegistry.getInstance();

