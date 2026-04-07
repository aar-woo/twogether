"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OptionWithVotes, Vote, OptionVoteState } from "../../../../../types/index";
import { upsertVote } from "./actions";

function deriveOptionState(votes: Vote[], currentUserId: string): OptionVoteState {
  const myVote = votes.find((v) => v.user_id === currentUserId);
  const partnerVote = votes.find((v) => v.user_id !== currentUserId);

  if (!myVote) return { state: "unvoted" };
  if (!partnerVote) return { state: "you_voted", myVote };

  const avg = (myVote.rating + partnerVote.rating) / 2;
  let score = Math.round(avg * 10);
  if (myVote.rating >= 6 && partnerVote.rating >= 6) score = Math.min(100, Math.round(score * 1.1));
  else if (myVote.rating <= 4 && partnerVote.rating <= 4) score = Math.round(score * 0.85);
  return { state: "both_voted", myVote, partnerVote, score };
}

function CompatibilityBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-sage-600 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-sage-700 shrink-0">
        {score}% match
      </span>
    </div>
  );
}

interface OptionCardProps {
  option: OptionWithVotes;
  currentUserId: string;
  decisionId: string;
  decisionStatus: "open" | "resolved";
  resolvedOptionId: string | null;
  onResolve: (optionId: string) => void;
}

export function OptionCard({
  option,
  currentUserId,
  decisionId,
  decisionStatus,
  resolvedOptionId,
  onResolve,
}: OptionCardProps) {
  const voteState = deriveOptionState(option.votes, currentUserId);

  const initialRating =
    voteState.state !== "unvoted" ? voteState.myVote.rating : null;
  const initialComment =
    voteState.state !== "unvoted" ? (voteState.myVote.comment ?? "") : "";

  const [selectedRating, setSelectedRating] = useState<number | null>(initialRating);
  const [comment, setComment] = useState<string>(initialComment);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWinner = resolvedOptionId === option.id;

  async function handleSubmit() {
    if (selectedRating === null || isPending) return;
    setIsPending(true);
    setError(null);
    const result = await upsertVote(option.id, decisionId, selectedRating, comment);
    setIsPending(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  const voteForm = (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            size="sm"
            variant={selectedRating === n ? "default" : "outline"}
            className={
              selectedRating === n
                ? "bg-sage-600 text-white hover:bg-sage-700 border-sage-600"
                : ""
            }
            onClick={() => setSelectedRating(n)}
          >
            {n}
          </Button>
        ))}
      </div>
      <Textarea
        placeholder="Add a comment (optional)"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        size="sm"
        disabled={selectedRating === null || isPending}
        onClick={handleSubmit}
      >
        {voteState.state === "unvoted" ? "Submit vote" : "Update vote"}
      </Button>
    </div>
  );

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        {/* Option label */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-foreground">{option.label}</p>
          {isWinner && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
              Winner
            </span>
          )}
        </div>

        {/* State-specific display */}
        {voteState.state === "unvoted" && voteForm}

        {voteState.state === "you_voted" && (
          <>
            <p className="text-sm text-muted-foreground mt-2">
              Your rating: {voteState.myVote.rating}/10
            </p>
            {voteState.myVote.comment && (
              <p className="text-sm text-muted-foreground mt-1">
                {voteState.myVote.comment}
              </p>
            )}
            <p className="text-sm text-muted-foreground italic mt-2">
              Waiting for partner...
            </p>
            {voteForm}
          </>
        )}

        {voteState.state === "both_voted" && (
          <>
            <div className="flex gap-4 mt-2">
              <p className="text-sm text-muted-foreground">
                You: {voteState.myVote.rating}/10
              </p>
              <p className="text-sm text-muted-foreground">
                Partner: {voteState.partnerVote.rating}/10
              </p>
            </div>
            {(voteState.myVote.comment || voteState.partnerVote.comment) && (
              <div className="mt-1 space-y-1">
                {voteState.myVote.comment && (
                  <p className="text-sm text-muted-foreground">
                    Your note: {voteState.myVote.comment}
                  </p>
                )}
                {voteState.partnerVote.comment && (
                  <p className="text-sm text-muted-foreground">
                    Partner note: {voteState.partnerVote.comment}
                  </p>
                )}
              </div>
            )}
            <CompatibilityBar score={voteState.score} />
            {voteForm}
          </>
        )}

        {/* Resolve button */}
        {decisionStatus === "open" && !isWinner && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(option.id)}
            >
              Select as winner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
