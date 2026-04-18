import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Button,
    Divider,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    Grid,
    IconButton,
    Snackbar,
    Switch,
    useTheme,
    Container,
    Stack,
    Badge,
    Tooltip,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from "@mui/material";
import {
    Person as PersonIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon,
    Edit as EditIcon,
    Security as SecurityIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    VpnKey as VpnKeyIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    CameraAlt as CameraIcon,
    Verified as VerifiedIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const Profile = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        twoFactorAuth: false
    });

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

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateProfile = () => {
        const newErrors = {};
        if (!profileData.username) newErrors.username = 'Username is required';
        if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            newErrors.email = 'Invalid email format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveProfile = async () => {
        if (!validateProfile()) return;

        setLoading(true);
        try {
            await API.put('/auth/update-profile', profileData);
            localStorage.setItem('user', JSON.stringify({ ...user, ...profileData }));
            setSnackbar({ open: true, message: 'Profile updated', severity: 'success' });
            setEditDialogOpen(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Update failed',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validatePassword = () => {
        const newErrors = {};
        if (!passwordData.currentPassword) newErrors.currentPassword = 'Required';
        if (!passwordData.newPassword) newErrors.newPassword = 'Required';
        else if (passwordData.newPassword.length < 6) newErrors.newPassword = 'Min 6 characters';
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
            setSnackbar({ open: true, message: 'Password changed', severity: 'success' });
            setPasswordDialogOpen(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Change failed',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (setting) => {
        const newSettings = { ...settings, [setting]: !settings[setting] };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        setSnackbar({
            open: true,
            message: `${setting} ${newSettings[setting] ? 'enabled' : 'disabled'}`,
            severity: 'success'
        });
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            await API.post('/auth/upload-avatar', formData);
            setSnackbar({ open: true, message: 'Avatar updated', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Upload failed', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getUserInitials = () => {
        return user?.username ? user.username.charAt(0).toUpperCase() : 'U';
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            py: 4
        }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="600" gutterBottom>
                        Profile Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your account information and preferences
                    </Typography>
                </Box>

                <Stack spacing={3}>
                    {/* Profile Card */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Stack spacing={3}>
                            {/* Avatar Section */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        <Tooltip title="Change photo">
                                            <IconButton
                                                component="label"
                                                sx={{
                                                    bgcolor: 'background.paper',
                                                    boxShadow: 2,
                                                    width: 32,
                                                    height: 32
                                                }}
                                            >
                                                <CameraIcon sx={{ fontSize: 16 }} />
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    }
                                >
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            bgcolor: user?.role === 'admin' ? 'secondary.main' : 'primary.main',
                                            fontSize: 32
                                        }}
                                        src={profileData.avatar}
                                    >
                                        {getUserInitials()}
                                    </Avatar>
                                </Badge>
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="h6" fontWeight="600">
                                            {user?.username || 'User'}
                                        </Typography>
                                        {user?.role === 'admin' && (
                                            <VerifiedIcon color="primary" fontSize="small" />
                                        )}
                                    </Stack>
                                    <Chip
                                        label={user?.role === 'admin' ? 'Administrator' : 'User'}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Box>

                            <Divider />

                            {/* Contact Info */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="caption" color="text.secondary">Email</Typography>
                                        <Typography variant="body2">{user?.email || 'Not set'}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="caption" color="text.secondary">Phone</Typography>
                                        <Typography variant="body2">{user?.phone || 'Not set'}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="caption" color="text.secondary">Location</Typography>
                                        <Typography variant="body2">{user?.location || 'Not set'}</Typography>
                                    </Stack>
                                </Grid>
                            </Grid>

                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={handleEditProfile}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Edit Profile
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Settings Card */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                            Settings
                        </Typography>

                        <List disablePadding>
                            <ListItem
                                secondaryAction={
                                    <Button
                                        variant="text"
                                        onClick={() => setPasswordDialogOpen(true)}
                                    >
                                        Change
                                    </Button>
                                }
                                sx={{ px: 0 }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <SecurityIcon color="action" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Password"
                                    secondary="Change your password"
                                />
                            </ListItem>

                            <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <NotificationsIcon color="action" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Email Notifications"
                                    secondary="Receive email updates"
                                />
                                <Switch
                                    checked={settings.emailNotifications}
                                    onChange={() => handleSettingChange('emailNotifications')}
                                />
                            </ListItem>

                            <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <NotificationsIcon color="action" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Order Updates"
                                    secondary="Get notified about orders"
                                />
                                <Switch
                                    checked={settings.orderUpdates}
                                    onChange={() => handleSettingChange('orderUpdates')}
                                />
                            </ListItem>

                            <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <SecurityIcon color="action" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Two-Factor Authentication"
                                    secondary="Extra security layer"
                                />
                                <Switch
                                    checked={settings.twoFactorAuth}
                                    onChange={() => handleSettingChange('twoFactorAuth')}
                                />
                            </ListItem>
                        </List>

                        <Divider sx={{ my: 2 }} />

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            fullWidth
                        >
                            Sign Out
                        </Button>
                    </Paper>
                </Stack>
            </Container>

            {/* Edit Profile Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Edit Profile
                    <IconButton onClick={() => setEditDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2.5}>
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
                                        <PersonIcon fontSize="small" />
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
                                        <EmailIcon fontSize="small" />
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
                                        <PhoneIcon fontSize="small" />
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
                                        <LocationIcon fontSize="small" />
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
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setEditDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveProfile}
                        variant="contained"
                        disabled={loading}
                        startIcon={<SaveIcon />}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Change Password
                    <IconButton onClick={() => setPasswordDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2.5}>
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
                                        <VpnKeyIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            edge="end"
                                            size="small"
                                        >
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
                                        <SecurityIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            edge="end"
                                            size="small"
                                        >
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
                                        <CheckCircleIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setPasswordDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSavePassword}
                        variant="contained"
                        disabled={loading}
                        startIcon={<VpnKeyIcon />}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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
                    sx={{ borderRadius: 2 }}
                    icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;