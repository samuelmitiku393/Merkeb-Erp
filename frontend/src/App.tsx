import React, { useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ColorModeProvider } from "./context/ThemeContext";
import { useColorMode } from "./context/colorModeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import QuickOrder from "./pages/QuickOrder";
import Inventory from "./pages/Inventory";
import CustomersPage from "./pages/CustomersPage";
import Profile from "./pages/Profile";
import { isTelegramWebApp, notifyReady, expandViewport } from "./services/telegram";

// ─── Build MUI theme – independent from Telegram's color scheme ─────────────
const buildTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#64b5f6' : '#1976d2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#f06292' : '#dc004e',
      },
      background: {
        default: isDark ? '#12121d' : '#f5f5f5',
        paper: isDark ? '#1c1c2e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f5f5f7' : '#212121',
        secondary: isDark ? '#b0b0ba' : '#757575',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : undefined,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
    },
  });
};

// ─── Routes ──────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/orders" element={
        <ProtectedRoute>
          <Layout><OrdersPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/quick-order" element={
        <ProtectedRoute>
          <Layout><QuickOrder /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <Layout><Inventory /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/customers" element={
        <ProtectedRoute>
          <Layout><CustomersPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const { mode } = useColorMode();
  // Build theme once per selected mode
  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    if (isTelegramWebApp()) {
      // Tell Telegram the app is ready to be displayed (removes loading spinner)
      notifyReady();
      // Expand to full available height
      expandViewport();
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

function Root() {
  return (
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  );
}

export default Root;