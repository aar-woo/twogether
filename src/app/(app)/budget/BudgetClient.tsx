"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./actions";
import { CategoryWithExpenses, ExpenseStatus } from "../../../../types/index";

interface BudgetClientProps {
  wedding: { id: string; name: string; totalBudget: number };
  categories: CategoryWithExpenses[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

function parseAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, ""));
}

export function BudgetClient({ wedding, categories }: BudgetClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  void isPending;

  // Category create state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryAmount, setCategoryAmount] = useState("");

  // Category edit state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatAmount, setEditCatAmount] = useState("");

  // Category delete state
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Accordion open/close state
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Expense create state
  const [isAddingExpenseFor, setIsAddingExpenseFor] = useState<string | null>(null);
  const [expVendor, setExpVendor] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expStatus, setExpStatus] = useState<ExpenseStatus>("pending");
  const [expDate, setExpDate] = useState("");
  const [expNote, setExpNote] = useState("");
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  // Expense edit state
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpVendor, setEditExpVendor] = useState("");
  const [editExpAmount, setEditExpAmount] = useState("");
  const [editExpStatus, setEditExpStatus] = useState<ExpenseStatus>("pending");
  const [editExpDate, setEditExpDate] = useState("");
  const [editExpNote, setEditExpNote] = useState("");

  // Expense delete state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const allocated = categories.reduce((sum, c) => sum + (c.allocated_amount ?? 0), 0);
  const spent = categories
    .flatMap((c) => c.expenses ?? [])
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const remaining = wedding.totalBudget - spent;
  const isOverAllocated = allocated > wedding.totalBudget && wedding.totalBudget > 0;

  // Toggle accordion
  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Category handlers
  function handleCancelCategory() {
    setCategoryName("");
    setCategoryAmount("");
    setIsAddingCategory(false);
    setError(null);
  }

  function handleCreateCategory() {
    if (!categoryName.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    const parsed = parseAmount(categoryAmount);
    if (isNaN(parsed) || parsed < 0) {
      setError("Amount must be a positive number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createCategory(categoryName.trim(), parsed);
      if (!result?.error) {
        setCategoryName("");
        setCategoryAmount("");
        setIsAddingCategory(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleStartEditCategory(cat: { id: string; name: string; allocated_amount: number }) {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatAmount(String(cat.allocated_amount));
    setDeletingCategoryId(null);
    setError(null);
  }

  function handleSaveCategory(id: string) {
    if (!editCatName.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    const parsed = parseAmount(editCatAmount);
    if (isNaN(parsed) || parsed < 0) {
      setError("Amount must be a positive number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(id, editCatName.trim(), parsed);
      if (!result?.error) {
        setEditingCategoryId(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDeleteCategory(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result?.error) {
        setDeletingCategoryId(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  // Expense handlers
  function handleCancelExpense() {
    setExpVendor("");
    setExpAmount("");
    setExpStatus("pending");
    setExpDate("");
    setExpNote("");
    setShowExpenseDetails(false);
    setIsAddingExpenseFor(null);
    setError(null);
  }

  function handleCreateExpense(categoryId: string) {
    if (!expVendor.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    const parsed = parseAmount(expAmount);
    if (isNaN(parsed) || parsed < 0) {
      setError("Amount must be a positive number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createExpense(
        categoryId,
        expVendor.trim(),
        parsed,
        expStatus,
        expDate || null,
        expNote || null,
      );
      if (!result?.error) {
        setExpVendor("");
        setExpAmount("");
        setExpStatus("pending");
        setExpDate("");
        setExpNote("");
        setShowExpenseDetails(false);
        setIsAddingExpenseFor(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleStartEditExpense(exp: {
    id: string;
    vendor_name: string;
    amount: number;
    status: ExpenseStatus;
    date: string | null;
    note: string | null;
  }) {
    setEditingExpenseId(exp.id);
    setEditExpVendor(exp.vendor_name);
    setEditExpAmount(String(exp.amount));
    setEditExpStatus(exp.status);
    setEditExpDate(exp.date ?? "");
    setEditExpNote(exp.note ?? "");
    setDeletingExpenseId(null);
    setError(null);
  }

  function handleSaveExpense(id: string) {
    if (!editExpVendor.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    const parsed = parseAmount(editExpAmount);
    if (isNaN(parsed) || parsed < 0) {
      setError("Amount must be a positive number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateExpense(
        id,
        editExpVendor.trim(),
        parsed,
        editExpStatus,
        editExpDate || null,
        editExpNote || null,
      );
      if (!result?.error) {
        setEditingExpenseId(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDeleteExpense(id: string) {
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (!result?.error) {
        setDeletingExpenseId(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const budgetCards = [
    { label: "Total Budget", value: wedding.totalBudget },
    { label: "Allocated", value: allocated },
    { label: "Spent", value: spent },
    { label: "Remaining", value: remaining },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground mb-6">Budget</h1>

      {/* Summary stat bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {budgetCards.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <span className="text-2xl font-semibold text-foreground">
                {formatCurrency(value)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Over-budget warning */}
      {isOverAllocated && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          Allocated total exceeds your budget by {formatCurrency(allocated - wedding.totalBudget)}.
        </div>
      )}

      {/* Category list header */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => setIsAddingCategory(true)}
          disabled={isAddingCategory}
        >
          + New Category
        </Button>
      </div>

      {/* Inline new-category form */}
      {isAddingCategory && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="$0"
              value={categoryAmount}
              onChange={(e) => setCategoryAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateCategory} size="sm">
                Add Category
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelCategory}>
                Discard
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {categories.length === 0 && !isAddingCategory && (
        <div className="py-16 text-center">
          <h2 className="text-lg font-serif text-foreground mb-2">No budget categories yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add a category to start tracking your wedding expenses.
          </p>
          <Button onClick={() => setIsAddingCategory(true)}>+ New Category</Button>
        </div>
      )}

      {/* Category accordion list */}
      <div className="space-y-2">
        {categories.map((category) => {
          const isOpen = openCategories.has(category.id);
          const isEditing = editingCategoryId === category.id;
          const isDeleting = deletingCategoryId === category.id;
          const catSpent = (category.expenses ?? [])
            .filter((e) => e.status === "paid")
            .reduce((sum, e) => sum + (e.amount ?? 0), 0);

          return (
            <div
              key={category.id}
              className={`border border-border rounded-md bg-card overflow-hidden ${isOpen ? "border-l-4 border-l-sage-400" : ""}`}
            >
              {/* Accordion header */}
              {isDeleting ? (
                <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
                  <span className="text-sm text-destructive">
                    {category.name} — Delete category and all its expenses?
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Delete Category
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCategoryId(null)}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              ) : isEditing ? (
                <div className="px-4 py-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      value={editCatAmount}
                      onChange={(e) => setEditCatAmount(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveCategory(category.id)}>
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCategoryId(null)}
                    >
                      Discard
                    </Button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              ) : (
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-base text-foreground truncate">{category.name}</span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Allocated: {formatCurrency(category.allocated_amount)}
                    </span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Spent: {formatCurrency(catSpent)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button
                      aria-label={`Edit ${category.name}`}
                      className="p-1 hover:bg-muted rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditCategory(category);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      aria-label={`Delete ${category.name}`}
                      className="p-1 hover:bg-muted rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCategoryId(category.id);
                        setEditingCategoryId(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )}

              {/* Expanded accordion body */}
              {isOpen && (
                <div className="border-t border-border">
                  {/* Expense list */}
                  <div className="divide-y divide-border">
                    {(category.expenses ?? []).map((expense) => {
                      const isEditingExp = editingExpenseId === expense.id;
                      const isDeletingExp = deletingExpenseId === expense.id;

                      if (isDeletingExp) {
                        return (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap"
                          >
                            <span className="text-sm text-destructive">
                              {expense.vendor_name} — Delete this expense?
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                Delete Expense
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingExpenseId(null)}
                              >
                                Discard
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      if (isEditingExp) {
                        return (
                          <div key={expense.id} className="px-4 py-3 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={editExpVendor}
                                onChange={(e) => setEditExpVendor(e.target.value)}
                                placeholder="Vendor name"
                                className="flex-1"
                              />
                              <Input
                                value={editExpAmount}
                                onChange={(e) => setEditExpAmount(e.target.value)}
                                placeholder="$0.00"
                                className="w-28"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                className={`px-3 py-1 rounded text-sm border ${
                                  editExpStatus === "pending"
                                    ? "bg-sage-500 text-white border-sage-500"
                                    : "border border-border text-muted-foreground"
                                }`}
                                onClick={() => setEditExpStatus("pending")}
                              >
                                Pending
                              </button>
                              <button
                                className={`px-3 py-1 rounded text-sm border ${
                                  editExpStatus === "paid"
                                    ? "bg-sage-500 text-white border-sage-500"
                                    : "border border-border text-muted-foreground"
                                }`}
                                onClick={() => setEditExpStatus("paid")}
                              >
                                Paid
                              </button>
                            </div>
                            <Input
                              type="date"
                              value={editExpDate}
                              onChange={(e) => setEditExpDate(e.target.value)}
                            />
                            <Textarea
                              value={editExpNote}
                              onChange={(e) => setEditExpNote(e.target.value)}
                              placeholder="Optional note"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveExpense(expense.id)}>
                                Save Changes
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingExpenseId(null)}
                              >
                                Discard
                              </Button>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                          </div>
                        );
                      }

                      return (
                        <div key={expense.id}>
                          <div
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer"
                            onClick={() => handleStartEditExpense(expense)}
                          >
                            <span className="text-base text-foreground flex-1 truncate">
                              {expense.vendor_name}
                            </span>
                            <span className="text-base text-foreground whitespace-nowrap">
                              {formatCurrency(expense.amount)}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                                expense.status === "paid"
                                  ? "bg-sage-100 text-sage-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {expense.status === "paid" ? "Paid" : "Pending"}
                            </span>
                            {expense.date && (
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {expense.date}
                              </span>
                            )}
                            <button
                              aria-label={`Delete ${expense.vendor_name} expense`}
                              className="p-1 hover:bg-muted rounded ml-auto shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingExpenseId(expense.id);
                                setEditingExpenseId(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                          {expense.note && (
                            <p className="text-xs text-muted-foreground px-4 pb-2">
                              {expense.note.slice(0, 60)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline expense add form */}
                  {isAddingExpenseFor === category.id ? (
                    <div className="px-4 py-3 space-y-2 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          value={expVendor}
                          onChange={(e) => setExpVendor(e.target.value)}
                          placeholder="Vendor name"
                          className="flex-1"
                          autoFocus
                        />
                        <Input
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          placeholder="$0.00"
                          className="w-28"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`px-3 py-1 rounded text-sm border ${
                            expStatus === "pending"
                              ? "bg-sage-500 text-white border-sage-500"
                              : "border border-border text-muted-foreground"
                          }`}
                          onClick={() => setExpStatus("pending")}
                        >
                          Pending
                        </button>
                        <button
                          className={`px-3 py-1 rounded text-sm border ${
                            expStatus === "paid"
                              ? "bg-sage-500 text-white border-sage-500"
                              : "border border-border text-muted-foreground"
                          }`}
                          onClick={() => setExpStatus("paid")}
                        >
                          Paid
                        </button>
                      </div>
                      {!showExpenseDetails && (
                        <button
                          className="text-sm text-muted-foreground underline underline-offset-2"
                          onClick={() => setShowExpenseDetails(true)}
                        >
                          More details
                        </button>
                      )}
                      {showExpenseDetails && (
                        <>
                          <Input
                            type="date"
                            value={expDate}
                            onChange={(e) => setExpDate(e.target.value)}
                          />
                          <Textarea
                            value={expNote}
                            onChange={(e) => setExpNote(e.target.value)}
                            placeholder="Optional note"
                            rows={2}
                          />
                        </>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleCreateExpense(category.id)}>
                          Add Expense
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelExpense}>
                          Discard
                        </Button>
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                  ) : (
                    <div className="px-4 py-3 border-t border-border">
                      <button
                        className="text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setIsAddingExpenseFor(category.id);
                          setError(null);
                        }}
                      >
                        + Add expense
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
