/** Landing page: the example workflows, so each canvas size can be tried. */
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { fetchWorkflows } from '../lib/api'
import { Link } from '../components/Link'
import type { WorkflowSummary } from '../types'

export function WorkflowIndex() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkflows()
      .then(setWorkflows)
      .catch((cause: Error) => setError(cause.message))
  }, [])

  return (
    <div className="canvas-grid min-h-full px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
        <p className="mt-1 mb-8 text-sm text-gray-500">
          Each one is a different shape and size — open it to see how the canvas sits around it.
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <ul className="space-y-3">
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <Link
                to={`/workflow/${workflow.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon name="bolt" className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                  <div className="text-sm text-gray-500">{workflow.description}</div>
                  <div className="mt-1 text-xs text-gray-400">{workflow.size}</div>
                </div>
                <span className="font-mono text-xs text-gray-400">/workflow/{workflow.id}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
