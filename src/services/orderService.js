import { apiRequest } from "./apiClient";
import { shippingService } from "./shippingService";
import { inventoryService } from "./inventoryService";
import { BACKEND_MODE, API_URLS } from "../config/backend";

const STORAGE_KEY = "msoa-shop-orders";

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

let orders = loadOrders();

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

const request = (path, options) =>
  apiRequest(API_URLS.ORDERS, path, options);

export const orderService = {
  async getOrders(userId) {
    if (!userId) throw new Error("Authentication required.");

    if (BACKEND_MODE.ORDERS === "rest") {
      return request(
        `/api/orders?userId=${encodeURIComponent(userId)}`
      );
    }

    orders = loadOrders();
    return orders.filter((order) => order.userId === userId);
  },

  async getOrderById(id) {
    if (BACKEND_MODE.ORDERS === "rest") {
      try {
        return await request(`/api/orders/${encodeURIComponent(id)}`);
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    }

    orders = loadOrders();
    return orders.find((order) => order.id === id) ?? null;
  },

  async createOrder(items, customer, userId) {
    if (!userId) throw new Error("Authentication required.");
    if (!items.length) throw new Error("Cannot create an empty order.");

    if (BACKEND_MODE.ORDERS === "rest") {
      return request("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          userId,
          customer,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });
    }

    orders = loadOrders();

    await inventoryService.reserve(
      items.map((item) => ({
        productId: item.id,
        quantity: item.quantity
      }))
    );

    const order = {
      id: crypto.randomUUID(),
      userId,
      customer,
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString()
    };

    orders.push(order);
    saveOrders();

    return order;
  },

  async updateStatus(id, status) {
    if (BACKEND_MODE.ORDERS === "rest") {
      return request(
        `/api/orders/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status })
        }
      );
    }

    orders = loadOrders();

    const order = orders.find((order) => order.id === id);
    if (!order) throw new Error("Order not found.");

    const transitions = {
      PENDING_PAYMENT: ["PAID", "CANCELLED"],
      PAID: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: []
    };

    if (!transitions[order.status]?.includes(status)) {
      throw new Error(
        `Invalid transition: ${order.status} → ${status}`
      );
    }

    order.status = status;
    saveOrders();

    return order;
  },

  async cancelOrder(id) {
    if (BACKEND_MODE.ORDERS === "rest") {
      return request(
        `/api/orders/${encodeURIComponent(id)}/cancel`,
        { method: "POST" }
      );
    }

    orders = loadOrders();

    const order = orders.find((order) => order.id === id);
    if (!order) throw new Error("Order not found.");

    if (!["PENDING_PAYMENT", "PAID"].includes(order.status)) {
      throw new Error("This order cannot be cancelled.");
    }

    const shipment = await shippingService.getShipmentByOrder(id);

    if (
      shipment &&
      !["PREPARING", "CANCELLED"].includes(shipment.status)
    ) {
      throw new Error(
        "Cannot cancel an order that has already been shipped."
      );
    }

    await inventoryService.release(
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    );

    order.status = "CANCELLED";
    saveOrders();

    return order;
  }
};
