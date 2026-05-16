import React, { useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import QuickOrder from "./pages/QuickOrder";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import {
  isTelegramWebApp,
  notifyReady,
  expandViewport,
  getColorScheme,
  getThemeParams,
} from "./services/telegram";

// ─── Build MUI theme – merges Telegram theme params when inside TMA ──────────
const buildTheme = () => {
  const inTelegram = isTelegramWebApp();
  const tgParams = inTelegram ? getThemeParams() : {};
  const colorScheme = inTelegram ? getColorScheme() : 'light';
  const isDark = colorScheme === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        // Use Telegram button colour if available, otherwise our brand blue
        main: tgParams.button_color ?? '#1976d2',
        contrastText: tgParams.button_text_color ?? '#ffffff',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: tgParams.bg_color ?? (isDark ? '#1a1a2e' : '#f5f5f5'),
        paper: tgParams.secondary_bg_color ?? (isDark ? '#16213e' : '#ffffff'),
      },
      text: {
        primary: tgParams.text_color ?? (isDark ? '#ffffff' : '#212121'),
        secondary: tgParams.hint_color ?? (isDark ? '#b0b0b0' : '#757575'),
      },
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
  // Build theme once (re-computed if Telegram params are available)
  const theme = useMemo(() => buildTheme(), []);

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

export default App;