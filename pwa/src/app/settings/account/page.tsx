"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AccountProfileForm } from "./components/account-profile-form"
import { ChangePasswordForm } from "./components/change-password-form"
import { LoginHistoryList } from "./components/login-history-list"
import { DeleteAccountDialog } from "./components/delete-account-dialog"
import { AttachDeviceDataCard } from "./components/attach-device-data-card"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Shield, User, History, AlertTriangle } from "lucide-react"

export default function AccountSettingsPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>You must be logged in to access account settings.</span>
            {/* U9 in the bug report: this page just said "you must be
                logged in" with no way to actually do that. */}
            <Button asChild size="sm">
              <Link href="/auth/login?returnUrl=%2Fsettings%2Faccount">Sign In</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information, security settings, and login history.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccountProfileForm />
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <AttachDeviceDataCard />

        {/* Login History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Login History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoginHistoryList />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. 
                  This action cannot be undone and will permanently delete 
                  all your data.
                </p>
                <DeleteAccountDialog />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}