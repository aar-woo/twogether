"use client";

import { Guest } from "../../../../types/index";

interface GuestClientProps {
  weddingId: string;
  guests: Guest[];
}

export function GuestClient({ weddingId: _weddingId, guests }: GuestClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-sage-900">Guest List</h1>
      <p className="text-sage-600">{guests.length} guests</p>
    </div>
  );
}
