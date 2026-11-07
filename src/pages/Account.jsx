
import { useNavigate } from "react-router-dom";

import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography
} from "@mui/material";

import {
  AccountCircleOutlined,
  EmailOutlined,
  BadgeOutlined,
  ShoppingBagOutlined,
  LogoutOutlined
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";

export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography
        component="h1"
        variant="h4"
        fontWeight={800}
        sx={{ mb: 3 }}
      >
        My Account
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "center", sm: "center" },
              textAlign: { xs: "center", sm: "left" }
            }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: "primary.main"
              }}
            >
              <AccountCircleOutlined sx={{ fontSize: 44 }} />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800}>
                {user?.name}
              </Typography>

              <Typography color="text.secondary">
                MSOA Shop Customer
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <BadgeOutlined color="action" />

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Full Name
                </Typography>
                <Typography fontWeight={600}>
                  {user?.name}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <EmailOutlined color="action" />

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Email Address
                </Typography>
                <Typography
                  fontWeight={600}
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {user?.email}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <AccountCircleOutlined color="action" />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Account Role
                </Typography>
                <Typography fontWeight={600}>
                  {user?.role}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Divider />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <Button
              variant="contained"
              startIcon={<ShoppingBagOutlined />}
              onClick={() => navigate("/orders")}
              sx={{
                flex: 1,
                py: 1.5,
                textTransform: "none"
              }}
            >
              My Orders
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutOutlined />}
              onClick={handleLogout}
              sx={{
                flex: 1,
                py: 1.5,
                textTransform: "none"
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
