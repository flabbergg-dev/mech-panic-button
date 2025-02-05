import { Chat } from '@/components/Chat/Chat'
import { DashboardLayout } from '@/components/layouts/dashboard.layout'
import React from 'react'

interface layoutProps {
    children: React.ReactNode
}

export default function PageLayout({children}: layoutProps) {
  return (
    <DashboardLayout>
        {children}
        <Chat />
    </DashboardLayout>
  )
}
