import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  redirect('/admin/games');
  return null;
}
