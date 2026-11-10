"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useGroups } from "@/hooks/use-groups"

function AddGroupForm({ onAdd }: { onAdd: (name: string) => void }) {
    const [name, setName] = useState("")

    const handleSubmit = () => {
        if (!name.trim()) return
        onAdd(name.trim())
        setName("")
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="group-name">Group name</Label>
                <Input
                    id="group-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Roommates"
                />
            </div>
            <Button type="button" onClick={handleSubmit}>
                Add Group
            </Button>
        </div>
    )
}

export default function GroupsPage() {
    const { groups, loading, error, createGroup } = useGroups()
    const [addError, setAddError] = useState<string | null>(null)
    const allGroups = groups ?? []

    const handleAdd = async (name: string) => {
        setAddError(null)
        try {
            await createGroup(name)
        } catch (err) {
            setAddError(err instanceof Error ? err.message : "Failed to create group")
        }
    }

    return (
        <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold">Groups</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="group-list">
                    {loading && <p className="text-sm text-muted-foreground">Loading groups...</p>}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {!loading &&
                        !error &&
                        allGroups.map((group) => (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                            >
                                <p className="font-medium">{group.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                                </p>
                            </Link>
                        ))}
                    {!loading && !error && allGroups.length === 0 && (
                        <p className="text-sm text-muted-foreground">You&apos;re not in any groups yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Group</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {addError && <p className="text-sm text-destructive">{addError}</p>}
                    <AddGroupForm onAdd={handleAdd} />
                </CardContent>
            </Card>
        </div>
    )
}
