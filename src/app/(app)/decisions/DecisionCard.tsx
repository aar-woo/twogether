"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecisionWithOptions } from "../../../../types/index";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DecisionCardProps {
  decision: DecisionWithOptions;
  currentUserId: string;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (id: string, dir: "up" | "down") => void;
}

function getVoteStatusSummary(
  decision: DecisionWithOptions,
  currentUserId: string,
): string {
  const optionCount = decision.decision_options.length;

  if (decision.status === "resolved") {
    const winningOption = decision.resolved_option_id
      ? decision.decision_options.find(
          (opt) => opt.id === decision.resolved_option_id,
        )
      : null;
    const label = winningOption ? winningOption.label : "winner selected";
    return `${optionCount} options · Resolved: ${label}`;
  }

  // Find best compatibility score among options where both voted
  let bestScore: number | null = null;
  let currentUserVoted = false;

  for (const option of decision.decision_options) {
    const hasCurrentUser = option.votes.some(
      (v) => v.user_id === currentUserId,
    );
    if (hasCurrentUser) currentUserVoted = true;

    if (option.votes.length === 2) {
      const [a, b] = option.votes;
      const avg = (a.rating + b.rating) / 2;
      let score = Math.round(avg * 10);
      if (a.rating >= 6 && b.rating >= 6)
        score = Math.min(100, Math.round(score * 1.1));
      else if (a.rating <= 4 && b.rating <= 4) score = Math.round(score * 0.85);
      if (bestScore === null || score > bestScore) {
        bestScore = score;
      }
    }
  }

  if (bestScore !== null) {
    return `${optionCount} options · ${bestScore}% top match`;
  }

  if (currentUserVoted) {
    return `${optionCount} options · You voted`;
  }

  return `${optionCount} options · Not yet voted`;
}

export function DecisionCard({
  decision,
  currentUserId,
  isFirst,
  isLast,
  onReorder,
}: DecisionCardProps) {
  const voteStatus = getVoteStatusSummary(decision, currentUserId);
  const isOpen = decision.status === "open";
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <Link href={`/decisions/${decision.id}`} className="block">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-foreground">
              {decision.title}
            </span>
            <span
              className={
                isOpen
                  ? "text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                  : "text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"
              }
            >
              {isOpen ? "Open" : "Resolved"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{voteStatus}</p>
        </Link>

        {isOpen && (
          <div className="flex gap-1 mt-3">
            <Button
              variant="ghost"
              className={"w-[40px] bg-blue-100 hover:bg-blue-200 text-blue-700"}
              size="sm"
              disabled={isFirst}
              onClick={(e) => {
                e.stopPropagation();
                onReorder(decision.id, "up");
              }}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              className={
                "w-[40px] bg-slate-100 hover:bg-slate-200 text-slate-700"
              }
              size="sm"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onReorder(decision.id, "down");
              }}
            >
              <ChevronDown />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
