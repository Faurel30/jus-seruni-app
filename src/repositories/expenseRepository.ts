import { apiFetch } from "./api";
import type { Expense } from "../models/types";

export async function getExpenses(): Promise<Expense[]> {
  const data = await apiFetch<Expense[]>("/expenses");
  return data.map((item) => ({
    ...item,
    id: String(item.id),
  }));
}

export async function saveExpenses(items: Expense[]) {
  return items;
}

export async function createExpense(payload: Omit<Expense, "id">) {
  return apiFetch<Expense>("/expenses", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      amount: Number(payload.amount),
    }),
  });
}

export async function updateExpense(id: string, payload: Partial<Expense>) {
  return apiFetch<Expense>(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      amount: Number(payload.amount),
    }),
  });
}

export async function deleteExpense(id: string) {
  return apiFetch<{ success: boolean; id: string }>(`/expenses/${id}`, {
    method: "DELETE",
  });
}
