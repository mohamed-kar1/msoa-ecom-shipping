import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";

import { ExpandMoreOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography
} from "@mui/material";

import {
  Inventory2Outlined,
  ShoppingBagOutlined,
  CancelOutlined,
  DetailsOutlined
} from "@mui/icons-material";

import { orderService } from "../services/orderService";
import ShipmentTracker from "../components/ShipmentTracker";

const statusColors = {
  PENDING_PAYMENT: "warning",
  PAID: "success",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "error"
};

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const { user } = useAuth();

  const formatPrice = (value) =>
    `${value.toLocaleString("fr-MA")} MAD`;

  const loadOrders = async () => {
    try {
      setError("");
      const data = await orderService.getOrders(user.id);

      setOrders(
        [...data].sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setProcessingId(orderId);
    setError("");

    try {
      await orderService.cancelOrder(orderId);
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to cancel order.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography
            component="h1"
            variant="h4"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" } }}
          >
            My Orders
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            View your purchases and track their status.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 4, md: 8 },
              textAlign: "center",
              borderRadius: 3
            }}
          >
            <ShoppingBagOutlined
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />

            <Typography variant="h6" fontWeight={700}>
              No orders yet
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Your order history will appear here.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/products")}
            >
              Start Shopping
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {orders.map((order) => {
              const canCancel = ["PENDING_PAYMENT", "PAID"].includes(order.status);

              return (
                <Paper
                  key={order.id}
                  variant="outlined"
                  sx={{ borderRadius: 3, overflow: "hidden" }}
                >
                  
<Box
  sx={{
    p: { xs: 2, sm: 3 },
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap"
  }}
>
  {/* Left: Order information */}
  <Stack spacing={0.5} sx={{
    alignItems: "flex-start"
  }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="subtitle1" fontWeight={800}>
        Order #{order.id.slice(0, 8)}
      </Typography>

      <Chip
        label={order.status.replaceAll("_", " ")}
        color={statusColors[order.status] || "default"}
        size="small"
      />
    </Stack>

    <Typography variant="body2" color="text.secondary">
      {new Date(order.createdAt).toLocaleString()}
    </Typography>
  </Stack>

  {/* Right: Total */}
  <Stack direction="row" spacing={2} alignItems="center">
    <Typography fontWeight={800}>Total</Typography>

    <Typography fontWeight={800} color="primary.main">
      {formatPrice(order.total)}
    </Typography>
  </Stack>
</Box>



                  <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
                    <Accordion
                      disableGutters
                      elevation={0}
                      sx={{
                        mt: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "8px !important",
                        "&:before": { display: "none" }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreOutlined />}
                        sx={{ px: 2 }}
                      >
                        <Typography fontWeight={600}>
                          Order Details
                        </Typography>
                      </AccordionSummary>

                      <AccordionDetails sx={{ px: 2, pt: 0 }}>
                        {order.items.map((item) => (
                      

<Box
  key={item.productId}
  sx={{
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 2,
    width: "100%"
  }}
>
  <Box sx={{ minWidth: 0, textAlign: "left" }}>
    <Typography fontWeight={900} 
      color="text.primary"
    >
      {item.name}
    </Typography>

    <Typography
      variant="body2"
      color="text.secondary"
    >
      Quantity: {item.quantity}
    </Typography>
  </Box>

  <Typography
    fontWeight={600}
    sx={{
      textAlign: "right",
      whiteSpace: "nowrap"
    }}
  >
    {formatPrice(item.price * item.quantity)}
  </Typography>
</Box>
                    ))}
                      </AccordionDetails>
                    </Accordion>

                    

                    {canCancel && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlined />}
                        disabled={processingId === order.id}
                        onClick={() => handleCancel(order.id)}
                        sx={{
                          alignSelf: { xs: "stretch", sm: "flex-end" },
                          textTransform: "none"
                        }}
                      >
                        {processingId === order.id
                          ? "Cancelling..."
                          : "Cancel Order"}
                      </Button>
                    )}

                    {order.status !== "CANCELLED" && (
                      <ShipmentTracker orderId={order.id} />
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
