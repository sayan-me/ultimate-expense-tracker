"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const sections = [
    { id: 'notifications', title: 'Notification Preferences' },
    { id: 'display', title: 'Display Settings' },
    { id: 'data', title: 'Data Management' },
    { id: 'accounts', title: 'Account Settings' },
    { id: 'about', title: 'About' }
  ]

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-4">
        {sections.map(section => (
          <Card 
            key={section.id}
            className={cn(
              "transition-all duration-200",
              activeSection === section.id ? "bg-muted" : ""
            )}
          >
            <button
              className="w-full text-left"
              onClick={() => setActiveSection(
                activeSection === section.id ? null : section.id
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <ChevronRight 
                  className={cn(
                    "h-5 w-5 transition-transform",
                    activeSection === section.id ? "rotate-90" : ""
                  )}
                />
              </CardHeader>
            </button>
            {activeSection === section.id && (
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}