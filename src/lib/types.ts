import type { Database } from './database.types'

export type Message = Database['public']['Tables']['messages']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
  file_url?: string
} 