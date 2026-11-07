import { apiRequest } from "./apiClient";
import { products } from "../data/products";
import { BACKEND_MODE, API_URLS } from "../config/backend";


export const catalogService = {
  async getProducts() {
    if (BACKEND_MODE.CATALOG === "mock") {
      return products;
    }

    return apiRequest(API_URLS.CATALOG, "/products");
  },

  async getProductById(id) {
    if (BACKEND_MODE.CATALOG === "mock") {
      return products.find(
        (p) => String(p.id) === String(id)
      ) ?? null;
    }

    try {
      return await apiRequest(
        API_URLS.CATALOG,
        `/products/${encodeURIComponent(id)}`
      );
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }
};
