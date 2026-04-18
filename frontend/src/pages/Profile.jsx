import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    Grid,
    Card,
    CardContent,
    IconButton,
    Snackbar,
    Switch,
    FormControlLabel,
    useTheme,
    useMediaQuery,
    alpha,
    Fade,
    Zoom,
    Container,
    Stack,
    Badge,
    Tooltip,
    Skeleton,
    InputAdornment
} from "@mui/material";
import {
    Person as PersonIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    Help as HelpIcon,
    Logout as LogoutIcon,
    Edit as EditIcon,
    Security as SecurityIcon,
    History as HistoryIcon,
    AdminPanelSettings as AdminIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    VpnKey as VpnKeyIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    CameraAlt as CameraIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Verified as VerifiedIcon,
    ArrowForwardIos as ArrowIcon,
    NotificationsActive as NotificationsActiveIcon,
    LocalShipping as ShippingIcon,
    Inventory as InventoryIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [imageUploading, setImageUploading] = useState(false);
    
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || '',
        avatar: user?.avatar || ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});
    
    const [settings, setSettings] = useState({
        emailNotifications: true,
        orderUpdates: true,
        lowStockAlerts: true,
        darkMode: false,
        twoFactorAuth: false
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleEditProfile = () => {
        setProfileData({
            username: user?.username || '',
            email: user?.email || '',
            phone: user?.phone || '',
            location: user?.location || '',
            bio: user?.bio || '',
            avatar: user?.avatar || ''
        });
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setErrors({});
    };

    const handleProfileChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateProfile = () => {
        const newErrors = {};
        if (!profileData.username) {
            newErrors.username = 'Username is required';
        }
        if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (profileData.phone && !/^[\d\s\-+()]+$/.test(profileData.phone)) {
            newErrors.phone = 'Invalid phone format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveProfile = async () => {
        if (!validateProfile()) return;
        
        setLoading(true);
        try {
            await API.put('/auth/update-profile', profileData);
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setSnackbar({
                open: true,
                message: 'Profile updated successfully',
                severity: 'success'
            });
            setEditDialogOpen(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to update profile',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = () => {
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordErrors({});
        setPasswordDialogOpen(true);
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
        if (passwordErrors[e.target.name]) {
            setPasswordErrors({
                ...passwordErrors,
                [e.target.name]: ''
            });
        }
    };

    const validatePassword = () => {
        const newErrors = {};
        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }
        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSavePassword = async () => {
        if (!validatePassword()) return;
        
        setLoading(true);
        try {
            await API.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            setSnackbar({
                open: true,
                message: 'Password changed successfully',
                severity: 'success'
            });
            setPasswordDialogOpen(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to change password',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (setting) => {
        const newSettings = {
            ...settings,
            [setting]: !settings[setting]
        };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        
        setSnackbar({
            open: true,
            message: `${setting.replace(/([A-Z])/g, ' $1').trim()} ${newSettings[setting] ? 'enabled' : 'disabled'}`,
            severity: 'success'
        });
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImageUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            await API.post('/auth/upload-avatar', formData);
            
            setSnackbar({
                open: true,
                message: 'Avatar updated successfully',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to upload avatar',
                severity: 'error'
            });
        } finally {
            setImageUploading(false);
        }
    };

    const getUserInitials = () => {
        if (!user?.username) return 'U';
        return user.username.charAt(0).toUpperCase();
    };

    const getUserRoleColor = () => {
        return user?.role === 'admin' ? 'secondary' : 'primary';
    };

    // Activity data
    const recentActivities = [
        { icon: <HistoryIcon />, action: "Logged in", time: "Today at 10:30 AM", color: 'primary' },
        { icon: <EditIcon />, action: "Profile updated", time: "Yesterday at 3:15 PM", color: 'info' },
        { icon: <ShippingIcon />, action: "Order #1234 shipped", time: "2 days ago", color: 'success' },
        { icon: <SecurityIcon />, action: "Password changed", time: "5 days ago", color: 'warning' },
    ];

    // Statistics cards
    const statsCards = [
        { label: 'Total Orders', value: '24', icon: <ShippingIcon />, color: '#6366f1' },
        { label: 'Items in Stock', value: '156', icon: <InventoryIcon />, color: '#10b981' },
        { label: 'Notifications', value: '3', icon: <NotificationsActiveIcon />, color: '#f59e0b' },
    ];

    return (
        <Box sx={{ 
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 0.1)} 100%)`,
            py: { xs: 2, sm: 3, md: 4 }
        }}>
            <Container maxWidth="xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                        <Typography 
                            variant="h4" 
                            fontWeight="bold" 
                            gutterBottom
                            sx={{
                                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}
                        >
                            My Profile
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your account settings and preferences
                        </Typography>
                    </Box>
                </motion.div>

                {/* Mobile Tab Navigation */}
                {isMobile && (
                    <Paper 
                        elevation={0}
                        sx={{ 
                            mb: 3, 
                            p: 0.5, 
                            borderRadius: 3,
                            background: alpha(theme.palette.primary.main, 0.05),
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <Stack direction="row" spacing={1}>
                            {['Profile', 'Settings', 'Activity'].map((tab) => (
                                <Button
                                    key={tab}
                                    fullWidth
                                    variant={activeTab === tab.toLowerCase() ? 'contained' : 'text'}
                                    onClick={() => setActiveTab(tab.toLowerCase())}
                                    sx={{
                                        borderRadius: 2.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        py: 1
                                    }}
                                >
                                    {tab}
                                </Button>
                            ))}
                        </Stack>
                    </Paper>
                )}

                <Grid container spacing={3}>
                    {/* Left Column - Profile Card */}
                    {(activeTab === 'profile' || !isMobile) && (
                        <Grid item xs={12} md={4}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
                                        backdropFilter: 'blur(20px)',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`
                                    }}
                                >
                                    {/* Cover Image */}
                                    <Box
                                        sx={{
                                            height: 120,
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                            position: 'relative'
                                        }}
                                    />
                                    
                                    {/* Avatar Section */}
                                    <Box sx={{ px: 3, pb: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -6 }}>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                badgeContent={
                                                    <Tooltip title="Change Avatar">
                                                        <IconButton
                                                            component="label"
                                                            sx={{
                                                                bgcolor: 'background.paper',
                                                                boxShadow: 3,
                                                                '&:hover': { bgcolor: 'background.paper' }
                                                            }}
                                                            size="small"
                                                        >
                                                            <CameraIcon fontSize="small" />
                                                            <input
                                                                type="file"
                                                                hidden
                                                                accept="image/*"
                                                                onChange={handleAvatarUpload}
                                                                disabled={imageUploading}
                                                            />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                            >
                                                <Avatar 
                                                    sx={{ 
                                                        width: 120, 
                                                        height: 120, 
                                                        border: `4px solid ${theme.palette.background.paper}`,
                                                        boxShadow: 3,
                                                        bgcolor: getUserRoleColor(),
                                                        fontSize: '3rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                    src={profileData.avatar}
                                                >
                                                    {getUserInitials()}
                                                </Avatar>
                                            </Badge>
                                        </Box>
                                        
                                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                <Typography variant="h5" fontWeight="bold">
                                                    {user?.username || 'User'}
                                                </Typography>
                                                {user?.role === 'admin' && (
                                                    <Tooltip title="Verified Admin">
                                                        <VerifiedIcon color="primary" fontSize="small" />
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                            
                                            <Chip 
                                                label={user?.role === 'admin' ? 'Administrator' : 'User'} 
                                                color={user?.role === 'admin' ? 'secondary' : 'primary'}
                                                size="small"
                                                sx={{ mt: 1, fontWeight: 600 }}
                                                icon={user?.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                                            />
                                            
                                            {profileData.bio && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                                    {profileData.bio}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Divider />

                                    {/* Contact Information */}
                                    <Box sx={{ p: 3 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                                            CONTACT INFORMATION
                                        </Typography>
                                        
                                        <Stack spacing={2} sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <EmailIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                                    <Typography variant="body2">{user?.email || 'Not set'}</Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <PhoneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                                                    <Typography variant="body2">{user?.phone || 'Not set'}</Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <LocationIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Location</Typography>
                                                    <Typography variant="body2">{user?.location || 'Not set'}</Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <CalendarIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Member Since</Typography>
                                                    <Typography variant="body2">
                                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                                                            month: 'long', 
                                                            day: 'numeric', 
                                                            year: 'numeric' 
                                                        }) : 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Box sx={{ p: 3, pt: 0 }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<EditIcon />}
                                            fullWidth
                                            onClick={handleEditProfile}
                                            sx={{
                                                borderRadius: 3,
                                                py: 1.5,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                                }
                                            }}
                                        >
                                            Edit Profile
                                        </Button>
                                    </Box>
                                </Paper>
                            </motion.div>
                        </Grid>
                    )}

                    {/* Right Column - Settings and Activity */}
                    {(activeTab === 'settings' || activeTab === 'activity' || !isMobile) && (
                        <Grid item xs={12} md={8}>
                            <Stack spacing={3}>
                                {/* Statistics Cards */}
                                {(!isMobile || activeTab === 'profile') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    >
                                        <Grid container spacing={2}>
                                            {statsCards.map((stat, index) => (
                                                <Grid item xs={4} key={index}>
                                                    <Card 
                                                        elevation={0}
                                                        sx={{ 
                                                            borderRadius: 3,
                                                            background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                                                            border: `1px solid ${alpha(stat.color, 0.2)}`,
                                                            transition: 'transform 0.2s',
                                                            '&:hover': {
                                                                transform: 'translateY(-4px)'
                                                            }
                                                        }}
                                                    >
                                                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                            <Box sx={{ 
                                                                color: stat.color, 
                                                                mb: 1,
                                                                '& .MuiSvgIcon-root': { fontSize: 28 }
                                                            }}>
                                                                {stat.icon}
                                                            </Box>
                                                            <Typography variant="h6" fontWeight="bold">
                                                                {stat.value}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {stat.label}
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </motion.div>
                                )}

                                {/* Settings Section */}
                                {(!isMobile || activeTab === 'settings') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                    >
                                        <Paper 
                                            elevation={0}
                                            sx={{ 
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                background: alpha(theme.palette.background.paper, 0.95),
                                                backdropFilter: 'blur(20px)',
                                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                            }}
                                        >
                                            <Box sx={{ p: 3 }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                    Account Settings
                                                </Typography>
                                                
                                                <List sx={{ px: 0 }}>
                                                    {[
                                                        { 
                                                            icon: <PersonIcon />, 
                                                            primary: 'Account Information', 
                                                            secondary: 'Update your personal details',
                                                            action: handleEditProfile,
                                                            buttonText: 'Edit'
                                                        },
                                                        { 
                                                            icon: <SecurityIcon />, 
                                                            primary: 'Password & Security', 
                                                            secondary: 'Change your password and security settings',
                                                            action: handleChangePassword,
                                                            buttonText: 'Change'
                                                        },
                                                        { 
                                                            icon: <NotificationsIcon />, 
                                                            primary: 'Notifications', 
                                                            secondary: 'Manage your notification preferences',
                                                            buttonText: 'Configure'
                                                        },
                                                    ].map((item, index) => (
                                                        <ListItem 
                                                            key={index}
                                                            sx={{ 
                                                                px: 0,
                                                                py: 2,
                                                                borderBottom: index < 2 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                                                            }}
                                                            secondaryAction={
                                                                <Button 
                                                                    variant="outlined" 
                                                                    size="small"
                                                                    onClick={item.action}
                                                                    sx={{ 
                                                                        borderRadius: 2,
                                                                        textTransform: 'none',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    {item.buttonText}
                                                                </Button>
                                                            }
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 48 }}>
                                                                <Box sx={{ 
                                                                    p: 1, 
                                                                    borderRadius: 2,
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                    color: 'primary.main'
                                                                }}>
                                                                    {item.icon}
                                                                </Box>
                                                            </ListItemIcon>
                                                            <ListItemText 
                                                                primary={<Typography variant="subtitle2" fontWeight={600}>{item.primary}</Typography>}
                                                                secondary={<Typography variant="body2" color="text.secondary">{item.secondary}</Typography>}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>

                                                <Divider sx={{ my: 3 }} />

                                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                    Notification Preferences
                                                </Typography>
                                                
                                                <Stack spacing={2} sx={{ mt: 2 }}>
                                                    {[
                                                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email updates about your account' },
                                                        { key: 'orderUpdates', label: 'Order Updates', description: 'Get notified about order status changes' },
                                                        { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Be alerted when items are running low' },
                                                        { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Add an extra layer of security' },
                                                    ].map((item) => (
                                                        <Box 
                                                            key={item.key}
                                                            sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'space-between',
                                                                p: 2,
                                                                borderRadius: 3,
                                                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                                }
                                                            }}
                                                        >
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {item.label}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.description}
                                                                </Typography>
                                                            </Box>
                                                            <Switch 
                                                                checked={settings[item.key]}
                                                                onChange={() => handleSettingChange(item.key)}
                                                                color="primary"
                                                            />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                )}

                                {/* Activity Section */}
                                {(!isMobile || activeTab === 'activity') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                    >
                                        <Paper 
                                            elevation={0}
                                            sx={{ 
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                background: alpha(theme.palette.background.paper, 0.95),
                                                backdropFilter: 'blur(20px)',
                                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                            }}
                                        >
                                            <Box sx={{ p: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        Recent Activity
                                                    </Typography>
                                                    <Button 
                                                        size="small" 
                                                        endIcon={<ArrowIcon />}
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        View All
                                                    </Button>
                                                </Box>
                                                
                                                <List sx={{ px: 0 }}>
                                                    {recentActivities.map((activity, index) => (
                                                        <ListItem 
                                                            key={index}
                                                            sx={{ 
                                                                px: 0,
                                                                py: 1.5,
                                                                borderBottom: index < recentActivities.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 48 }}>
                                                                <Box sx={{ 
                                                                    p: 1, 
                                                                    borderRadius: 2,
                                                                    bgcolor: alpha(theme.palette[activity.color].main, 0.1),
                                                                    color: `${activity.color}.main`
                                                                }}>
                                                                    {activity.icon}
                                                                </Box>
                                                            </ListItemIcon>
                                                            <ListItemText 
                                                                primary={<Typography variant="body2" fontWeight={500}>{activity.action}</Typography>}
                                                                secondary={<Typography variant="caption" color="text.secondary">{activity.time}</Typography>}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>

                                                <Divider sx={{ my: 3 }} />

                                                <Stack spacing={2}>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<LogoutIcon />}
                                                        fullWidth
                                                        onClick={handleLogout}
                                                        sx={{
                                                            borderRadius: 3,
                                                            py: 1.5,
                                                            textTransform: 'none',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Logout from Account
                                                    </Button>
                                                    
                                                    <Button
                                                        variant="text"
                                                        startIcon={<HelpIcon />}
                                                        fullWidth
                                                        sx={{
                                                            borderRadius: 3,
                                                            py: 1,
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        Need Help? Contact Support
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                )}
                            </Stack>
                        </Grid>
                    )}
                </Grid>
            </Container>

            {/* Edit Profile Dialog */}
            <Dialog 
                open={editDialogOpen} 
                onClose={handleCloseEditDialog} 
                maxWidth="sm" 
                fullWidth
                fullScreen={isMobile}
                TransitionComponent={Fade}
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 0, sm: 4 },
                        background: alpha(theme.palette.background.paper, 0.98),
                        backdropFilter: 'blur(20px)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            Edit Profile
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Update your personal information
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseEditDialog}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 3 }}>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            value={profileData.username}
                            onChange={handleProfileChange}
                            error={!!errors.username}
                            helperText={errors.username}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            error={!!errors.phone}
                            helperText={errors.phone}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={profileData.location}
                            onChange={handleProfileChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocationIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Bio"
                            name="bio"
                            value={profileData.bio}
                            onChange={handleProfileChange}
                            multiline
                            rows={3}
                            placeholder="Tell us about yourself..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={handleCloseEditDialog}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveProfile} 
                        variant="contained"
                        disabled={loading}
                        startIcon={<SaveIcon />}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog 
                open={passwordDialogOpen} 
                onClose={() => setPasswordDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                fullScreen={isMobile}
                TransitionComponent={Fade}
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 0, sm: 4 },
                        background: alpha(theme.palette.background.paper, 0.98),
                        backdropFilter: 'blur(20px)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            Change Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ensure your account is using a secure password
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setPasswordDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 3 }}>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Current Password"
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            error={!!passwordErrors.currentPassword}
                            helperText={passwordErrors.currentPassword}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <VpnKeyIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                                            {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField
                            fullWidth
                            label="New Password"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            error={!!passwordErrors.newPassword}
                            helperText={passwordErrors.newPassword}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SecurityIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            error={!!passwordErrors.confirmPassword}
                            helperText={passwordErrors.confirmPassword}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CheckCircleIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={() => setPasswordDialogOpen(false)}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSavePassword} 
                        variant="contained"
                        disabled={loading}
                        startIcon={<VpnKeyIcon />}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        }}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ 
                        borderRadius: 2,
                        alignItems: 'center',
                        boxShadow: 3
                    }}
                    icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;