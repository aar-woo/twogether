"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecisionWithOptions } from "../../../../types/index";

interface DecisionCardProps {
  decision: DecisionWithOptions;
  currentUserId: string;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (id: string, dir: "up" | "down") => void;
}

function getVoteStatusSummary(
  decision: DecisionWithOptions,
  currentUserId: string
): string {
  const optionCount = decision.decision_options.length;

  if (decision.status === "resolved") {
    const winningOption = decision.resolved_option_id
      ? decision.decision_options.find(
          (opt) => opt.id === decision.resolved_option_id
        )
      : null;
    const label = winningOption ? winningOption.label : "winner selected";
    return `${optionCount} options · Resolved: ${label}`;
  }

  // Find best compatibility score among options where both voted
  let bestScore: number | null = null;
  let currentUserVoted = false;

  for (const option of decision.decision_options) {
    const hasCurrentUser = option.votes.some((v) => v.user_id === currentUserId);
    if (hasCurrentUser) currentUserVoted = true;

    if (option.votes.length === 2) {
      const [a, b] = option.votes;
      const score = 100 - Math.abs(a.rating - b.rating) * 10;
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
            <span className="font-semibold text-foreground">{decision.title}</span>
            <span
              className={
                isOpen
                  ? "text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"
                  : "text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
              }
            >
              {isOpen ? "Open" : "Resolved"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{voteStatus}</p>
        </Link>

        {isOpen && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={isFirst}
              onClick={(e) => {
                e.stopPropagation();
                onReorder(decision.id, "up");
              }}
            >
              Up
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onReorder(decision.id, "down");
              }}
            >
              Down
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
