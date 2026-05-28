'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Save,
  X,
  Calendar,
  User as UserIcon,
  Clock,
  Flag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { createClient } from '@/utils/supabase/client'
import { createApiClient } from '@/lib/api'
import type { Task, User, TaskStatus, TaskPriority, UpdateTaskPayload } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo')
  const [editDueDate, setEditDueDate] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')

  const getApiClient = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return createApiClient(session?.access_token ?? null)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = await getApiClient()

        const [taskRes, usersRes] = await Promise.all([
          api.getTask(taskId),
          api.getUsers(),
        ])

        setTask(taskRes.data)
        setUsers(usersRes.data)
        populateEditForm(taskRes.data)
      } catch (err) {
        console.error('Failed to fetch task:', err)
        toast.error('Failed to load task')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const populateEditForm = (t: Task) => {
    setEditTitle(t.title)
    setEditDescription(t.description || '')
    setEditPriority(t.priority)
    setEditStatus(t.status)
    setEditDueDate(t.due_date ? t.due_date.split('T')[0] : '')
    setEditAssignedTo(t.assigned_to || '')
  }

  const handleStartEdit = () => {
    if (task) populateEditForm(task)
    setEditing(true)
  }

  const handleCancelEdit = () => {
    if (task) populateEditForm(task)
    setEditing(false)
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      const api = await getApiClient()

      const payload: UpdateTaskPayload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        status: editStatus,
        due_date: editDueDate || null,
        assigned_to: editAssignedTo || null,
      }

      const res = await api.updateTask(taskId, payload)
      setTask(res.data)
      setEditing(false)
      toast.success('Task updated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      const api = await getApiClient()
      const res = await api.updateTaskStatus(taskId, newStatus)
      setTask(res.data)
      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const api = await getApiClient()
      await api.deleteTask(taskId)
      toast.success('Task deleted successfully!')
      router.push('/dashboard/tasks')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      toast.error(message)
      setDeleting(false)
    }
  }

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

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3 className="empty-state-title">Task not found</h3>
          <p className="empty-state-desc">
            The task you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Link href="/dashboard/tasks" className="btn btn-primary">
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Back button */}
      <Link href="/dashboard/tasks" className="btn btn-ghost btn-sm">
        <ArrowLeft size={18} />
        Back to Tasks
      </Link>

      {/* Header */}
      <div className="task-detail-header">
        <div>
          {editing ? (
            <input
              type="text"
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title"
            />
          ) : (
            <h1 className="task-detail-title">{task.title}</h1>
          )}
          {!editing && (
            <div className="task-card-badges">
              <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                {STATUS_LABELS[task.status]}
              </span>
              <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>
          )}
        </div>

        <div className="task-detail-actions">
          {editing ? (
            <>
              <button
                className="btn btn-ghost"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X size={18} />
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleStartEdit}>
                <Edit3 size={18} />
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={18} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="task-detail-body">
        {/* Main content */}
        <div className="task-detail-main">
          {/* Description */}
          <div className="card-static">
            <div className="task-detail-field-label">Description</div>
            {editing ? (
              <textarea
                className="input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                rows={6}
              />
            ) : (
              <div className="task-detail-field-value">
                {task.description || (
                  <span className="task-card-desc">No description provided.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="task-detail-sidebar">
          {/* Status */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <Clock size={14} /> Status
            </div>
            {editing ? (
              <select
                className="select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              >
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            ) : (
              <div className="task-detail-field-value">
                <select
                  className="select"
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as TaskStatus)
                  }
                >
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <Flag size={14} /> Priority
            </div>
            {editing ? (
              <select
                className="select"
                value={editPriority}
                onChange={(e) =>
                  setEditPriority(e.target.value as TaskPriority)
                }
              >
                {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            ) : (
              <div className="task-detail-field-value">
                <span
                  className={`badge ${getPriorityBadgeClass(task.priority)}`}
                >
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <UserIcon size={14} /> Assignee
            </div>
            {editing ? (
              <select
                className="select"
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            ) : (
              <div className="task-detail-field-value">
                {task.assignee ? (
                  <>
                    <div className="avatar avatar-sm avatar-placeholder">
                      {(
                        task.assignee.full_name || task.assignee.email
                      )[0].toUpperCase()}
                    </div>
                    <span>
                      {task.assignee.full_name || task.assignee.email}
                    </span>
                  </>
                ) : (
                  <span className="task-card-desc">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <Calendar size={14} /> Due Date
            </div>
            {editing ? (
              <input
                type="date"
                className="input"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            ) : (
              <div className="task-detail-field-value">
                {task.due_date ? (
                  format(new Date(task.due_date), 'MMM d, yyyy')
                ) : (
                  <span className="task-card-desc">No due date</span>
                )}
              </div>
            )}
          </div>

          {/* Created By */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <UserIcon size={14} /> Created By
            </div>
            <div className="task-detail-field-value">
              {task.creator ? (
                <>
                  <div className="avatar avatar-sm avatar-placeholder">
                    {(
                      task.creator.full_name || task.creator.email
                    )[0].toUpperCase()}
                  </div>
                  <span>{task.creator.full_name || task.creator.email}</span>
                </>
              ) : (
                <span className="task-card-desc">Unknown</span>
              )}
            </div>
          </div>

          {/* Created At */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <Clock size={14} /> Created At
            </div>
            <div className="task-detail-field-value">
              {format(new Date(task.created_at), 'MMM d, yyyy')}
            </div>
          </div>

          {/* Updated At */}
          <div className="task-detail-field">
            <div className="task-detail-field-label">
              <Clock size={14} /> Updated At
            </div>
            <div className="task-detail-field-value">
              {format(new Date(task.updated_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Task</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p>
              Are you sure you want to delete &quot;{task.title}&quot;? This
              action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
