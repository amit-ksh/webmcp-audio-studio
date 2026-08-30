import { createFileRoute } from '@tanstack/react-router'
import { StudioShell } from '../components/studio/StudioShell'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <StudioShell />
}

