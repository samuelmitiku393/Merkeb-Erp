import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Avatar,
  Fade,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
  Send as TelegramIcon,
} from '@mui/icons-material';
import {
  isTelegramWebApp,
  getInitData,
  getTelegramUser,
  hapticNotification,
} from '../services/telegram';

interface FormData {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login, telegramLogin } = useAuth();
  const theme = useTheme();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramAutoLogging, setTelegramAutoLogging] = useState(false);
  const [tgUser, setTgUser] = useState<{ first_name?: string; username?: string } | null>(null);

  // ── Detect Telegram environment and auto-login ────────────────────────────
  useEffect(() => {
    const inTelegram = isTelegramWebApp();
    setIsTelegram(inTelegram);

    if (inTelegram) {
      const user = getTelegramUser();
      if (user) setTgUser(user);

      // Attempt silent auto-login using validated initData
      const initData = getInitData();
      if (initData) {
        setTelegramAutoLogging(true);
        telegramLogin(initData).then((result) => {
          if (result.success) {
            hapticNotification('success');
            navigate('/');
          } else {
            // Auto-login failed – show the manual login form as fallback
            setError(result.error ?? 'Telegram login failed. Please use the form below.');
            setTelegramAutoLogging(false);
            hapticNotification('error');
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError((result as { success: false; error: string }).error || 'Login failed');
    }

    setLoading(false);
  };

  const handleTelegramLogin = async () => {
    setLoading(true);
    setError('');
    const initData = getInitData();
    const result = await telegramLogin(initData);
    if (result.success) {
      hapticNotification('success');
      navigate('/');
    } else {
      setError((result as { success: false; error: string }).error || 'Telegram login failed');
      hapticNotification('error');
    }
    setLoading(false);
  };

  // ── Loading state while auto-logging in via Telegram ─────────────────────
  if (telegramAutoLogging) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        }}
      >
        <CircularProgress size={56} sx={{ color: '#fff', mb: 3 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
          {tgUser?.first_name ? `Welcome, ${tgUser.first_name}!` : 'Signing you in…'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
          Verifying your Telegram identity
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={1000}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 4, sm: 5 },
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Avatar
              sx={{
                m: 1,
                bgcolor: 'primary.main',
                width: 64,
                height: 64,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <AdminIcon sx={{ fontSize: 36 }} />
            </Avatar>

            <Typography
              component="h1"
              variant="h4"
              sx={{ mb: 1, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px' }}
            >
              Merkeb ERP
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              {isTelegram
                ? 'Tap the button below to sign in with your Telegram account'
                : 'Enter your credentials to access your account'}
            </Typography>

            {error && (
              <Fade in={!!error}>
                <Alert
                  severity="error"
                  sx={{ width: '100%', mb: 3, borderRadius: 2, alignItems: 'center' }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* ── Telegram Login Button (shown when inside Telegram) ── */}
            {isTelegram && (
              <>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={<TelegramIcon />}
                  onClick={handleTelegramLogin}
                  id="telegram-login-button"
                  sx={{
                    mb: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    bgcolor: '#2AABEE',
                    '&:hover': {
                      bgcolor: '#1a96d6',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(42,171,238,0.4)',
                    },
                    boxShadow: '0 4px 12px rgba(42,171,238,0.3)',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {loading ? 'Signing in…' : 'Continue with Telegram'}
                </Button>

                <Divider sx={{ width: '100%', mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    or use credentials
                  </Typography>
                </Divider>
              </>
            )}

            {/* ── Standard Username/Password Form ── */}
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus={!isTelegram}
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                variant="outlined"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`,
                    }
                  }
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`,
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                endIcon={<LoginIcon />}
                sx={{
                  mt: 1,
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
              Default: <strong>admin</strong> / <strong>admin123</strong>
            </Typography>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;