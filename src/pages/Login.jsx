
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import {
  LoginRounded,
  PersonAddOutlined,
  StorefrontOutlined
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, register } = useAuth();

  const [registerMode, setRegisterMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const destination = location.state?.from || "/";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (registerMode) {
        await register(form.name, form.email, form.password);

        setSuccess("Account created! You can now sign in.");
        setRegisterMode(false);
        setForm((previous) => ({
          ...previous,
          name: "",
          password: ""
        }));
      } else {
        await login(form.email, form.password);
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setRegisterMode((previous) => !previous);
    setError("");
    setSuccess("");
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 3
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ textAlign: "center" }}>
            <StorefrontOutlined
              color="primary"
              sx={{ fontSize: 52, mb: 1 }}
            />

            <Typography
              component="h1"
              variant="h4"
              fontWeight={800}
            >
              {registerMode ? "Create Account" : "Welcome Back"}
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {registerMode
                ? "Create your MSOA Shop account."
                : "Sign in to your MSOA Shop account."}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {registerMode && (
                <TextField
                  required
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              )}

              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />

              <TextField
                required
                fullWidth
                type="password"
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete={
                  registerMode ? "new-password" : "current-password"
                }
                slotProps={{
                  htmlInput: { minLength: 6 }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : registerMode ? (
                    <PersonAddOutlined />
                  ) : (
                    <LoginRounded />
                  )
                }
                sx={{
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700
                }}
              >
                {loading
                  ? "Please wait..."
                  : registerMode
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Stack spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {registerMode
                ? "Already have an account?"
                : "Don't have an account?"}
            </Typography>

            <Button onClick={switchMode} sx={{ textTransform: "none" }}>
              {registerMode ? "Sign In" : "Create an Account"}
            </Button>
          </Stack>

          {!registerMode && (
            <Alert severity="info">
              <Typography variant="body2" fontWeight={700}>
                Demo Account
              </Typography>
              <Typography variant="body2">
                Email: demo@msoa.shop
              </Typography>
              <Typography variant="body2">
                Password: demo123
              </Typography>
            </Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
