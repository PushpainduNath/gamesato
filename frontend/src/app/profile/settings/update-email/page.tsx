import { redirect } from 'next/navigation';

export default function UpdateEmailPage() {
  redirect('/profile?view=update-email');
}
