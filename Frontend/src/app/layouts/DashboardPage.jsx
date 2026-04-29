import { Outlet } from 'react-router-dom'
import Sidebar from '../../shared/components/layout/Sidebar'
import Navbar from '../../shared/components/layout/Navbar'

const DashboardPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardPage