"use client";

import { useEffect, useState } from "react"
import { redirect, useRouter } from "next/navigation"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import Container from "@mui/material/Container"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Card from "@mui/material/Card"
import { useSearchParams } from "next/navigation"
import TopBar from "@/components/TopBar"

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [createdMsg, setCreatedMsg] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      setCreatedMsg("Account created! please login to your new account.")
    }
  })

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const data = new FormData(event.currentTarget);

    let email = data.get("email");
    let pass = data.get("pass");

    runDBCallAsync(`/api/user/login?email=${email}&pass=${pass}`
    );
  };

  async function runDBCallAsync(url) {
    try {
      const res = await fetch(url, { method: "GET" });
      const data = await res.json();
      console.log(data.data);
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
    <Container
    sx={{
      height: "100vh",
      width: "100vh", 
      justifyContent: "center",
      alignItems: "center",
      padding: 2,
    }}
    >
    <TopBar left={
          <div>
            <button
                className="topbar-back-btn"
                onClick={() => router.push('/')}
              >
              ← Home
            </button>
          </div>
        } Title={<span>Login</span>} />


      <Card
        sx={{
          width: "100%",
          borderRadius: 4,
          padding: 3,
          backgroundColor: "#FFF8E1", // McDonald's cream color
          boxShadow: "0px 4px 15px rgba(0,0,0,0.25)",
        }}
      >
        <Typography
          variant="h4" align="center" sx={{ fontWeight: 800, marginBottom: 1 }}
        >
          Welcome Back
        </Typography>
        
        <Typography
          align="center" sx={{ marginBottom: 3 }}
        >
          login in to continue
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {createdMsg && (
            <p style={{ color: "green", fontWeight: "bold", marginBottom: "10px" }}>
            {createdMsg}
            </p>
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
            sx={{ backgroundColor: "white", borderRadius: 1 }}
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
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          />

          {error && (
            <p style={{ color: "#DA291C", fontWeight: "bold" }}>{error}</p>
          )}

          <FormControlLabel
            control={<Checkbox sx={{ color: "#DA291C" }} />}
            label="Remember me"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              backgroundColor: "blue", // McDonald's yellow
              color: "#27251F",
              fontWeight: 700,
              paddingY: 1.2,
              ":hover": { backgroundColor: "#09719bff" },
            }}
          >
            Sign In
          </Button>

          <Typography sx={{ mt: 2, textAlign: "center" }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "#007bacff", fontWeight: "bold" }}>
              Register
            </a>
          </Typography>
        </Box>
      </Card>
    </Container>
  );
}