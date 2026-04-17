import React, { useState } from "react";
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    Chip,
    Button
} from "@mui/material";
import {
    Notifications as NotificationsIcon,
    Circle as CircleIcon,
    CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Low Stock Alert", message: "Product A is running low", type: "warning", read: false, time: "5 min ago" },
        { id: 2, title: "Order Received", message: "New order #12345", type: "info", read: false, time: "10 min ago" },
        { id: 3, title: "Payment Received", message: "Payment for order #12344", type: "success", read: true, time: "1 hour ago" },
    ]);
    const navigate = useNavigate();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getTypeColor = (type) => {
        switch (type) {
            case 'warning': return 'warning';
            case 'success': return 'success';
            default: return 'primary';
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 320, maxHeight: 400 }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip label={`${unreadCount} new`} size="small" color="primary" />
                    )}
                </Box>
                <Divider />
                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography color="text.secondary">
                            All caught up!
                        </Typography>
                    </Box>
                ) : (
                    notifications.map((notification) => (
                        <MenuItem
                            key={notification.id}
                            onClick={() => {
                                markAsRead(notification.id);
                                if (notification.title.includes("Order")) {
                                    navigate('/orders');
                                } else if (notification.title.includes("Stock")) {
                                    navigate('/inventory');
                                }
                                handleClose();
                            }}
                            sx={{
                                py: 1.5,
                                borderLeft: notification.read ? 'none' : '3px solid',
                                borderColor: `${getTypeColor(notification.type)}.main`,
                                bgcolor: notification.read ? 'transparent' : 'action.hover'
                            }}
                        >
                            <Box sx={{ width: '100%' }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                                        {notification.title}
                                    </Typography>
                                    {!notification.read && (
                                        <CircleIcon sx={{ fontSize: 8, color: `${getTypeColor(notification.type)}.main` }} />
                                    )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {notification.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {notification.time}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                )}
                <Divider />
                <Box sx={{ p: 1 }}>
                    <Button
                        size="small"
                        fullWidth
                        onClick={() => {
                            setNotifications(notifications.map(n => ({ ...n, read: true })));
                            handleClose();
                        }}
                    >
                        Mark all as read
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default NotificationBell;