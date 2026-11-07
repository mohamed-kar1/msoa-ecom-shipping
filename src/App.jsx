import { useNavigate, Routes, Route } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography
} from "@mui/material";

import {
  ArrowForwardRounded,
  StorefrontOutlined
} from "@mui/icons-material";

import Navbar from "./components/Navbar";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from './pages/Orders';
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Account from "./pages/Account";

export default function App() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc"
      }}
    >
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <Box component="main">
              <Container
                maxWidth="lg"
                sx={{
                  py: { xs: 4, sm: 6, md: 10 }
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    px: { xs: 3, sm: 5, md: 8 },
                    py: { xs: 6, sm: 8, md: 12 },
                    borderRadius: { xs: 3, md: 5 },
                    bgcolor: "#e3f2fd",
                    textAlign: "center"
                  }}
                >
                  <Stack
                    spacing={{ xs: 2, md: 3 }}
                    alignItems="center"
                  >
                    <div>
                      <StorefrontOutlined
                        sx={{
                          fontSize: { xs: 48, md: 64 },
                          color: "primary.main"
                        }}
                      />

                      <Typography
                        component="h1"
                        variant="h2"
                        fontWeight={800}
                        sx={{
                          fontSize: {
                            xs: "2rem",
                            sm: "2.75rem",
                            md: "3.75rem"
                          },
                          lineHeight: 1.15
                        }}
                      >
                        Welcome to MSOA Shop
                      </Typography>
                    </div>

                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{
                        fontSize: {
                          xs: "1rem",
                          md: "1.25rem"
                        },
                      }}
                    >
                      Discover great products at great prices.
                      Your next favorite item is just a click away.
                    </Typography>

                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardRounded />}
                      onClick={() => navigate("/products")}
                      sx={{
                        mt: 2,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        width: { xs: "100%", sm: "auto" },
                        maxWidth: { xs: 320, sm: "none" },
                        textTransform: "none",
                        fontWeight: 600
                      }}
                    >
                      Explore Products
                    </Button>
                  </Stack>
                </Paper>
              </Container>
            </Box>
          }
        />

        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />

        {/* Authentication required */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />
        </Route>

      </Routes>

    </Box>
  );


}
