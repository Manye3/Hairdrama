'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Calendar, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { createApiClient } from '@/lib/api'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { format } from 'date-fns'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const api = createApiClient(session?.access_token ?? null)

      const params: { status?: string; priority?: string; search?: string } = {}
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (search) params.search = search

      const res = await api.getTasks(params)
      setTasks(res.data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, priorityFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

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
      {/* Header */}
      <div className="task-detail-header">
        <h1 className="main-header-title">Tasks</h1>
        <Link href="/dashboard/tasks/new" className="btn btn-primary">
          <Plus size={18} />
          New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="task-filters">
        <div className="task-search">
          <span className="task-search-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="input"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-desc">
            {search || statusFilter || priorityFilter
              ? 'Try adjusting your filters to find what you\'re looking for.'
              : 'Get started by creating your first task.'}
          </p>
          {!search && !statusFilter && !priorityFilter && (
            <Link href="/dashboard/tasks/new" className="btn btn-primary">
              <Plus size={18} />
              Create Task
            </Link>
          )}
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
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
                      <Calendar size={14} />
                      <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {!task.assignee && !task.due_date && (
                    <div className="task-card-meta-item">
                      <User size={14} />
                      <span>Unassigned</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
