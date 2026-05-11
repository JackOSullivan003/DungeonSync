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

// Shared sx styles for text fields
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#1e1e1e',
    color: 'white',
    '& fieldset': { borderColor: '#3a3a3a' },
    '&:hover fieldset': { borderColor: '#c0392b' },
    '&.Mui-focused fieldset': { borderColor: '#c0392b' },
  },
  '& .MuiInputLabel-root': { color: '#aaa' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#c0392b' },
  '& .MuiFormHelperText-root': { color: '#e74c3c' },
}

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
        window.location.href = "/dashboard";
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
          <button className="primary" onClick={() => router.push("/")}>
            ← Home
          </button>
        }
        Title={<span>Register</span>}
      />

      <Box className="auth-content">
        <Card sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 3,
          padding: '2rem',
          backgroundColor: '#2a2a2a',
          border: '1px solid #3a3a3a',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}>
          <Typography variant="h4" align="center" sx={{
            fontWeight: 700,
            fontSize: '1.6rem',
            marginBottom: '0.8rem',
            color: 'white',
          }}>
            Create Account
          </Typography>

          <Typography align="center" sx={{
            fontWeight: 400,
            marginBottom: '1.5rem',
            color: '#aaa',
          }}>
            To use DungeonSync, register with an email
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="First Name"
              onChange={(e) => setFirst(e.target.value)}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Last Name"
              onChange={(e) => setLast(e.target.value)}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              onChange={(e) => setEmail(e.target.value)}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              onChange={(e) => setPass(e.target.value)}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              onChange={(e) => setConfirmPass(e.target.value)}
              error={!!(confirmPass && pass !== confirmPass)}
              helperText={
                confirmPass && pass !== confirmPass
                  ? "Passwords do not match."
                  : ""
              }
              sx={textFieldSx}
            />

            {msg && (
              <p className={msg.includes("created") ? "success-msg" : "error-msg"}>
                {msg}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!isFormValid}
              sx={{
                backgroundColor: '#c0392b',
                color: 'white',
                fontWeight: 700,
                marginTop: '1rem',
                padding: '0.9rem 0',
                borderRadius: '6px',
                '&:hover': { backgroundColor: '#e74c3c' },
                '&.Mui-disabled': { backgroundColor: '#555', color: '#888' },
              }}
            >
              Register
            </Button>

            <Typography sx={{ mt: 2, textAlign: 'center', color: '#aaa' }}>
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
