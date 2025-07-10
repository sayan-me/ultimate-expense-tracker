"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { authService } from "@/services/auth.service"
import { AlertTriangle, RefreshCw, Monitor, Smartphone, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoginHistoryItem {
  id: string
  login_timestamp: string
  ip_address: string
  user_agent: string
  login_method: string
  success: boolean
}

export function LoginHistoryList() {
  const [history, setHistory] = useState<LoginHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const loadHistory = async (offset: number = 0) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await authService.getLoginHistory(20, offset)
      
      if (offset === 0) {
        setHistory(result.history)
      } else {
        setHistory(prev => [...prev, ...result.history])
      }
      
      setTotal(result.total)
      setHasMore(result.history.length === 20 && (offset + 20) < result.total)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load login history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleRefresh = () => {
    loadHistory()
  }

  const handleLoadMore = () => {
    loadHistory(history.length)
  }

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Monitor className="h-4 w-4" />
    }
    return <Globe className="h-4 w-4" />
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getBrowserInfo = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    return 'Unknown Browser'
  }

  if (isLoading && history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total} login attempts` : 'No login history'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {history.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No login history available</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                item.success 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-full",
                  item.success ? "bg-green-100" : "bg-red-100"
                )}>
                  {getDeviceIcon(item.user_agent)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {item.success ? 'Successful Login' : 'Failed Login'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {item.login_method}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getBrowserInfo(item.user_agent)} • {item.ip_address}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {formatDate(item.login_timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}