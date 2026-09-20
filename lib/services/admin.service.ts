import { getContentRepository } from "@/lib/repositories";
import type { UserRoleRepository } from "@/lib/repositories/user-role.repository";
import type { SubscriberRepository } from "@/lib/repositories/subscriber.repository";
import type { AppRole, UserRole, NewsletterSubscriber } from "@/lib/types";

export class AdminService {
  constructor(
    private roleRepo: UserRoleRepository = getContentRepository(),
    private subscriberRepo: SubscriberRepository = getContentRepository(),
  ) {}

  getUserRole(userId: string): Promise<AppRole | null> {
    return this.roleRepo.getUserRole(userId);
  }

  setUserRole(userId: string, role: AppRole): Promise<void> {
    return this.roleRepo.setUserRole(userId, role);
  }

  getAllUserRoles(): Promise<UserRole[]> {
    return this.roleRepo.getAllUserRoles();
  }

  getSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.subscriberRepo.getSubscribers();
  }

  deleteSubscriber(id: string): Promise<boolean> {
    return this.subscriberRepo.deleteSubscriber(id);
  }
}
