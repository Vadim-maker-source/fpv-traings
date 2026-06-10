import Topbar from '@/components/Topbar'
import React from 'react'

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <div><Topbar /></div>
      {children}
    </div>
  )
}

export default RootLayout