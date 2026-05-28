'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import { createApiClient } from '@/lib/api'
import type { User, TaskStatus, TaskPriority, CreateTaskPayload } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'

export default function NewTaskPage() {
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const api = createApiClient(session?.access_token ?? null)
        const res = await api.getUsers()
        setUsers(res.data)
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const api = createApiClient(session?.access_token ?? null)

      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        due_date: dueDate || null,
        assigned_to: assignedTo || null,
      }

      await api.createTask(payload)
      toast.success('Task created successfully!')
      router.push('/dashboard/tasks')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="task-detail-header">
        <div>
          <Link href="/dashboard/tasks" className="btn btn-ghost btn-sm">
            <ArrowLeft size={18} />
            Back to Tasks
          </Link>
          <h1 className="task-detail-title">Create New Task</h1>
        </div>
      </div>

      {/* Form */}
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Title */}
          <div className="input-group form-full">
            <label htmlFor="title" className="input-label">
              Title <span>*</span>
            </label>
            <input
              id="title"
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Enter task title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
              }}
            />
            {errors.title && (
              <span className="input-error-text">{errors.title}</span>
            )}
          </div>

          {/* Description */}
          <div className="input-group form-full">
            <label htmlFor="description" className="input-label">
              Description
            </label>
            <textarea
              id="description"
              className="input"
              placeholder="Describe the task in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Priority */}
          <div className="input-group">
            <label htmlFor="priority" className="input-label">
              Priority
            </label>
            <select
              id="priority"
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="input-group">
            <label htmlFor="status" className="input-label">
              Status
            </label>
            <select
              id="status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="input-group">
            <label htmlFor="dueDate" className="input-label">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Assign To */}
          <div className="input-group">
            <label htmlFor="assignedTo" className="input-label">
              Assign To
            </label>
            <select
              id="assignedTo"
              className="select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={loadingUsers}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Link href="/dashboard/tasks" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
