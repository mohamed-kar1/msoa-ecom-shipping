import { apiRequest } from "./apiClient";
import { BACKEND_MODE, API_URLS } from "../config/backend";

const STORAGE_KEY = "msoa-shop-shipments";

function loadShipments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveShipments(shipments) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(shipments)
  );
}

const request = (path, options) =>
  apiRequest(API_URLS.SHIPPING, path, options);

export const shippingService = {
  async getShipments() {
    if (BACKEND_MODE.SHIPPING === "rest") {
      return request("/api/shipments");
    }

    return loadShipments();
  },

  async getShipmentByOrder(orderId) {
    if (BACKEND_MODE.SHIPPING === "rest") {
      try {
        return await request(
          `/api/shipments/order/${encodeURIComponent(orderId)}`
        );
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    }

    return loadShipments().find(
      (shipment) => shipment.orderId === orderId
    ) ?? null;
  },

  async createShipment(orderId, address) {
    if (BACKEND_MODE.SHIPPING === "rest") {
      return request("/api/shipments", {
        method: "POST",
        body: JSON.stringify({ orderId, address })
      });
    }

    const shipments = loadShipments();

    if (shipments.some((s) => s.orderId === orderId)) {
      throw new Error(
        "Shipment already exists for this order."
      );
    }

    const shipment = {
      id: crypto.randomUUID(),
      orderId,
      address,
      trackingNumber: `MSOA-${crypto.randomUUID()
        .slice(0, 8)
        .toUpperCase()}`,
      status: "PREPARING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    shipments.push(shipment);
    saveShipments(shipments);

    return shipment;
  },

  async updateStatus(id, status) {
    if (BACKEND_MODE.SHIPPING === "rest") {
      return request(
        `/api/shipments/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status })
        }
      );
    }

    const shipments = loadShipments();

    const shipment = shipments.find(
      (item) => item.id === id
    );

    if (!shipment) {
      throw new Error("Shipment not found.");
    }

    const transitions = {
      PREPARING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["IN_TRANSIT"],
      IN_TRANSIT: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: []
    };

    if (!transitions[shipment.status]?.includes(status)) {
      throw new Error(
        `Invalid shipment transition: ${shipment.status} → ${status}`
      );
    }

    shipment.status = status;
    shipment.updatedAt = new Date().toISOString();

    saveShipments(shipments);

    return shipment;
  }
};
