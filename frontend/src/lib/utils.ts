import type { TaskStatus, TaskPriority } from '@/types'

export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    todo: 'var(--status-todo)',
    in_progress: 'var(--status-in-progress)',
    in_review: 'var(--status-in-review)',
    completed: 'var(--status-completed)',
  }
  return colors[status]
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'var(--priority-low)',
    medium: 'var(--priority-medium)',
    high: 'var(--priority-high)',
    urgent: 'var(--priority-urgent)',
  }
  return colors[priority]
}

export function getStatusBadgeClass(status: TaskStatus): string {
  const classes: Record<TaskStatus, string> = {
    todo: 'badge badge-todo',
    in_progress: 'badge badge-in-progress',
    in_review: 'badge badge-in-review',
    completed: 'badge badge-completed',
  }
  return classes[status]
}

export function getPriorityBadgeClass(priority: TaskPriority): string {
  const classes: Record<TaskPriority, string> = {
    low: 'badge badge-low',
    medium: 'badge badge-medium',
    high: 'badge badge-high',
    urgent: 'badge badge-urgent',
  }
  return classes[priority]
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'completed') return false
  return new Date(dueDate) < new Date()
}
