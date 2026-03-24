"use client";

import { useOptimistic, useTransition, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MilestoneCard } from "./MilestoneCard";
import { toggleMilestoneStatus, addMilestone } from "./actions";
import { Milestone } from "../../../../types/index";

type MilestoneStatus = "not_started" | "in_progress" | "complete";

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  not_started: "in_progress",
  in_progress: "complete",
  complete: "not_started",
};

const STATUS_PRIORITY: Record<MilestoneStatus, number> = {
  in_progress: 0,
  not_started: 1,
  complete: 2,
};

interface MilestoneGridProps {
  milestones: Milestone[];
}

export function MilestoneGrid({ milestones }: MilestoneGridProps) {
  const sorted = [...milestones].sort(
    (a, b) =>
      STATUS_PRIORITY[a.status as MilestoneStatus] -
      STATUS_PRIORITY[b.status as MilestoneStatus]
  );

  const [optimisticMilestones, setOptimistic] = useOptimistic(sorted);
  const [, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({});

  function handleToggle(id: string, currentStatus: MilestoneStatus) {
    const nextStatus = NEXT_STATUS[currentStatus];
    startTransition(async () => {
      setOptimistic((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m))
      );
      const result = await toggleMilestoneStatus(id, nextStatus);
      if (result?.error) {
        setToggleErrors((prev) => ({ ...prev, [id]: result.error! }));
      } else {
        setToggleErrors((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  }

  function handleAdd() {
    if (!newTitle.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await addMilestone(newTitle.trim());
      if (!result?.error) {
        setNewTitle("");
        setIsAdding(false);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {optimisticMilestones.map((milestone) => (
        <div key={milestone.id} className="flex flex-col">
          <MilestoneCard
            milestone={milestone}
            onToggleStatus={handleToggle}
          />
          {toggleErrors[milestone.id] && (
            <p className="text-xs text-destructive mt-1 px-1">
              {toggleErrors[milestone.id]}
            </p>
          )}
        </div>
      ))}

      {/* Add card */}
      <Card className="flex flex-col min-h-[120px]">
        <CardContent className="pt-4 pb-4 px-4 flex flex-col flex-1">
          {isAdding ? (
            <div className="flex flex-col gap-2 flex-1">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  } else if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewTitle("");
                  }
                }}
                placeholder="Milestone title..."
                className="w-full text-sm text-foreground bg-transparent border border-input rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="text-xs font-medium px-3 py-1 rounded-md bg-[--color-terracotta-500] text-white hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle("");
                  }}
                  className="text-xs font-medium px-3 py-1 rounded-md bg-muted text-muted-foreground hover:opacity-90 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex-1 flex items-center justify-center text-2xl text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Add milestone"
            >
              +
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
