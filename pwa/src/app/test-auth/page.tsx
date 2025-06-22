"use client"

import { FeatureGate } from "@/components/auth/feature-gate"
import { AuthFallbackContent } from "@/components/ui/auth-fallback-content"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TestAuthPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Basic Feature - Available to Everyone */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Expense Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This feature is available to everyone without login!</p>
          <ul className="list-disc pl-4 mt-2">
            <li>Track basic expenses</li>
            <li>View simple reports</li>
            <li>Manage virtual accounts</li>
          </ul>
        </CardContent>
      </Card>

      {/* Registered Feature - Needs Login */}
      <FeatureGate 
        level="registered"
        fallback={
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Group Expense Management</CardTitle>
            </CardHeader>
            <AuthFallbackContent type="registered" />
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Group Expense Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You&apos;re logged in! You can now:</p>
            <ul className="list-disc pl-4 mt-2">
              <li>Create expense groups</li>
              <li>Split bills with friends</li>
              <li>Track group balances</li>
            </ul>
          </CardContent>
        </Card>
      </FeatureGate>

      {/* Premium Feature - Will Need Subscription */}
      <FeatureGate 
        level="premium"
        fallback={
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Premium Features</CardTitle>
            </CardHeader>
            <AuthFallbackContent type="premium" />
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You&apos;re a premium user! You can now:</p>
            <ul className="list-disc pl-4 mt-2">
              <li>Scan receipts</li>
              <li>Get advanced insights</li>
              <li>Analyze bank statements</li>
            </ul>
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  )
} 