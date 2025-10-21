'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Users,
  Flag,
  BarChart3,
  Shield
} from 'lucide-react'
import { AdminDashboard } from './admin-dashboard'
import { UserManagement } from './user-management'
import { ContentModeration } from './content-moderation'
import { AnalyticsDashboard } from './analytics-dashboard'

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      component: AdminDashboard,
      description: 'Review submissions and manage content'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: AnalyticsDashboard,
      description: 'Platform performance and insights'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      component: UserManagement,
      description: 'Manage user accounts and permissions'
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: Flag,
      component: ContentModeration,
      description: 'Review reported content'
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-600">{activeTabData?.label}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="sr-only">Toggle navigation menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage your platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <Shield className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          lg:min-h-screen
        `}>
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false) // Close mobile sidebar after selection
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 lg:ml-0">
          {tabs.map((tab) => {
            const Component = tab.component
            return (
              <div
                key={tab.id}
                className={activeTab === tab.id ? 'block' : 'hidden'}
              >
                <Component />
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}