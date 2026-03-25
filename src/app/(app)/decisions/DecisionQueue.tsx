"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DecisionWithOptions } from "../../../../types/index";
import { DecisionCard } from "./DecisionCard";
import { createDecision, reorderDecision } from "./actions";

interface DecisionQueueProps {
  decisions: DecisionWithOptions[];
  currentUserId: string;
}

export function DecisionQueue({ decisions, currentUserId }: DecisionQueueProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [, startTransition] = useTransition();

  const openDecisions = decisions.filter((d) => d.status === "open");
  const resolvedDecisions = decisions.filter((d) => d.status === "resolved");

  function handleAdd() {
    if (!title.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await createDecision(title.trim(), category.trim());
      if (!result?.error) {
        setTitle("");
        setCategory("");
        setIsAdding(false);
      }
    });
  }

  function handleCancel() {
    setTitle("");
    setCategory("");
    setIsAdding(false);
  }

  function handleReorder(id: string, dir: "up" | "down") {
    startTransition(async () => {
      await reorderDecision(id, dir);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-foreground">Decisions</h1>
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          + New Decision
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="What are you deciding?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm">
                Submit
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {decisions.length === 0 && !isAdding ? (
        <div className="text-center py-16 text-muted-foreground">
          No decisions yet. Create your first one above.
        </div>
      ) : (
        <>
          {openDecisions.map((decision, index) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              currentUserId={currentUserId}
              isFirst={index === 0}
              isLast={index === openDecisions.length - 1}
              onReorder={handleReorder}
            />
          ))}
          {resolvedDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              currentUserId={currentUserId}
              isFirst={false}
              isLast={false}
              onReorder={handleReorder}
            />
          ))}
        </>
      )}
    </div>
  );
}
