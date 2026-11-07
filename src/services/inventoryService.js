import { apiRequest } from "./apiClient";
import { products } from "../data/products";
import { BACKEND_MODE, API_URLS } from "../config/backend";

const STORAGE_KEY = "msoa-shop-inventory";

function loadInventory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Use initial stock
  }

  return Object.fromEntries(
    products.map((p) => [p.id, p.stock])
  );
}

let inventory = loadInventory();

function refreshInventory() {
  inventory = loadInventory();
}

function saveInventory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

const request = (path, options) =>
  apiRequest(API_URLS.INVENTORY, path, options);

export const inventoryService = {
  async getStock(productId) {
    if (BACKEND_MODE.INVENTORY === "rest") {
      const data = await request(
        `/api/inventory/${encodeURIComponent(productId)}`
      );
      return data.stock;
    }

    refreshInventory();
    return inventory[productId] ?? 0;
  },

  async checkAvailability(items) {
    if (BACKEND_MODE.INVENTORY === "rest") {
      const data = await request("/api/inventory/check", {
        method: "POST",
        body: JSON.stringify({ items })
      });
      return data.available;
    }

    refreshInventory();
    return items.every(
      (item) =>
        item.quantity > 0 &&
        (inventory[item.productId] ?? 0) >= item.quantity
    );
  },

  async reserve(items) {
    if (BACKEND_MODE.INVENTORY === "rest") {
      return request("/api/inventory/reserve", {
        method: "POST",
        body: JSON.stringify({ items })
      });
    }

    refreshInventory();

    if (!(await this.checkAvailability(items))) {
      throw new Error("Insufficient stock.");
    }

    for (const item of items) {
      inventory[item.productId] -= item.quantity;
    }

    saveInventory();
    return { success: true };
  },

  async release(items) {
    if (BACKEND_MODE.INVENTORY === "rest") {
      return request("/api/inventory/release", {
        method: "POST",
        body: JSON.stringify({ items })
      });
    }

    refreshInventory();

    for (const item of items) {
      if (!(item.productId in inventory)) {
        throw new Error(`Unknown product: ${item.productId}`);
      }
    }

    for (const item of items) {
      inventory[item.productId] += item.quantity;
    }

    saveInventory();
    return { success: true };
  }
};
