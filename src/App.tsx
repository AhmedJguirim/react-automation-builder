/** Route switch: `/` lists the example workflows, `/workflow/{id}` builds one. */
import { Link } from './components/Link'
import { usePathname } from './lib/router'
import { WorkflowBuilder } from './pages/WorkflowBuilder'
import { WorkflowIndex } from './pages/WorkflowIndex'

function matchWorkflowId(pathname: string): number | null {
  const match = /^\/workflow\/(\d+)\/?$/.exec(pathname)

  return match ? Number(match[1]) : null
}

export default function App() {
  const pathname = usePathname()
  const automationId = matchWorkflowId(pathname)

  if (automationId !== null) {
    return <WorkflowBuilder automationId={automationId} />
  }

  if (pathname === '/') {
    return <WorkflowIndex />
  }

  return (
    <div className="canvas-grid flex h-full flex-col items-center justify-center gap-3">
      <p className="text-sm text-gray-500">Nothing lives at {pathname}</p>
      <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">
        Back to the workflows
      </Link>
    </div>
  )
}
