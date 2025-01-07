import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { useSupabase } from '@/lib/hooks/useSupabase'
import type { Database } from '@/lib/database.types'

type SearchResult = Database['public']['Functions']['search_messages']['Returns'][number] & {
  user?: { name: string; email: string }
}

interface SearchResultsPanelProps {
  isOpen: boolean
  onClose: () => void
  query: string
  channelId: string
}

export function SearchResultsPanel({ isOpen, onClose, query, channelId }: SearchResultsPanelProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [userMap, setUserMap] = useState<Record<string, { id: string; name: string; email: string }>>({})

  useEffect(() => {
    if (!query || !channelId) return

    const searchMessages = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log('Initiating search:', { query, channelId, page })
        
        const { data, error } = await supabase
          .rpc('search_messages', {
            p_search_query: query,
            p_channel_id: channelId,
            p_limit: 20,
            p_offset: page * 20
          })

        if (error) {
          console.error('Search function error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          throw error
        }

        console.log('Search results:', { 
          count: data?.length,
          firstResult: data?.[0],
          similarity: data?.[0]?.similarity
        })

        // Fetch user info for each message
        const userIds = new Set([
          ...data.map((r: SearchResult) => r.user_id),
          ...data.flatMap((r: SearchResult) => [
            ...(r.context_before ? JSON.parse(r.context_before as string).map((m: any) => m.user_id) : []),
            ...(r.context_after ? JSON.parse(r.context_after as string).map((m: any) => m.user_id) : [])
          ])
        ])

        console.log('Fetching user info for:', { userCount: userIds.size })

        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', Array.from(userIds))

        if (userError) {
          console.error('User fetch error:', userError)
          throw userError
        }

        const newUserMap = (users || []).reduce((acc, user) => ({
          ...acc,
          [user.id]: user
        }), {} as Record<string, { id: string; name: string; email: string }>)

        setUserMap(prev => ({ ...prev, ...newUserMap }))

        const enrichedResults = data.map((result: SearchResult) => ({
          ...result,
          user: newUserMap[result.user_id]
        }))

        setResults(prev => page === 0 ? enrichedResults : [...prev, ...enrichedResults])
        setHasMore(data.length === 20)
      } catch (e) {
        console.error('Search error details:', {
          error: e,
          errorMessage: e instanceof Error ? e.message : 'Unknown error',
          errorStack: e instanceof Error ? e.stack : undefined,
          query,
          channelId,
          page
        })
        setError('Failed to search messages')
      } finally {
        setLoading(false)
      }
    }

    searchMessages()
  }, [query, channelId, page, supabase])

  const highlightText = (text: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  const handleResultClick = (messageId: string) => {
    // TODO: Implement scrolling to message in chat
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-background border-l shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Search Results
          {results.length > 0 && ` (${results.length})`}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {loading && page === 0 ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : results.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No messages found matching "{query}"
            </div>
          ) : (
            results.map((result) => (
              <div 
                key={result.id} 
                className="space-y-2 hover:bg-muted/50 p-2 rounded cursor-pointer"
                onClick={() => handleResultClick(result.id)}
              >
                {/* Context Before */}
                {result.context_before && JSON.parse(result.context_before as string).map((msg: any) => (
                  <div key={msg.id} className="text-sm text-muted-foreground">
                    <span className="font-medium">{userMap[msg.user_id]?.name}: </span>
                    {msg.content}
                  </div>
                ))}

                {/* Main Message */}
                <div className="border-l-2 border-primary pl-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.user?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: highlightText(result.content) }}
                  />
                </div>

                {/* Context After */}
                {result.context_after && JSON.parse(result.context_after as string).map((msg: any) => (
                  <div key={msg.id} className="text-sm text-muted-foreground">
                    <span className="font-medium">{userMap[msg.user_id]?.name}: </span>
                    {msg.content}
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPage(p => p + 1)}
            >
              Load More
            </Button>
          )}

          {/* Loading More */}
          {loading && page > 0 && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation */}
      {results.length > 0 && (
        <div className="p-4 border-t flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement previous result
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Use ↑↓ keys to navigate
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement next result
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 