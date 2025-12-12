import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  CssBaseline,
  // Container, // Removed Container
} from "@mui/material"; // Added CssBaseline
import LLMChat from "./components/LLMChat";
// import "./App.css"; // Removed as Material-UI handles most styling

function App() {
  const [allowWrite, setAllowWrite] = useState<boolean>(false);
  const [allowDelete, setAllowDelete] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config", {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
          },
        });
        if (response.ok) {
          const config = await response.json();
          setAllowWrite(config.allowWrite);
          setAllowDelete(config.allowDelete);
        } else {
          console.error("Error fetching config:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };
    fetchConfig();
  }, []);

  return (
    <Router>
      <CssBaseline /> {/* Resets CSS to a consistent baseline */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          height: "100%", // Ensure App takes full height
          width: "100%", // Ensure the box takes full width
          m: 0, // Remove default margin
        }}
      >
        <AppBar position="static" sx={{ bgcolor: "#212121" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AI File Assistant
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Chip
                label={`Allowed Root: /Users/danylolepetynskyi/`}
                color="primary"
                size="small"
                sx={{ bgcolor: "#424242" }}
              />
              <Chip
                label={`Write: ${allowWrite ? "✅ Enabled" : "❌ Disabled"}`}
                color={allowWrite ? "success" : "error"}
                size="small"
              />
              <Chip
                label={`Delete: ${allowDelete ? "✅ Enabled" : "❌ Disabled"}`}
                color={allowDelete ? "success" : "error"}
                size="small"
              />
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 0, m: 0, width: "100%" }} // Removed padding and margin, set width to 100%
        >
          {" "}
          {/* Replaced Container with Box and adjusted styling */}
          <Routes>
            <Route path="/" element={<LLMChat />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
