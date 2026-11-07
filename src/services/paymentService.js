import { apiRequest } from "./apiClient";
import { orderService } from "./orderService";
import { BACKEND_MODE, API_URLS } from "../config/backend";

const STORAGE_KEY = "msoa-shop-payments";

function loadPayments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function savePayments(payments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

const request = (path, options) =>
  apiRequest(API_URLS.PAYMENTS, path, options);

export const paymentService = {
  async getPayments() {
    if (BACKEND_MODE.PAYMENTS === "rest") {
      return request("/api/payments");
    }

    return loadPayments();
  },

  async getPaymentByOrder(orderId) {
    if (BACKEND_MODE.PAYMENTS === "rest") {
      try {
        return await request(
          `/api/payments/order/${encodeURIComponent(orderId)}`
        );
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    }

    return loadPayments().find(
      (payment) => payment.orderId === orderId
    ) ?? null;
  },

  async processPayment(orderId, method = "CARD") {
    if (BACKEND_MODE.PAYMENTS === "rest") {
      return request("/api/payments", {
        method: "POST",
        body: JSON.stringify({ orderId, method })
      });
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "PENDING_PAYMENT") {
      throw new Error("Order is not awaiting payment.");
    }

    const existing = await this.getPaymentByOrder(orderId);

    if (existing) {
      throw new Error(
        "Payment already attempted for this order."
      );
    }

    // Simulated payment: always succeeds.
    const payment = {
      id: crypto.randomUUID(),
      orderId,
      amount: order.total,
      method,
      status: "SUCCESS",
      createdAt: new Date().toISOString()
    };

    const payments = loadPayments();
    payments.push(payment);
    savePayments(payments);

    await orderService.updateStatus(orderId, "PAID");

    return payment;
  }
};
