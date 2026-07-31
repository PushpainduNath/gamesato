import React from 'react';
import AdminsManager from '@/components/AdminsManager';

export const dynamic = 'force-dynamic';

export default function AdminsPage() {
  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, height: '100%' }}>
      <AdminsManager />
    </div>
  );
}
