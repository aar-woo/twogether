"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, X, ChevronsUpDown } from "lucide-react";
import { createGuest, updateGuest, deleteGuest } from "./actions";
import {
  Guest,
  GUEST_SIDES,
  GUEST_RELATIONSHIPS,
  GUEST_SIDE_TO_DB,
  GUEST_SIDE_FROM_DB,
  GUEST_SIDE_ICON,
  GUEST_RELATIONSHIP_ICON,
} from "../../../../types/index";

interface GuestClientProps {
  weddingId: string;
  guests: Guest[];
}

type GuestAction =
  | { type: "add"; guest: Guest }
  | { type: "update"; guest: Guest }
  | { type: "delete"; id: string };

function guestReducer(state: Guest[], action: GuestAction): Guest[] {
  switch (action.type) {
    case "add":
      return [...state, action.guest];
    case "update":
      return state.map((g) => (g.id === action.guest.id ? action.guest : g));
    case "delete":
      return state.filter((g) => g.id !== action.id);
  }
}

export function GuestClient({
  weddingId: _weddingId,
  guests,
}: GuestClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  void isPending;

  // Optimistic guest array
  const [optimisticGuests, setOptimisticGuests] = useOptimistic(
    guests,
    guestReducer,
  );

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newSide, setNewSide] = useState<string>("Bride");
  const [newRelationship, setNewRelationship] = useState<string>("Family");
  const [newInvited, setNewInvited] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editSide, setEditSide] = useState<string>("Bride");
  const [editRelationship, setEditRelationship] = useState<string>("Family");
  const [editInvited, setEditInvited] = useState(true);

  function handleStartEdit(g: Guest) {
    setEditingGuestId(g.id);
    setEditName(g.name);
    setEditSide(GUEST_SIDE_FROM_DB[g.side ?? ""] ?? "Bride");
    setEditRelationship(g.relationship ?? "Family");
    setEditInvited(g.invited);
    setDeletingGuestId(null);
    setError(null);
  }

  function handleCancelAdd() {
    setShowAddForm(false);
    setNewName("");
    setNewSide("Bride");
    setNewRelationship("Family");
    setNewInvited(true);
    setError(null);
  }

  function handleAddGuest() {
    if (!newName.trim()) return;
    const tempGuest: Guest = {
      id: crypto.randomUUID(),
      wedding_id: "",
      name: newName.trim(),
      side:
        GUEST_SIDE_TO_DB[newSide as keyof typeof GUEST_SIDE_TO_DB] ?? newSide,
      relationship: newRelationship,
      invited: newInvited,
      created_at: new Date().toISOString(),
    };
    startTransition(async () => {
      setOptimisticGuests({ type: "add", guest: tempGuest });
      const result = await createGuest(
        newName.trim(),
        GUEST_SIDE_TO_DB[newSide as keyof typeof GUEST_SIDE_TO_DB] ?? newSide,
        newRelationship,
        newInvited,
      );
      if (result?.error) {
        setError(result.error);
      } else {
        setNewName("");
        setNewSide("Bride");
        setNewRelationship("Family");
        setNewInvited(true);
        router.refresh();
      }
    });
  }

  function handleSaveEdit(g: Guest) {
    if (!editName.trim()) return;
    const updatedGuest: Guest = {
      ...g,
      name: editName.trim(),
      side:
        GUEST_SIDE_TO_DB[editSide as keyof typeof GUEST_SIDE_TO_DB] ?? editSide,
      relationship: editRelationship,
      invited: editInvited,
    };
    startTransition(async () => {
      setOptimisticGuests({ type: "update", guest: updatedGuest });
      const result = await updateGuest(g.id, {
        name: editName.trim(),
        side:
          GUEST_SIDE_TO_DB[editSide as keyof typeof GUEST_SIDE_TO_DB] ??
          editSide,
        relationship: editRelationship,
        invited: editInvited,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setEditingGuestId(null);
        router.refresh();
      }
    });
  }

  function handleDeleteGuest(id: string) {
    startTransition(async () => {
      setOptimisticGuests({ type: "delete", id });
      const result = await deleteGuest(id);
      if (result?.error) {
        setError(result.error);
      } else {
        setDeletingGuestId(null);
        router.refresh();
      }
    });
  }

  function handleToggleInvited(id: string, currentInvited: boolean) {
    const guest = optimisticGuests.find((g) => g.id === id);
    if (!guest) return;
    startTransition(async () => {
      setOptimisticGuests({
        type: "update",
        guest: { ...guest, invited: !currentInvited },
      });
      const result = await updateGuest(id, { invited: !currentInvited });
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  // Summary counts — always derived from optimisticGuests
  const totalGuests = optimisticGuests.length;
  const invitedCount = optimisticGuests.filter((g) => g.invited).length;
  const sideCounts = GUEST_SIDES.map((s) => ({
    label: s,
    count: optimisticGuests.filter(
      (g) => GUEST_SIDE_FROM_DB[g.side ?? ""] === s,
    ).length,
  })).filter((s) => s.count > 0);
  const relationshipCounts = GUEST_RELATIONSHIPS.map((r) => ({
    label: r,
    count: optimisticGuests.filter((g) => g.relationship === r).length,
  })).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-sage-900">
          Guest List
        </h1>
        <Button
          variant={showAddForm ? "outline" : "default"}
          onClick={() => {
            if (showAddForm) {
              handleCancelAdd();
            } else {
              setShowAddForm(true);
            }
          }}
        >
          {showAddForm ? "Done" : "+ Add Guest"}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 text-red-700 p-3 rounded-md">
          <span className="text-sm">{error}</span>
          <button
            aria-label="Dismiss error"
            className="p-1 hover:bg-red-100 rounded"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-md font-bold text-muted-foreground uppercase tracking-wide">
              Total Guests
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <span className="text-2xl font-semibold text-foreground">
              {totalGuests}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-md font-bold text-muted-foreground uppercase tracking-wide">
              Invited
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <span className="text-2xl font-semibold text-foreground">
              {invitedCount}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-md font-bold text-muted-foreground uppercase tracking-wide">
              By Side
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            {sideCounts.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <div className="space-y-0.5">
                {sideCounts.map(({ label, count }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-md font-bold text-muted-foreground uppercase tracking-wide">
              By Relationship
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            {relationshipCounts.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <div className="space-y-0.5">
                {relationshipCounts.map(({ label, count }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-48">
                <Input
                  placeholder="Guest name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) handleAddGuest();
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                />
              </div>
              <Select
                value={newSide}
                onValueChange={(val) => setNewSide(val as string)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_SIDES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5">
                        <span>{GUEST_SIDE_ICON[s]}</span>
                        <span>{s}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newRelationship}
                onValueChange={(val) => setNewRelationship(val as string)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-1.5">
                        <span>{GUEST_RELATIONSHIP_ICON[r]}</span>
                        <span>{r}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  newInvited
                    ? "bg-sage-500 text-white border-sage-500"
                    : "bg-sage-200 text-sage-700 border-sage-200"
                }`}
                onClick={() => setNewInvited((v) => !v)}
                type="button"
              >
                {newInvited ? "Invited" : "Not Invited"}
              </button>
              <Button
                size="lg"
                className={"px-3 bg-blue-700"}
                disabled={!newName.trim()}
                onClick={handleAddGuest}
              >
                + Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {optimisticGuests.length === 0 && !showAddForm && (
        <div className="py-12 text-center text-sage-500">
          No guests yet. Click &apos;+ Add Guest&apos; to get started.
        </div>
      )}

      {/* Table */}
      {(optimisticGuests.length > 0 || showAddForm) &&
        optimisticGuests.length > 0 && (
          <div className="space-y-0">
            {/* FUTURE: sortable columns — clicking Side, Relationship, or Invited header toggles asc/desc sort order on that field */}
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_120px_80px_80px] text-sm font-medium text-sage-500 border-b border-sage-200 pb-2 px-2">
              <span>Name</span>
              {!isCollapsed && <span>Side</span>}
              {!isCollapsed && <span>Relationship</span>}
              {!isCollapsed && <span className="text-center">Invited</span>}
              <span
                className={
                  isCollapsed ? "col-span-4 flex justify-end" : "text-right"
                }
              >
                <button
                  onClick={() => setIsCollapsed((v) => !v)}
                  className="flex items-center gap-1 hover:text-sage-700 transition-colors"
                  title={isCollapsed ? "Expand rows" : "Collapse rows"}
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                  {isCollapsed ? "Expand" : "Collapse"}
                </button>
              </span>
            </div>

            {/* Guest rows */}
            <div
              className={
                isCollapsed
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "divide-y divide-sage-100"
              }
            >
              {optimisticGuests.map((g) => {
                const isEditing = editingGuestId === g.id;
                const isDeleting = deletingGuestId === g.id;

                if (isDeleting) {
                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between px-2 py-3 gap-3 flex-wrap"
                    >
                      <span className="text-sm text-destructive">
                        Delete &ldquo;{g.name}&rdquo;?
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGuest(g.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingGuestId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                if (isEditing) {
                  return (
                    <div
                      key={g.id}
                      className="grid grid-cols-[1fr_100px_120px_80px_80px] items-center gap-2 px-2 py-2"
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Select
                        value={editSide}
                        onValueChange={(val) => setEditSide(val as string)}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GUEST_SIDES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="flex items-center gap-1.5">
                                <span>{GUEST_SIDE_ICON[s]}</span>
                                <span>{s}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={editRelationship}
                        onValueChange={(val) =>
                          setEditRelationship(val as string)
                        }
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GUEST_RELATIONSHIPS.map((r) => (
                            <SelectItem key={r} value={r}>
                              <span className="flex items-center gap-1.5">
                                <span>{GUEST_RELATIONSHIP_ICON[r]}</span>
                                <span>{r}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                          editInvited
                            ? "bg-sage-500 text-white border-sage-500"
                            : "bg-amber-200 border-amber-300"
                        }`}
                        onClick={() => setEditInvited((v) => !v)}
                        type="button"
                      >
                        {editInvited ? "Yes" : "No"}
                      </button>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2 bg-blue-700"
                          disabled={!editName.trim()}
                          onClick={() => handleSaveEdit(g)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setEditingGuestId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                if (isCollapsed) {
                  return (
                    // FUTURE: clicking a collapsed row opens a modal (sheet) to view and edit the guest's full details inline
                    <div
                      key={g.id}
                      className="px-2 py-1.5 hover:bg-sage-50 border-b border-sage-100"
                    >
                      <span className="text-sage-900 font-medium truncate text-sm block">
                        {g.name}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={g.id}
                    className="grid grid-cols-[1fr_100px_120px_80px_80px] items-center px-2 py-3 hover:bg-sage-50"
                  >
                    <span className="text-sage-900 font-medium truncate">
                      {g.name}
                    </span>
                    <span className="text-sage-600 text-sm">
                      {(() => {
                        const side = GUEST_SIDE_FROM_DB[g.side ?? ""];
                        return side ? `${GUEST_SIDE_ICON[side]} ${side}` : "—";
                      })()}
                    </span>
                    <span className="text-sage-600 text-sm">
                      {g.relationship
                        ? `${GUEST_RELATIONSHIP_ICON[g.relationship as keyof typeof GUEST_RELATIONSHIP_ICON] ?? ""} ${g.relationship}`.trim()
                        : "—"}
                    </span>
                    <button
                      className={`px-1 py-1 rounded-full text-xs transition-colors ${
                        g.invited ? "bg-sage-500 text-white" : "bg-amber-200"
                      }`}
                      onClick={() => handleToggleInvited(g.id, g.invited)}
                      type="button"
                    >
                      {g.invited ? "Yes" : "No"}
                    </button>
                    <div className="flex gap-1 justify-end">
                      <button
                        aria-label={`Edit ${g.name}`}
                        className="p-1 hover:bg-muted rounded"
                        onClick={() => handleStartEdit(g)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        aria-label={`Delete ${g.name}`}
                        className="p-1 hover:bg-muted rounded"
                        onClick={() => {
                          setDeletingGuestId(g.id);
                          setEditingGuestId(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
