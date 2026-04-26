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
    ListItemIcon,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
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
    Verified as VerifiedIcon,
    History as HistoryIcon,
    FilterList as FilterIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    AccessTime as TimeIcon,
    Category as CategoryIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { format } from "date-fns";

const Profile = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState(0);

    // Profile states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Audit trail states
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditPage, setAuditPage] = useState(0);
    const [auditRowsPerPage, setAuditRowsPerPage] = useState(20);
    const [totalAuditLogs, setTotalAuditLogs] = useState(0);
    const [auditFilters, setAuditFilters] = useState({
        action: '',
        entity: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        actions: [],
        entities: [],
        users: []
    });
    const [auditStats, setAuditStats] = useState(null);
    const [auditDetailDialogOpen, setAuditDetailDialogOpen] = useState(false);

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

    // Fetch audit logs when tab changes to audit trail
    useEffect(() => {
        if (activeTab === 1 && user?.role === 'admin') {
            fetchAuditLogs();
            fetchAuditStats();
        }
    }, [activeTab, auditPage, auditRowsPerPage, auditFilters]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Profile handlers
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
            setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
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
            setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
            setPasswordDialogOpen(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
        
        // Log settings change to audit
        if (user?.role === 'admin') {
            API.post('/audit/settings-change', {
                setting,
                value: newSettings[setting]
            }).catch(err => console.error('Failed to log settings change:', err));
        }
        
        setSnackbar({
            open: true,
            message: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${newSettings[setting] ? 'enabled' : 'disabled'}`,
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

    // Audit trail handlers
    const fetchAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const params = {
                page: auditPage + 1,
                limit: auditRowsPerPage,
                ...auditFilters
            };

            const response = await API.get('/audit', { params });
            
            if (response.data.success) {
                setAuditLogs(response.data.data.logs);
                setTotalAuditLogs(response.data.data.pagination.totalLogs);
                setFilterOptions(response.data.data.filters);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            setSnackbar({
                open: true,
                message: 'Failed to fetch audit logs',
                severity: 'error'
            });
        } finally {
            setAuditLoading(false);
        }
    };

    const fetchAuditStats = async () => {
        try {
            const response = await API.get('/audit/stats/overview');
            if (response.data.success) {
                setAuditStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch audit stats:', error);
        }
    };

    const handleAuditPageChange = (event, newPage) => {
        setAuditPage(newPage);
    };

    const handleAuditRowsPerPageChange = (event) => {
        setAuditRowsPerPage(parseInt(event.target.value, 10));
        setAuditPage(0);
    };

    const handleAuditFilterChange = (field, value) => {
        setAuditFilters(prev => ({ ...prev, [field]: value }));
        setAuditPage(0);
    };

    const clearAuditFilters = () => {
        setAuditFilters({
            action: '',
            entity: '',
            search: '',
            startDate: '',
            endDate: ''
        });
    };

    const viewAuditDetails = (log) => {
        setSelectedLog(log);
        setAuditDetailDialogOpen(true);
    };

    const refreshAuditLogs = () => {
        fetchAuditLogs();
        fetchAuditStats();
    };

    const getActionColor = (action) => {
        const colors = {
            CREATE: 'success',
            UPDATE: 'info',
            DELETE: 'error',
            LOGIN: 'primary',
            LOGOUT: 'default',
            PASSWORD_CHANGE: 'warning',
            PROFILE_UPDATE: 'secondary',
            SETTINGS_CHANGE: 'info',
            LOGIN_FAILED: 'error'
        };
        return colors[action] || 'default';
    };

    const formatDate = (date) => {
        try {
            return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            py: 4
        }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="600" gutterBottom>
                        Profile Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your account information and preferences
                    </Typography>
                </Box>

                {/* Tabs */}
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab 
                        icon={<PersonIcon />} 
                        iconPosition="start" 
                        label="Profile" 
                    />
                    {user?.role === 'admin' && (
                        <Tab 
                            icon={<HistoryIcon />} 
                            iconPosition="start" 
                            label="Audit Trail" 
                        />
                    )}
                </Tabs>

                {/* Profile Tab Content */}
                {activeTab === 0 && (
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
                )}

                {/* Audit Trail Tab Content */}
                {activeTab === 1 && user?.role === 'admin' && (
                    <Box>
                        {/* Audit Stats */}
                        {auditStats && (
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                        <Typography variant="h4" color="primary.main">
                                            {auditStats.todayCount}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Today's Activities
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                        <Typography variant="h4" color="info.main">
                                            {auditStats.weekCount}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            This Week
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                        <Typography variant="h4" color="success.main">
                                            {auditStats.monthCount}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            This Month
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                        <Typography variant="h4" color="warning.main">
                                            {auditStats.actionBreakdown?.[0]?.count || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Most Common: {auditStats.actionBreakdown?.[0]?._id || 'N/A'}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}

                        {/* Audit Filters */}
                        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <FilterIcon color="action" />
                                    <Typography variant="subtitle1" fontWeight="500">
                                        Filters
                                    </Typography>
                                </Stack>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={refreshAuditLogs}
                                >
                                    Refresh
                                </Button>
                            </Stack>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Search descriptions..."
                                        value={auditFilters.search}
                                        onChange={(e) => handleAuditFilterChange('search', e.target.value)}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Action</InputLabel>
                                        <Select
                                            value={auditFilters.action}
                                            onChange={(e) => handleAuditFilterChange('action', e.target.value)}
                                            label="Action"
                                        >
                                            <MenuItem value="">All Actions</MenuItem>
                                            {filterOptions.actions?.map(action => (
                                                <MenuItem key={action} value={action}>{action}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Entity</InputLabel>
                                        <Select
                                            value={auditFilters.entity}
                                            onChange={(e) => handleAuditFilterChange('entity', e.target.value)}
                                            label="Entity"
                                        >
                                            <MenuItem value="">All Entities</MenuItem>
                                            {filterOptions.entities?.map(entity => (
                                                <MenuItem key={entity} value={entity}>{entity}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="date"
                                        label="Start Date"
                                        value={auditFilters.startDate}
                                        onChange={(e) => handleAuditFilterChange('startDate', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="date"
                                        label="End Date"
                                        value={auditFilters.endDate}
                                        onChange={(e) => handleAuditFilterChange('endDate', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={1}>
                                    <Button
                                        variant="outlined"
                                        onClick={clearAuditFilters}
                                        startIcon={<ClearIcon />}
                                        fullWidth
                                        size="small"
                                    >
                                        Clear
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Audit Log Table */}
                        <Paper sx={{ borderRadius: 2 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>User</TableCell>
                                            <TableCell>Action</TableCell>
                                            <TableCell>Entity</TableCell>
                                            <TableCell>Description</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {auditLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        ) : auditLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    <Typography color="text.secondary">
                                                        No audit logs found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <TableRow key={log._id} hover>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <TimeIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                {formatDate(log.timestamp)}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <PersonIcon fontSize="small" color="action" />
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {log.performedByUsername}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {log.performedByRole}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={log.action}
                                                            size="small"
                                                            color={getActionColor(log.action)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <CategoryIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">{log.entity}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                                                            {log.description}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="View Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => viewAuditDetails(log)}
                                                            >
                                                                <SearchIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={totalAuditLogs}
                                page={auditPage}
                                onPageChange={handleAuditPageChange}
                                rowsPerPage={auditRowsPerPage}
                                onRowsPerPageChange={handleAuditRowsPerPageChange}
                                rowsPerPageOptions={[10, 20, 50, 100]}
                            />
                        </Paper>

                        {/* Audit Detail Dialog */}
                        <Dialog
                            open={auditDetailDialogOpen}
                            onClose={() => setAuditDetailDialogOpen(false)}
                            maxWidth="md"
                            fullWidth
                        >
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Audit Log Details
                                <IconButton onClick={() => setAuditDetailDialogOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent>
                                {selectedLog && (
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            This audit log is immutable and cannot be modified
                                        </Alert>
                                        
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Timestamp
                                                </Typography>
                                                <Typography variant="body2">
                                                    {formatDate(selectedLog.timestamp)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Action
                                                </Typography>
                                                <Chip
                                                    label={selectedLog.action}
                                                    size="small"
                                                    color={getActionColor(selectedLog.action)}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Entity
                                                </Typography>
                                                <Typography variant="body2">{selectedLog.entity}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Entity ID
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {selectedLog.entityId || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Performed By
                                                </Typography>
                                                <Typography variant="body2">
                                                    {selectedLog.performedByUsername} ({selectedLog.performedByRole})
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    IP Address
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {selectedLog.ipAddress || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Description
                                            </Typography>
                                            <Typography variant="body2">{selectedLog.description}</Typography>
                                        </Box>

                                        {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom color="primary">
                                                    Changes Made
                                                </Typography>
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto', maxHeight: 200 }}>
                                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                                    </pre>
                                                </Paper>
                                            </Box>
                                        )}

                                        {selectedLog.previousValues && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom color="warning.main">
                                                    Previous Values
                                                </Typography>
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto', maxHeight: 200 }}>
                                                        {JSON.stringify(selectedLog.previousValues, null, 2)}
                                                    </pre>
                                                </Paper>
                                            </Box>
                                        )}

                                        {selectedLog.newValues && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom color="success.main">
                                                    New Values
                                                </Typography>
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto', maxHeight: 200 }}>
                                                        {JSON.stringify(selectedLog.newValues, null, 2)}
                                                    </pre>
                                                </Paper>
                                            </Box>
                                        )}
                                    </Stack>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setAuditDetailDialogOpen(false)}>Close</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
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
                        <Alert severity="info" sx={{ mb: 1 }}>
                            Password must be at least 6 characters long
                        </Alert>
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
                    <Button onClick={() => {
                        setPasswordDialogOpen(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({});
                    }}>
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