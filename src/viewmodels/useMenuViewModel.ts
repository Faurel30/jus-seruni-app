import { useEffect, useMemo, useState } from "react";
import { createMenu, deleteMenu, getMenu, updateMenu } from "../repositories/menuRepository";
import type { Category, MenuItem } from "../models/types";

export function useMenuViewModel() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filterCat, setFilterCat] = useState<Category | "Semua">("Semua");
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    setLoading(true);
    const data = await getMenu();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadItems();
  }, []);

  const filtered = useMemo(
    () => (filterCat === "Semua" ? items : items.filter((item) => item.category === filterCat)),
    [items, filterCat],
  );

  async function addItem(payload: Omit<MenuItem, "id"> & { id?: string }) {
    const created = await createMenu({
      name: payload.name,
      category: payload.category,
      price: payload.price,
      emoji: payload.emoji,
      stock: payload.stock,
    });

    setItems((current) => [...current, { ...created, id: String(created.id) }]);
  }

  async function updateItem(id: string, payload: { name: string; category: Category; price: number; emoji: string; stock: number }) {
    const updated = await updateMenu(id, payload);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updated, id: String(updated.id) } : item)));
  }

  async function deleteItem(id: string) {
    await deleteMenu(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return {
    items,
    filtered,
    filterCat,
    loading,
    setFilterCat,
    addItem,
    updateItem,
    deleteItem,
  };
}
