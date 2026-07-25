/**
 * Stands in for the Laravel queries (`Automation::with('trigger')->find(1)` and
 * friends): the tables are shipped as static JSON under public/api and pulled in
 * with fetch, so the component reads its data over the network exactly as it
 * would against a real backend.
 */
import type { AutomationPayload, NodeTypeOption } from '../types'

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export function fetchAutomation(id: number): Promise<AutomationPayload> {
  return getJson<AutomationPayload>(`/api/automations/${id}.json`)
}

export function fetchNodeTypes(): Promise<NodeTypeOption[]> {
  return getJson<NodeTypeOption[]>('/api/node-types.json')
}
