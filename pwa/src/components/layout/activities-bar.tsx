"use client"

import { cn } from "@/lib/utils"
import { GripHorizontal, Plus, Minus } from "lucide-react"
import { PERSONAL_ACTIVITIES, type ActivityItem } from "@/constants/activities"
import { ActivitiesBarHeader } from "./activities-bar-header"
import { Overlay } from "@/components/ui/overlay"
import { useActivities } from "@/contexts/activities-context"
import { FeatureGate } from "@/components/auth/feature-gate"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthFallbackContent } from "@/components/ui/auth-fallback-content"

const ActivityButton = ({ icon: Icon, label, onClick }: ActivityItem) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 rounded-lg p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label={label}
    >
        <Icon className="h-6 w-6" />
        <span className="text-xs text-center">{label}</span>
    </button>
)

export function ActivitiesBar() {
    return <ActivitiesBarContent />
}

function ActivitiesBarContent() {
    const {
        isActivitiesBarOpen,
        isCustomizing,
        selectedQuickActions,
        isGroupMode,
        actions,
        toggleActivitiesBar,
        toggleQuickAction,
        closeActivitiesBar,
    } = useActivities()

    const handleClose = () => {
        closeActivitiesBar()
    }

    return (
        <>
            <Overlay isVisible={isActivitiesBarOpen} onClose={handleClose} />
            <div
                className={cn(
                    "fixed bottom-14 left-0 right-0 bg-background transition-transform duration-300 ease-in-out",
                    "border-t rounded-t-2xl shadow-lg",
                    isActivitiesBarOpen
                        ? "h-[50vh] transform translate-y-0 z-30"
                        : "h-12 transform translate-y-0 z-30"
                )}
            >
                {isCustomizing ? (
                    isGroupMode ? (
                        <FeatureGate
                            level="registered"
                            fallback={
                                <Card className="bg-muted">
                                    <CardHeader>
                                        <CardTitle>Group Activities</CardTitle>
                                    </CardHeader>
                                    <AuthFallbackContent type="registered" />
                                </Card>
                            }
                        >
                            <CustomizationContent
                                actions={actions}
                                selectedQuickActions={selectedQuickActions}
                                toggleQuickAction={toggleQuickAction}
                                onClose={handleClose}
                                isGroupMode={isGroupMode}
                            />
                        </FeatureGate>
                    ) : (
                        <CustomizationContent
                            actions={actions}
                            selectedQuickActions={selectedQuickActions}
                            toggleQuickAction={toggleQuickAction}
                            onClose={handleClose}
                            isGroupMode={isGroupMode}
                        />
                    )
                ) : (
                    <>
                        <button
                            onClick={() => toggleActivitiesBar()}
                            className="flex w-full items-center justify-center p-2 gap-2"
                            aria-label={
                                isActivitiesBarOpen
                                    ? "Collapse activities"
                                    : "Expand activities"
                            }
                        >
                            <span className="text-sm text-muted-foreground">
                                {isGroupMode
                                    ? "Group Activities"
                                    : "Activities"}
                            </span>
                            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {isActivitiesBarOpen && isGroupMode ? (
                            <FeatureGate
                                level="registered"
                                fallback={
                                    <div className="container p-4">
                                        <Card className="bg-muted">
                                            <CardHeader>
                                                <CardTitle>
                                                    Group Activities
                                                </CardTitle>
                                            </CardHeader>
                                            <AuthFallbackContent type="registered" />
                                        </Card>
                                    </div>
                                }
                            >
                                <div className="container h-full overflow-y-auto p-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                        {actions.map((activity) => (
                                            <ActivityButton
                                                key={activity.label}
                                                {...activity}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </FeatureGate>
                        ) : (
                            isActivitiesBarOpen && (
                                <div className="container h-full overflow-y-auto p-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                        {actions.map((activity) => (
                                            <ActivityButton
                                                key={activity.label}
                                                {...activity}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </>
    )
}

function CustomizationContent({
    actions,
    selectedQuickActions,
    toggleQuickAction,
    onClose,
    isGroupMode,
}: {
    actions: typeof PERSONAL_ACTIVITIES
    selectedQuickActions: typeof PERSONAL_ACTIVITIES
    toggleQuickAction: (action: (typeof PERSONAL_ACTIVITIES)[0]) => void
    onClose: () => void
    isGroupMode: boolean
}) {
    return (
        <>
            <ActivitiesBarHeader
                title={`Customize ${isGroupMode ? "Group" : "Personal"} Quick Actions`}
                onClose={onClose}
            />
            <div className="h-[calc(50vh-4rem)] overflow-y-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 p-4">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => toggleQuickAction(action)}
                            className={cn(
                                "relative flex flex-col items-center p-3 rounded-full transition-all",
                                selectedQuickActions.some(
                                    (a) => a.label === action.label
                                )
                                    ? "bg-primary/10 hover:bg-primary/20"
                                    : "border-2 border-dashed border-muted hover:border-primary/50"
                            )}
                            aria-label={`${selectedQuickActions.some((a) => a.label === action.label) ? "Remove" : "Add"} ${action.label}`}
                        >
                            {selectedQuickActions.some(
                                (a) => a.label === action.label
                            ) ? (
                                <Minus className="absolute top-1 right-1 h-4 w-4" />
                            ) : (
                                <Plus className="absolute top-1 right-1 h-3 w-3" />
                            )}
                            <div className="rounded-full p-3">
                                <action.icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs text-center mt-1">
                                {action.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}
