import { redirect } from 'next/navigation';

export default function NewsletterPage() {
  redirect('/admin/newsletter/issues');
}
