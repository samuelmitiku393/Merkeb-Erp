import React, { useState, useMemo } from "react";
import {
    Box,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    AppBar,
    Toolbar,
    Typography,
    Avatar,
    Badge,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useScrollTrigger,
    useTheme,
    useMediaQuery
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    ShoppingCart as OrdersIcon,
    AddCircle as QuickOrderIcon,
    Inventory as InventoryIcon,
    Person as ProfileIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    AccountCircle as AccountCircleIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [value, setValue] = useState(location.pathname);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    
    const scrollTrigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    const handleChange = (event, newValue) => {
        setValue(newValue);
        navigate(newValue);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationMenuOpen = (event) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationMenuClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        logout();
        navigate('/login');
    };

    const handleNavigateToProfile = () => {
        handleProfileMenuClose();
        navigate('/profile');
    };

    const pageTitle = useMemo(() => {
        const titles = {
            "/": "Dashboard",
            "/orders": "Orders",
            "/quick-order": "Quick Order",
            "/inventory": "Inventory",
            "/profile": "Profile"
        };
        return titles[location.pathname] || "Dashboard";
    }, [location.pathname]);

    const navItems = [
        { label: "Dashboard", value: "/", icon: <DashboardIcon /> },
        { label: "Orders", value: "/orders", icon: <OrdersIcon /> },
        { label: "Quick Order", value: "/quick-order", icon: <QuickOrderIcon /> },
        { label: "Inventory", value: "/inventory", icon: <InventoryIcon /> },
        { label: "Profile", value: "/profile", icon: <ProfileIcon /> }
    ];

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.username) return 'U';
        return user.username.charAt(0).toUpperCase();
    };

    return (
        <Box sx={{
            pb: 7,
            minHeight: '100vh',
            bgcolor: 'background.default',
            transition: 'background-color 0.2s ease'
        }}>
            <AppBar
                position="sticky"
                elevation={scrollTrigger ? 2 : 0}
                sx={{
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(8px)',
                    backgroundColor: scrollTrigger
                        ? 'rgba(255, 255, 255, 0.95)'
                        : 'background.paper'
                }}
            >
                <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{
                                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            {pageTitle}
                        </Typography>
                    </Box>

                    <IconButton
                        color="inherit"
                        sx={{ mr: 1 }}
                        aria-label="notifications"
                        onClick={handleNotificationMenuOpen}
                    >
                        <Badge
                            badgeContent={3}
                            color="error"
                            sx={{
                                '& .MuiBadge-badge': {
                                    right: -3,
                                    top: 3,
                                }
                            }}
                        >
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <IconButton
                        sx={{ p: 0 }}
                        aria-label="user menu"
                        onClick={handleProfileMenuOpen}
                    >
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: user?.role === 'admin' ? 'secondary.main' : 'primary.main',
                                fontSize: '0.875rem',
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            {getUserInitials()}
                        </Avatar>
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        minWidth: 200,
                        overflow: 'visible',
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {user?.username || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {user?.role === 'admin' ? 'Administrator' : 'User'}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleNavigateToProfile}>
                    <ListItemIcon>
                        <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleProfileMenuClose}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                </MenuItem>
            </Menu>

            {/* Notifications Menu */}
            <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        minWidth: 280,
                        maxWidth: 320,
                        overflow: 'visible',
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Notifications
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleNotificationMenuClose}>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                            New order received
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Order #1234 - 5 minutes ago
                        </Typography>
                    </Box>
                </MenuItem>
                <MenuItem onClick={handleNotificationMenuClose}>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                            Low stock alert
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Product "Home Jersey" - 2 hours ago
                        </Typography>
                    </Box>
                </MenuItem>
                <MenuItem onClick={handleNotificationMenuClose}>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                            Payment confirmed
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Order #1230 - Yesterday
                        </Typography>
                    </Box>
                </MenuItem>
                <Divider />
                <Box sx={{ p: 1 }}>
                    <Typography 
                        variant="caption" 
                        color="primary" 
                        sx={{ 
                            cursor: 'pointer',
                            display: 'block',
                            textAlign: 'center'
                        }}
                        onClick={handleNotificationMenuClose}
                    >
                        View all notifications
                    </Typography>
                </Box>
            </Menu>

            <Box
                component="main"
                sx={{
                    p: { xs: 2, sm: 3 },
                    maxWidth: 'lg',
                    mx: 'auto',
                    width: '100%'
                }}
            >
                {children}
            </Box>

            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
                elevation={3}
            >
                <BottomNavigation
                    value={value}
                    onChange={handleChange}
                    showLabels
                    sx={{
                        height: isMobile ? 65 : 70,
                        '& .MuiBottomNavigationAction-root': {
                            minWidth: 'auto',
                            padding: '6px 0',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        },
                        '& .Mui-selected': {
                            color: 'primary.main',
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }
                        },
                        '& .MuiBottomNavigationAction-label': {
                            fontSize: '0.7rem',
                            '&.Mui-selected': {
                                fontSize: '0.75rem'
                            }
                        }
                    }}
                >
                    {navItems.map((item) => (
                        <BottomNavigationAction
                            key={item.value}
                            label={item.label}
                            value={item.value}
                            icon={item.icon}
                        />
                    ))}
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default Layout;