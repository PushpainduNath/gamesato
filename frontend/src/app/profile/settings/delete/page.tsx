import { redirect } from 'next/navigation';

export default function DeleteAccountPage() {
  redirect('/profile?view=delete');
}
