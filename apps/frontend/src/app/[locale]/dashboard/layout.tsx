import { AuthGuard } from '@/components/shared/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
