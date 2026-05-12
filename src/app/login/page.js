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
}

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
    const params = new URLSearchParams({ email, pass });

    runDBCallAsync(`/api/user/login?${params.toString()}`);
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
          <button className="primary" onClick={() => router.push("/")}>
            ← Home
          </button>
        }
        Title={<span>Login</span>}
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
            Welcome Back
          </Typography>

          <Typography align="center" sx={{
            fontWeight: 400,
            marginBottom: '1.5rem',
            color: '#aaa',
          }}>
            Log in to continue
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {createdMsg && <p className="success-msg">{createdMsg}</p>}

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              sx={textFieldSx}
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
              sx={textFieldSx}
            />

            {error && <p className="error-msg">{error}</p>}

            <FormControlLabel
              control={<Checkbox sx={{ color: '#c0392b', '&.Mui-checked': { color: '#c0392b' } }} />}
              label={<Typography sx={{ color: '#aaa' }}>Remember me</Typography>}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#c0392b',
                color: 'white',
                fontWeight: 700,
                marginTop: '1rem',
                padding: '0.9rem 0',
                borderRadius: '6px',
                '&:hover': { backgroundColor: '#e74c3c' },
              }}
            >
              Sign In
            </Button>

            <Typography sx={{ mt: 2, textAlign: 'center', color: '#aaa' }}>
              Don't have an account?{" "}
              <a href="/register" className="auth-link">
                Register
              </a>
            </Typography>
          </Box>
        </Card>
      </Box>
    </div>
  )
}
