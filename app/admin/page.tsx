import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminGuard } from '@/components/admin/admin-guard'

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>
  )
}