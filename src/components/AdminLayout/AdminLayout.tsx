import type { FC, ReactNode } from 'react'

export interface AdminLayoutProps {
  children: ReactNode
}

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  return <>{children}</>
}

export default AdminLayout
