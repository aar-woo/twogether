"use client";
import { useActionState } from "react";
import { createWeddingAction } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState: { error?: string } = {};

export default function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<
    { error?: string },
    FormData
  >(createWeddingAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name your wedding</CardTitle>
        <CardDescription>
          Something like &ldquo;Sarah &amp; James&rdquo; works great.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wedding_name">Wedding name</Label>
            <Input
              id="wedding_name"
              name="wedding_name"
              type="text"
              placeholder="Sarah &amp; James"
              required
              autoFocus
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Create your wedding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
