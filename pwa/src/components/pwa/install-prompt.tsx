"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS Safari specifically (not Chrome or other browsers on iOS)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       !('MSStream' in window)
    
    const isSafari = /Safari/.test(navigator.userAgent) && 
                     !/Chrome|CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)

    // Check if it's Safari on iOS (not in standalone mode)
    const isIOSSafari = isIOSDevice && 
                        isSafari &&
                        !window.matchMedia('(display-mode: standalone)').matches &&
                        'standalone' in window.navigator

    setIsIOS(isIOSSafari)

    // For iOS Safari, show prompt after a short delay
    if (isIOSSafari) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000) // Show after 2 seconds
      
      return () => clearTimeout(timer)
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  // Don't show if already installed
  if (isInstalled || !showPrompt) {
    return null
  }

  // Don't show on non-iOS if no prompt available
  if (!isIOS && !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-background border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          {isIOS ? (
            <Share className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          ) : (
            <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install App</h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1">
                To install this app on your iPhone/iPad, tap the Share button 
                <Share className="inline h-3 w-3 mx-1" /> 
                at the bottom of Safari and select &quot;Add to Home Screen&quot;.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Install Ultimate Expense Tracker for offline access and a better experience.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {!isIOS && (
                <Button onClick={handleInstallClick} size="sm" className="text-xs">
                  Install
                </Button>
              )}
              <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-xs">
                {isIOS ? "Got it" : "Not now"}
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-auto p-1 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}