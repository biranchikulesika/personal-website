import { repositoryRegistry } from '../repositories/registry';

class SubscriptionService {
  private get repo() {
    return (repositoryRegistry as any).getSubscriptionRepository();
  }

  async getAll() {
    return await this.repo.getAll();
  }

  async getById(id: string) {
    return await this.repo.getById(id);
  }

  async create(data: any) {
    return await this.repo.create(data);
  }

  async update(id: string, data: any) {
    return await this.repo.update(id, data);
  }

  async delete(id: string) {
    return await this.repo.delete(id);
  }
}

export const subscriptionService = new SubscriptionService();
