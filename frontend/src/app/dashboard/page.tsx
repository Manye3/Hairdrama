'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { createApiClient } from '@/lib/api'
import type { Task, TaskStats } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const api = createApiClient(session?.access_token ?? null)

        const tasksRes = await api.getTasks()
        const tasks = tasksRes.data || []

        // Compute stats locally from tasks
        const computedStats: TaskStats = {
          total: tasks.length,
          todo: tasks.filter(t => t.status === 'todo').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          in_review: tasks.filter(t => t.status === 'in_review').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
          overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
        }

        setStats(computedStats)
        setRecentTasks(tasks.slice(0, 5))
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats?.total ?? 0,
      icon: '📋',
    },
    {
      label: 'In Progress',
      value: stats?.in_progress ?? 0,
      icon: '🔄',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: '✅',
    },
    {
      label: 'Urgent',
      value: stats?.urgent ?? 0,
      icon: '🔥',
    },
  ]

  const getStatusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      todo: 'badge-todo',
      in_progress: 'badge-in-progress',
      in_review: 'badge-in-review',
      completed: 'badge-completed',
    }
    return map[status] || 'badge-todo'
  }

  const getPriorityBadgeClass = (priority: string) => {
    const map: Record<string, string> = {
      low: 'badge-low',
      medium: 'badge-medium',
      high: 'badge-high',
      urgent: 'badge-urgent',
    }
    return map[priority] || 'badge-low'
  }

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: 'var(--priority-low)',
      medium: 'var(--priority-medium)',
      high: 'var(--priority-high)',
      urgent: 'var(--priority-urgent)',
    }
    return map[priority] || 'var(--priority-low)'
  }

  return (
    <div className="page-content">
      <h1 className="main-header-title">Dashboard</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={card.label} className="stat-card stagger-item">
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="card-static">
        <div className="task-detail-header">
          <h2 className="main-header-title">Recent Tasks</h2>
          <Link href="/dashboard/tasks" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3 className="empty-state-title">No tasks yet</h3>
            <p className="empty-state-desc">
              Create your first task to get started with TaskFlow.
            </p>
            <Link href="/dashboard/tasks/new" className="btn btn-primary">
              Create Task
            </Link>
          </div>
        ) : (
          <div className="task-list">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="task-card stagger-item"
              >
                <div
                  className="task-card-priority"
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                />
                <div className="task-card-content">
                  <div className="task-card-header">
                    <span className="task-card-title">{task.title}</span>
                    <div className="task-card-badges">
                      <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="task-card-desc">{task.description}</p>
                  )}
                  <div className="task-card-meta">
                    {task.assignee && (
                      <div className="task-card-meta-item">
                        <div className="avatar avatar-sm avatar-placeholder">
                          {(task.assignee.full_name || task.assignee.email)[0].toUpperCase()}
                        </div>
                        <span>{task.assignee.full_name || task.assignee.email}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className="task-card-meta-item">
                        📅 {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
