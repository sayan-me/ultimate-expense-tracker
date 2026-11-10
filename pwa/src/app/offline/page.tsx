import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WifiOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="container flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <WifiOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle>You&apos;re Offline</CardTitle>
          <CardDescription className="mt-2">
            Don&apos;t worry! You can still:
          </CardDescription>
          {/* A <ul> can't be a descendant of CardDescription's <p> — the
              browser's HTML parser closes the <p> early, so the server
              and client trees mismatch and React has to regenerate this
              whole subtree on hydration (C2 in the bug report). */}
          <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
            <li>• View your expenses</li>
            <li>• Add new transactions</li>
            <li>• Check your budgets</li>
          </ul>
          <Button asChild className="mt-6">
            <Link href="/">Continue Offline</Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  )
} 