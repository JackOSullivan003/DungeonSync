"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from '@mui/material/InputAdornment';
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

export default function RegisterPage() {
  const [msg, setMsg] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  
  const isFormValid = firstName.length > 0 && lastName.length > 0 && email.length > 0 
  && pass.length > 0 && confirmPass.length > 0 && pass === confirmPass;

  const handleSubmit = (event) => {
    event.preventDefault();
    setMsg("");

    if (pass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    runRegisterAsync(
      `/api/register?first=${firstName}&last=${lastName}&email=${email}&pass=${pass}`
    );
  };

  async function runRegisterAsync(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.data === "created") {
        // Redirect with message
      window.location.href = "/login?created=true";
      } else {
        setMsg("User already exists.");
      }
    } catch (err) {
      setMsg("Server error — try again.");
    }
  }

  return (
    <Container
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          borderRadius: 4,
          padding: 3,
          backgroundColor: "#FFF8E1",
          boxShadow: "0px 4px 15px rgba(0,0,0,0.25)",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{ fontWeight: 800, color: "#27251F", marginBottom: 1 }}
        >
          Create Account
        </Typography>

        <Typography align="center" sx={{ marginBottom: 2, color: "#27251F" }}>
          To use DungeonSync You Must Register With An Email
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="first"
            autoFocus
            onChange={(e) => setFirst(e.target.value)}
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="last"
            autoFocus
            onChange={(e) => setLast(e.target.value)}
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="pass"
            label="Password"
            type="password"
            id="pass"
            onChange={(e) => setPass(e.target.value)}
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPass"
            label="Confirm Password"
            type="password"
            id="confirmPass"
            onChange={(e) => setConfirmPass(e.target.value)}
            error={confirmPass.length > 0 && pass !== confirmPass}    // red outline
            helperText={
              confirmPass.length > 0 && pass !== confirmPass ? "Passwords do not match." : ""
            }
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />

          {msg && (
            <p
              style={{
                fontWeight: "bold",
                color: msg.includes("created") ? "green" : "#DA291C",
              }}
            >
              {msg}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!isFormValid}
            sx={{
              mt: 3,
              backgroundColor: "#FFC72C",
              color: "#27251F",
              fontWeight: 700,
              paddingY: 1.2,
              ":hover": { backgroundColor: "#09719bff" },
            }}
          >
            Register
          </Button>

          <Typography sx={{ mt: 2, textAlign: "center" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#007bacff", fontWeight: "bold" }}>
              Login
            </a>
          </Typography>
        </Box>
      </Card>
    </Container>
  );
}