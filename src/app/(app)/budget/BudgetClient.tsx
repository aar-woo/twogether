"use client";

import { CategoryWithExpenses } from "../../../../types/index";

interface BudgetClientProps {
  wedding: { id: string; name: string; totalBudget: number };
  categories: CategoryWithExpenses[];
}

export function BudgetClient({ wedding: _wedding, categories: _categories }: BudgetClientProps) {
  return <div>Budget page placeholder</div>;
}
