
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AccountCircleOutlined,
  LogoutOutlined
} from "@mui/icons-material";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  Divider,
  Stack
} from "@mui/material";

import {
  StorefrontOutlined,
  ShoppingCartOutlined,
  MenuRounded,
  HomeOutlined,
  Inventory2Outlined,
  LoginOutlined
} from "@mui/icons-material";

import { Badge } from "@mui/material";
import { useCart } from "../context/CartContext";


export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerNavigate = useNavigate();
  
  const navigate = (path) => {
    setMobileOpen(false);
    routerNavigate(path);
  };

  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navigation = [
    { label: "Home", path: "/", icon: <HomeOutlined /> },
    { label: "Products", path: "/products", icon: <Inventory2Outlined /> },
    {
      label: "Orders",
      path: "/orders",
      icon: <Inventory2Outlined />
    },
    {
      label: "Cart",
      path: "/cart",
      icon: (
        <Badge badgeContent={cartCount} color="error" max={99}>
          <ShoppingCartOutlined />
        </Badge>
      )
    },
    ...(!isAuthenticated
    ? [
        {
          label: "Login",
          path: "/login",
          icon: <LoginOutlined />
        }
      ]
    : [
        {
          label: user?.name || "Account",
          path: "/account",
          icon: <AccountCircleOutlined />
        }
      ]),
    
  ];

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 70 }}>
            <StorefrontOutlined sx={{ mr: 1 }} />

            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ flexGrow: 1, cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              MSOA Shop
            </Typography>

            {/* Desktop navigation */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              {navigation.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600
                  }}
                >
                  {item.path === "/cart" ? (
                    <Badge
                      badgeContent={cartCount}
                      color="error"
                      max={99}
                      sx={{ mr: 1 }}
                    >
                      <ShoppingCartOutlined />
                    </Badge>
                  ) : item.label}
                </Button>
              ))}

              {isAuthenticated && (
                <Button
                  color="inherit"
                  startIcon={<LogoutOutlined />}
                  onClick={handleLogout}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Logout
                </Button>
              )}
            </Stack>

            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: "flex", md: "none" } }}
            >
              <MenuRounded />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile navigation drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", md: "none" } }}
        slotProps={{
          paper: {
            sx: { width: "min(280px, 85vw)" }
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800}>
            MSOA Shop
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1 }}>
          {navigation.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          {isAuthenticated && (
            <ListItemButton
              color="inherit"
              startIcon={<LogoutOutlined />}
              onClick={handleLogout}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutOutlined/>
              </ListItemIcon>

              <ListItemText primary={"Logout"} />
            </ListItemButton>
          )}
        </List>
      </Drawer>
    </>
  );
}
