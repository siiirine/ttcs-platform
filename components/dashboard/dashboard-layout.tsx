'use client'

import { Sidebar } from './sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      transition: 'background 0.3s ease',
    }}>
      <Sidebar />
      <main style={{ paddingLeft: '260px' }}>
        {children}
      </main>
    </div>
  )
}