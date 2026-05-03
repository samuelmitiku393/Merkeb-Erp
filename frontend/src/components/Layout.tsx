import React, { useState } from "react";
import {
    Box,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    AppBar,
    Toolbar,
    Typography,
    useScrollTrigger,
    useTheme,
    useMediaQuery
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    ShoppingCart as OrdersIcon,
    AddCircle as QuickOrderIcon,
    Inventory as InventoryIcon,
    Person as ProfileIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
    children: React.ReactNode;
}

interface NavItem {
    label: string;
    value: string;
    icon: React.ReactElement;
}

const Layout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: _user, logout: _logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [value, setValue] = useState<string>(location.pathname);

    const scrollTrigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
        navigate(newValue);
    };

    const navItems: NavItem[] = [
        { label: "Dashboard", value: "/", icon: <DashboardIcon /> },
        { label: "Orders", value: "/orders", icon: <OrdersIcon /> },
        { label: "Quick Order", value: "/quick-order", icon: <QuickOrderIcon /> },
        { label: "Inventory", value: "/inventory", icon: <InventoryIcon /> },
        { label: "Profile", value: "/profile", icon: <ProfileIcon /> }
    ];

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
                            Merkeb ERP
                        </Typography>
                        {/* Optional: Show page subtitle below the main title */}
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                display: 'block',
                                mt: -0.5
                            }}
                        >

                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>

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