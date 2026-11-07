import { inventoryService } from "../services/inventoryService";
import { shippingService } from "../services/shippingService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import {
  ArrowBackRounded,
  CheckCircleOutlineRounded,
  LockOutlined
} from "@mui/icons-material";

import { useCart } from "../context/CartContext";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    address: "",
    city: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);

  const formatPrice = (value) =>
    `${value.toLocaleString("fr-MA")} MAD`;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (loading || cart.length === 0) return;

    setLoading(true);
    setError("");

    let order = null;

    try {
      const items = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const available = await inventoryService.checkAvailability(items);

      if (!available) {
        throw new Error(
          "Some products are no longer available in the requested quantities. Please review your cart."
        );
      }

      // Ordering performs the authoritative stock reservation.
      order = await orderService.createOrder(cart, customer, user.id);

      // Payment processes the simulated transaction.
      await paymentService.processPayment(order.id, paymentMethod);

      // Shipping creates a shipment for the paid order.
      await shippingService.createShipment(order.id, {
        name: customer.name,
        address: customer.address,
        city: customer.city
      });

      clearCart();
      setCompletedOrder(order);
    } catch (err) {
      // A failed payment leaves the order pending.
      // Do not automatically retry order creation.
      setError(
        err.message ||
        "Checkout failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (completedOrder) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 5, md: 10 } }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            textAlign: "center"
          }}
        >
          <CheckCircleOutlineRounded
            color="success"
            sx={{ fontSize: 72, mb: 2 }}
          />

          <Typography variant="h4" fontWeight={800}>
            Order Confirmed!
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Your payment was successful and your order
            has been placed.
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 2, overflowWrap: "anywhere" }}
          >
            Order ID: {completedOrder.id}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 4 }}
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </Button>
        </Paper>
      </Container>
    );
  }

  if (cart.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="info">
          Your cart is empty.
        </Alert>

        <Button
          sx={{ mt: 3 }}
          onClick={() => navigate("/products")}
        >
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography
        component="h1"
        variant="h4"
        fontWeight={800}
        sx={{ mb: 3 }}
      >
        Checkout
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) minmax(280px, 1fr)"
          },
          gap: 3,
          alignItems: "start"
        }}
      >
        <Paper
          component="form"
          onSubmit={handleCheckout}
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            order: { xs: 2, md: 1 }
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={700}>
              Customer Information
            </Typography>

            <TextField
              required
              fullWidth
              label="Full Name"
              name="name"
              value={customer.name}
              onChange={handleChange}
            />

            <TextField
              required
              fullWidth
              type="email"
              label="Email"
              name="email"
              value={customer.email}
              onChange={handleChange}
            />

            <TextField
              required
              fullWidth
              label="Shipping Address"
              name="address"
              value={customer.address}
              onChange={handleChange}
            />

            <TextField
              required
              fullWidth
              label="City"
              name="city"
              value={customer.city}
              onChange={handleChange}
            />

            <Divider />

            <Typography variant="h6" fontWeight={700}>
              Payment Method
            </Typography>

            <TextField
              select
              fullWidth
              label="Payment Method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
            >
              <MenuItem value="CARD">
                Card (Simulated)
              </MenuItem>
              <MenuItem value="CASH">
                Cash on Delivery (Simulated)
              </MenuItem>
            </TextField>

            <Alert severity="info" icon={<LockOutlined />}>
              Demo checkout only. No real payments or
              payment credentials are collected.
            </Alert>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || cart.length === 0}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LockOutlined />
                )
              }
              sx={{ py: 1.5, textTransform: "none" }}
            >
              {loading
                ? "Processing..."
                : `Place Order — ${formatPrice(cartTotal)}`}
            </Button>

            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate("/cart")}
              disabled={loading}
            >
              Back to Cart
            </Button>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            order: { xs: 1, md: 2 }
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            Order Summary
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            {cart.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
              >
                <Typography variant="body2">
                  {item.name} × {item.quantity}
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ textAlign: "right", flexShrink: 0 }}
                >
                  {formatPrice(item.price * item.quantity)}
                </Typography>
              </Stack>
            ))}

            <Divider />

            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={2}
            >
              <Typography fontWeight={800}>
                Total
              </Typography>

              <Typography
                fontWeight={800}
                color="primary.main"
              >
                {formatPrice(cartTotal)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
