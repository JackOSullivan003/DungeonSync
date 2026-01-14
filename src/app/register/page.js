"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  TextField,
  Box,
  Typography,
  Card
} from "@mui/material";
import TopBar from "@/components/TopBar";

export default function RegisterPage() {
  const router = useRouter();

  const [msg, setMsg] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const isFormValid =
    firstName &&
    lastName &&
    email &&
    pass &&
    confirmPass &&
    pass === confirmPass;

  const handleSubmit = (event) => {
    event.preventDefault();
    setMsg("");

    if (pass !== confirmPass) {
      setMsg("Passwords do not match.");
      return;
    }

    runRegisterAsync(
      `/api/user/register?first=${firstName}&last=${lastName}&email=${email}&pass=${pass}`
    );
  };

  async function runRegisterAsync(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.data === "created") {
        window.location.href = "/login?created=true";
      } else {
        setMsg("User already exists.");
      }
    } catch (err) {
      setMsg("Server error — try again.");
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
        Title={<span>Register</span>}
      />

      <Box className="auth-content">
        <Card className="auth-card">
          <Typography variant="h4" align="center" className="auth-title">
            Create Account
          </Typography>

          <Typography align="center" className="auth-subtitle">
            To use DungeonSync, register with an email
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="First Name"
              onChange={(e) => setFirst(e.target.value)}
              className="auth-input"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Last Name"
              onChange={(e) => setLast(e.target.value)}
              className="auth-input"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              onChange={(e) => setPass(e.target.value)}
              className="auth-input"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              onChange={(e) => setConfirmPass(e.target.value)}
              error={confirmPass && pass !== confirmPass}
              helperText={
                confirmPass && pass !== confirmPass
                  ? "Passwords do not match."
                  : ""
              }
              className="auth-input"
            />

            {msg && (
              <p className={`msg ${msg.includes("created") ? "success-msg" : "error-msg"}`}>
                {msg}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!isFormValid}
              className="auth-btn"
            >
              Register
            </Button>

            <Typography sx={{ mt: 2, textAlign: "center" }}>
              Already have an account?{" "}
              <a href="/login" className="auth-link">
                Login
              </a>
            </Typography>
          </Box>
        </Card>
      </Box>
    </div>
  );
}
