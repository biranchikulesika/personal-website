import { Donation } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';
import { getRazorpay } from '../razorpay';

export class DonationService {
  private repository: IRepository<Donation>;

  constructor() {
    this.repository = repositoryRegistry.getDonationRepository();
  }

  async getAll(): Promise<Donation[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get donations:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<Donation | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get donation:", error);
      throw error;
    }
  }

  async create(data: Omit<Donation, "id">): Promise<Donation | null> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create donation:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Donation>): Promise<Donation | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update donation:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete donation:", error);
      throw error;
    }
  }

  async deleteExpiredPending(olderThanDays = 30): Promise<number> {
    try {
      if ('deleteExpiredPending' in this.repository) {
        return await (this.repository as any).deleteExpiredPending(olderThanDays);
      }
      return 0;
    } catch (error) {
      console.error("Failed to delete expired pending donations:", error);
      throw error;
    }
  }

  async reconcileExpiredPending(olderThanDays = 30): Promise<{ deleted: number; saved: number }> {
    const repo = this.repository as any;
    if (!repo.listExpiredPending) return { deleted: 0, saved: 0 };

    const expired = await repo.listExpiredPending(olderThanDays);

    let deleted = 0;
    let saved = 0;

    for (const donation of expired) {
      const result = await checkRazorpayPaid(donation.razorpayOrderId);

      if (result.paid) {
        try {
          await repo.update(donation.id, {
            status: 'success',
            razorpayPaymentId: result.paymentId || donation.razorpayPaymentId,
          });
          saved++;
        } catch (error) {
          console.error("Failed to reconcile paid donation:", donation.id, error);
        }
      } else {
        try {
          await repo.delete(donation.id);
          deleted++;
        } catch (error) {
          console.error("Failed to delete expired donation:", donation.id, error);
        }
      }
    }

    return { deleted, saved };
  }
}

async function checkRazorpayPaid(orderId?: string | null): Promise<{ paid: boolean; paymentId?: string }> {
  if (!orderId) return { paid: false };

  try {
    const razorpay = getRazorpay();
    const order: any = await razorpay.orders.fetch(orderId);

    if (order?.status === 'paid') {
      return { paid: true };
    }

    if (order?.status === 'attempted') {
      const payments: any = await razorpay.payments.all({ order_id: orderId } as any);
      const captured = (payments?.items || []).find((p: any) => p.status === 'captured');
      if (captured) {
        return { paid: true, paymentId: captured.id };
      }
    }

    return { paid: false };
  } catch (error) {
    console.warn(`Razorpay reconciliation check failed for order ${orderId}:`, error);
    return { paid: false };
  }
}
