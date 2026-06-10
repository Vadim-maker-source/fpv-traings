import { getCurrentUser } from '@/app/lib/api/user';
import { redirect } from 'next/navigation';
import React from 'react'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
        redirect("/");
    }
    
  return (
    <div>{children}</div>
  )
}

export default AdminLayout