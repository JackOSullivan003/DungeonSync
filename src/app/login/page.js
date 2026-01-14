"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Card
} from "@mui/material";
import TopBar from "@/components/TopBar";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState("");
  const [createdMsg, setCreatedMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      setCreatedMsg("Account created! Please login to your new account.");
    }
  }, [searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const pass = data.get("pass");

    runDBCallAsync(`/api/user/login?email=${email}&pass=${pass}`);
  };

  async function runDBCallAsync(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.data === "valid") {
        router.push("/dashboard");
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      setError("Could not connect to server.");
    }
  }

  return (
    <div className="auth-page">
      <TopBar
        left={
          <button
            className="primary"
            onClick={() => router.push("/")}
          >
            ← Home
          </button>
        }
        Title={<span>Login</span>}
      />

      <Box className="auth-content">
        <Card className="auth-card">
          <Typography variant="h4" align="center" className="auth-title">
            Welcome Back
          </Typography>

          <Typography align="center" className="auth-subtitle">
            Log in to continue
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {createdMsg && (
              <p className="success-msg">{createdMsg}</p>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              className="auth-input"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="pass"
              label="Password"
              type="password"
              autoComplete="off"
              id="pass"
              className="auth-input"
            />

            {error && <p className="error-msg">{error}</p>}

            <FormControlLabel
              control={<Checkbox sx={{ color: "#DA291C" }} />}
              label="Remember me"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="auth-btn"
            >
              Sign In
            </Button>

            <Typography sx={{ mt: 2, textAlign: "center" }}>
              Don't have an account?{" "}
              <a href="/register" className="auth-link">
                Register
              </a>
            </Typography>
          </Box>
        </Card>
      </Box>
    </div>
  );
}
