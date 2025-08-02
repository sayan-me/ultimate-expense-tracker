"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChevronRight, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const sections = [
    { id: 'notifications', title: 'Notification Preferences', expandable: true },
    { id: 'display', title: 'Display Settings', expandable: true },
    { id: 'data', title: 'Data Management', expandable: true },
    { id: 'accounts', title: 'Account Settings', expandable: false, href: '/settings/account' },
    { id: 'about', title: 'About', expandable: true }
  ]

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-4">
        {sections.map(section => {
          if (section.href) {
            // Render as navigation link
            return (
              <Link key={section.id} href={section.href}>
                <Card className="transition-all duration-200 hover:bg-muted cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {section.id === 'accounts' && <User className="h-5 w-5" />}
                      {section.title}
                    </CardTitle>
                    <ChevronRight className="h-5 w-5" />
                  </CardHeader>
                </Card>
              </Link>
            )
          }

          // Render as expandable section
          return (
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
          )
        })}
      </div>
    </div>
  )
}