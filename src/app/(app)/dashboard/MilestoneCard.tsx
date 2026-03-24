"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { saveMilestoneNote } from "./actions";
import { Milestone } from "../../../../types/index";

type MilestoneStatus = "not_started" | "in_progress" | "complete";

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
};

const STATUS_CLASSES: Record<MilestoneStatus, string> = {
  complete: "bg-terracotta-500 text-white",
  in_progress: "bg-terracotta-100 text-terracotta-700",
  not_started: "bg-muted text-muted-foreground",
};

interface MilestoneCardProps {
  milestone: Milestone;
  onToggleStatus: (id: string, current: MilestoneStatus) => void;
}

export function MilestoneCard({ milestone, onToggleStatus }: MilestoneCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(milestone.notes ?? "");
  const [, startTransition] = useTransition();

  function handleSave() {
    setEditing(false);
    if (draft !== milestone.notes) {
      startTransition(async () => {
        await saveMilestoneNote(milestone.id, draft);
      });
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="pt-4 pb-4 px-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-foreground leading-snug">{milestone.title}</span>
          <button
            onClick={() => onToggleStatus(milestone.id, milestone.status as MilestoneStatus)}
            className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full transition-colors ${STATUS_CLASSES[milestone.status as MilestoneStatus]}`}
          >
            {STATUS_LABELS[milestone.status as MilestoneStatus]}
          </button>
        </div>

        <div className="flex-1">
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(milestone.notes ?? "");
                }
              }}
              className="w-full text-sm text-foreground bg-transparent border border-input rounded-md px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
              placeholder="Add notes..."
            />
          ) : (
            <p
              onClick={() => setEditing(true)}
              className={`text-sm cursor-text rounded-md px-2 py-1 min-h-[36px] ${
                milestone.notes ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {milestone.notes || "Add notes..."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
