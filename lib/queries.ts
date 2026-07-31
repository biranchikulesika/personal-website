'use server';

import { cache } from 'react';
import { PostService } from '@/lib/services/post.service';
import { FragmentService } from '@/lib/services/fragment.service';
import { JournalMomentService } from '@/lib/services/journalMoment.service';
import { BookService } from '@/lib/services/book.service';
import { BuilderStatusService } from '@/lib/services/builderStatus.service';
import { ActiveSystemService } from '@/lib/services/activeSystem.service';
import { BuildLogService } from '@/lib/services/buildLog.service';
import { RedistributionRecordService } from '@/lib/services/redistributionRecord.service';
import { NewsletterProfileService } from '@/lib/services/newsletterProfile.service';
import { NewsletterIssueService } from '@/lib/services/newsletterIssue.service';
import { QuestionService } from '@/lib/services/question.service';
import { ThoughtFragmentService } from '@/lib/services/thoughtFragment.service';
import { OperatorFocusService } from '@/lib/services/operatorFocus.service';
import { DonationService } from '@/lib/services/donation.service';

const safeArray = async (fn: () => Promise<any>) => { try { return await fn() || []; } catch (e) { console.error("Query failed", e); return []; } };
const safeSingle = async (fn: () => Promise<any>) => { try { return await fn() || null; } catch (e) { console.error("Query failed", e); return null; } };

// All exported query functions are wrapped in React.cache() to deduplicate 
// identical requests within the same server-side render pass.
// This prevents double-fetching when e.g. generateMetadata and the page component both call the same query function.
export const getPosts = cache(async (searchQuery?: string) => safeArray(() => new PostService().getAll(searchQuery)));
export const getPostsMeta = cache(async (searchQuery?: string) => safeArray(() => new PostService().getAllMeta(searchQuery)));
export const getPostBySlug = cache(async (slug: string, persona?: string) => safeSingle(() => new PostService().getBySlug(slug, persona)));
export const getFragments = cache(async () => safeArray(() => new FragmentService().getAll()));
export const getJournalMoments = cache(async () => safeArray(() => new JournalMomentService().getAll()));
export const getBooks = cache(async () => safeArray(() => new BookService().getAll()));
export const getBuilderStatuss = cache(async () => safeArray(() => new BuilderStatusService().getAll()));
export const getActiveSystems = cache(async () => safeArray(() => new ActiveSystemService().getAll()));
export const getBuildLogs = cache(async () => safeArray(() => new BuildLogService().getAll()));
export const getRedistributionRecords = cache(async () => safeArray(() => new RedistributionRecordService().getAll()));
export const getNewsletterProfiles = cache(async () => safeArray(() => new NewsletterProfileService().getAll()));
export const getNewsletterIssues = cache(async () => safeArray(() => new NewsletterIssueService().getAll()));
export const getQuestions = cache(async () => safeArray(() => new QuestionService().getAll()));
export const getThoughtFragments = cache(async () => safeArray(() => new ThoughtFragmentService().getAll()));
export const getOperatorFocuss = cache(async () => safeArray(() => new OperatorFocusService().getAll()));
export const getDonations = cache(async () => safeArray(() => new DonationService().getAll()));
