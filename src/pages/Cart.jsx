
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography
} from "@mui/material";

import {
  AddRounded,
  RemoveRounded,
  DeleteOutlineRounded,
  ShoppingCartOutlined,
  ArrowForwardRounded,
  ShoppingBagOutlined
} from "@mui/icons-material";

import { useCart } from "../context/CartContext";

export default function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal
  } = useCart();

  const formatPrice = (price) =>
    `${price.toLocaleString("fr-MA")} MAD`;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography
        component="h1"
        variant="h4"
        fontWeight={800}
        sx={{ mb: 3 }}
      >
        Shopping Cart
      </Typography>

      {cart.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 4, md: 8 },
            textAlign: "center",
            borderRadius: 3
          }}
        >
          <ShoppingCartOutlined
            sx={{
              fontSize: 64,
              color: "text.disabled",
              mb: 2
            }}
          />

          <Typography variant="h6" fontWeight={700}>
            Your cart is empty
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Discover our products and start shopping.
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate("/products")}
            startIcon={<ShoppingBagOutlined />}
          >
            Browse Products
          </Button>
        </Paper>
      ) : (
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
          {/* Cart items */}
            <Stack spacing={2} sx={{ order: { xs: 2, md: 1 } }}>
            {cart.map((item) => (
              <Card
                key={item.id}
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: { xs: "100%", sm: 120 },
                        height: 120,
                        objectFit: "contain",
                        bgcolor: "#f8fafc",
                        borderRadius: 2
                      }}
                    />

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={700}>
                        {item.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.category}
                      </Typography>

                      <Typography
                        fontWeight={700}
                        color="primary.main"
                        sx={{ mt: 1 }}
                      >
                        {formatPrice(item.price)}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 2 }}
                      >
                        <IconButton
                          size="small"
                          aria-label={`Decrease ${item.name} quantity`}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <RemoveRounded />
                        </IconButton>

                        <Typography
                          fontWeight={700}
                          sx={{ minWidth: 24, textAlign: "center" }}
                        >
                          {item.quantity}
                        </Typography>

                        <IconButton
                          size="small"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <AddRounded />
                        </IconButton>

                        <Box sx={{ flexGrow: 1 }} />

                        <IconButton
                          color="error"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeFromCart(item.id)}
                        >
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Order summary */}
          <Paper
            variant="outlined"
            sx={{
                p: 3,
                borderRadius: 3,
                order: { xs: 1, md: 2 },
                position: { md: "sticky" },
                top: { md: 90 }
                }}
          >
            <Typography variant="h6" fontWeight={800}>
              Order Summary
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">
                  Subtotal
                </Typography>
                <Typography fontWeight={600}>
                  {formatPrice(cartTotal)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">
                  Shipping
                </Typography>
                <Typography color="success.main">
                  Free
                </Typography>
              </Stack>

              <Divider />

              <Stack direction="row" justifyContent="space-between">
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

              <Button
                fullWidth
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRounded />}
                onClick={() => navigate("/checkout")}
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700
                }}
              >
                Proceed to Checkout
              </Button>

              <Button
                fullWidth
                color="error"
                variant="text"
                startIcon={<DeleteOutlineRounded />}
                onClick={clearCart}
                sx={{ mt: 1, textTransform: "none" }}
                >
                Clear Cart
                </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </Container>
  );
}
