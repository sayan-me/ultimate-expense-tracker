"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Bell } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { getNotifications, markNotificationAsRead, clearAllNotifications } from "@/lib/data"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface Notification {
  id: string
  title: string
  message: string
  type: 'expense' | 'budget' | 'system' | 'group'
  timestamp: Date
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const data = await getNotifications()
      const sortedNotifications = [...data.notifications].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )
      setNotifications(sortedNotifications)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notifications'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      setMarkingAsRead(id)
      await markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    } finally {
      setMarkingAsRead(null)
    }
  }

  async function handleClearAll() {
    try {
      setIsClearing(true)
      await clearAllNotifications()
      setNotifications([])
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    } finally {
      setIsClearing(false)
    }
  }

  if (error) throw error // This will be caught by the error boundary

  if (isLoading) return null // This will show the loading.tsx component

  return (
    <ProtectedRoute>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearAll}
              disabled={isClearing}
              className="flex items-center gap-2"
            >
              {isClearing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </>
              )}
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={cn(
                  "transition-colors",
                  !notification.read && "bg-muted/50"
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between p-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{notification.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markingAsRead === notification.id}
                    >
                      {markingAsRead === notification.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          Marking...
                        </>
                      ) : (
                        'Mark as read'
                      )}
                    </Button>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 