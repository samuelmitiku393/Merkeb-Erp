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
    useMediaQuery,
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
    Collapse,
    Card,
    CardContent,
    LinearProgress,
    Checkbox,
    FormControlLabel,
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
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    CalendarMonth as CalendarIcon,
    TrendingUp as TrendingUpIcon,
    DeleteForever as DeleteForeverIcon,
    Storage as StorageIcon,
    WarningAmber as WarningAmberIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
    Speed as SpeedIcon,
    Backup as BackupIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    ChevronRight as ChevronRightIcon,
    ShoppingCart as ShoppingCartIcon,
    Inventory as InventoryIcon,
    People as PeopleIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { format } from "date-fns";
import type { AuditLog, AuditFilters, AuditFilterOptions, AuditStats, SnackbarState } from "../types";
import type { ChipProps } from "@mui/material";

interface DatabaseStats {
    orders: number;
    products: number;
    customers: number;
    auditLogs: number;
    nonAdminUsers: number;
}

interface ProfileData {
    username: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    avatar: string;
}

interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface UserSettings {
    emailNotifications: boolean;
    orderUpdates: boolean;
    twoFactorAuth: boolean;
}

interface ReportPreview {
    url: string;
    type: string;
    month: number | null;
    year: number;
}

const Profile = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout } = useAuth();

    // Tab state (0: Profile, 1: Audit Trail, 2: Reports, 3: Reset & System)
    const [activeTab, setActiveTab] = useState(0);

    // Database Reset & Management states
    const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
    const [dbStatsLoading, setDbStatsLoading] = useState(false);
    const [backupsList, setBackupsList] = useState<any[]>([]);
    const [backupsLoading, setBackupsLoading] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState("");
    const [resetBackupOption, setResetBackupOption] = useState(true);
    const [resetUsersOption, setResetUsersOption] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);

    // Profile states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Audit trail states
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditPage, setAuditPage] = useState(0);
    const [auditRowsPerPage, setAuditRowsPerPage] = useState(20);
    const [totalAuditLogs, setTotalAuditLogs] = useState(0);
    const [auditFilters, setAuditFilters] = useState<AuditFilters>({
        action: '',
        entity: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [filterOptions, setFilterOptions] = useState<AuditFilterOptions>({
        actions: [],
        entities: [],
        users: []
    });
    const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
    const [auditDetailDialogOpen, setAuditDetailDialogOpen] = useState(false);
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    // Report states
    const [reportType, setReportType] = useState("monthly");
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportLoading, setReportLoading] = useState(false);
    const [reportProgress, setReportProgress] = useState(0);
    const [reportPreview, setReportPreview] = useState<ReportPreview | null>(null);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    const [profileData, setProfileData] = useState<ProfileData>({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || '',
        avatar: user?.avatar || ''
    });

    const [passwordData, setPasswordData] = useState<PasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    const [settings, setSettings] = useState<UserSettings>({
        emailNotifications: true,
        orderUpdates: true,
        twoFactorAuth: false
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    // Fetch database record statistics
    const fetchDatabaseStats = async () => {
        setDbStatsLoading(true);
        try {
            const res = await API.get('/admin/database-stats');
            const data = res.data;
            if (data?.stats) {
                setDbStats(data.stats);
            } else if (data?.data) {
                setDbStats(data.data);
            } else if (data && typeof data.orders === 'number') {
                setDbStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch database stats:", err);
            try {
                const fallbackRes = await API.get('/admin/stats');
                if (fallbackRes.data?.stats) {
                    setDbStats(fallbackRes.data.stats);
                } else if (fallbackRes.data && typeof fallbackRes.data.orders === 'number') {
                    setDbStats(fallbackRes.data);
                }
            } catch (fallbackErr) {
                console.error("Fallback stats fetch also failed:", fallbackErr);
            }
        } finally {
            setDbStatsLoading(false);
        }
    };

    // Fetch existing backup snapshots
    const fetchBackups = async () => {
        setBackupsLoading(true);
        try {
            const res = await API.get('/admin/backups');
            if (res.data?.backups && Array.isArray(res.data.backups)) {
                setBackupsList(res.data.backups);
            }
        } catch (err) {
            console.error("Failed to fetch backups list:", err);
        } finally {
            setBackupsLoading(false);
        }
    };

    // Trigger full database reset
    const handleResetDatabase = async () => {
        if (resetConfirmationText.trim().toUpperCase() !== 'RESET') {
            setSnackbar({
                open: true,
                message: 'Please type RESET to confirm',
                severity: 'warning'
            });
            return;
        }

        setResetLoading(true);
        try {
            const res = await API.post('/admin/reset-database', {
                createBackupBeforeReset: resetBackupOption,
                deleteNonAdminUsers: resetUsersOption
            });

            if (res.data?.success) {
                setSnackbar({
                    open: true,
                    message: res.data.message || 'Database reset completed! Test data has been cleared.',
                    severity: 'success'
                });
                setResetDialogOpen(false);
                setResetConfirmationText("");
                fetchDatabaseStats();
                fetchBackups();
                fetchAuditLogs();
                fetchAuditStats();
            } else {
                setSnackbar({
                    open: true,
                    message: res.data?.message || 'Failed to reset database',
                    severity: 'error'
                });
            }
        } catch (err: any) {
            console.error("Reset database error:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to reset database',
                severity: 'error'
            });
        } finally {
            setResetLoading(false);
        }
    };

    // Trigger manual database backup
    const handleManualBackup = async () => {
        setBackupLoading(true);
        try {
            const res = await API.post('/admin/backup');
            if (res.data?.success) {
                setSnackbar({
                    open: true,
                    message: 'Database backup snapshot saved successfully!',
                    severity: 'success'
                });
                fetchBackups();
                fetchDatabaseStats();
            }
        } catch (err: any) {
            console.error("Manual backup error:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to create backup',
                severity: 'error'
            });
        } finally {
            setBackupLoading(false);
        }
    };

    // Sync tab with URL search parameter (?tab=profile | audit | reports | system)
    const tabParam = searchParams.get('tab');
    useEffect(() => {
        if (tabParam === 'audit') {
            setActiveTab(1);
        } else if (tabParam === 'reports') {
            setActiveTab(2);
        } else if (tabParam === 'system') {
            setActiveTab(3);
        } else if (tabParam === 'profile' || !tabParam) {
            setActiveTab(0);
        }
    }, [tabParam]);

    const changeTab = (newTab: number) => {
        setActiveTab(newTab);
        const tabsMap = ['profile', 'audit', 'reports', 'system'];
        setSearchParams({ tab: tabsMap[newTab] || 'profile' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        changeTab(newValue);
    };

    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // Count active filters
    useEffect(() => {
        let count = 0;
        if (auditFilters.action) count++;
        if (auditFilters.entity) count++;
        if (auditFilters.search) count++;
        if (auditFilters.startDate) count++;
        if (auditFilters.endDate) count++;
        setActiveFiltersCount(count);
    }, [auditFilters]);

    // Fetch tab-specific data when tab changes
    useEffect(() => {
        if (activeTab === 1) {
            fetchAuditLogs();
            fetchAuditStats();
        } else if (activeTab === 3) {
            fetchDatabaseStats();
            fetchBackups();
        } else if (activeTab === 0) {
            fetchDatabaseStats();
        }
    }, [activeTab, auditPage, auditRowsPerPage, auditFilters]);

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

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateProfile = () => {
        const newErrors: Record<string, string> = {};
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
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Update failed',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validatePassword = () => {
        const newErrors: Record<string, string> = {};
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
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Change failed',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (setting: keyof UserSettings) => {
        const newSettings = { ...settings, [setting]: !settings[setting] };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        
        API.post('/audit/settings-change', {
                setting,
                value: newSettings[setting]
            }).catch(err => console.error('Failed to log settings change:', err));
        
        setSnackbar({
            open: true,
            message: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${newSettings[setting] ? 'enabled' : 'disabled'}`,
            severity: 'success'
        });
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
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

    const getUserDisplayName = () => {
        if (!user) return 'User';
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        if (fullName.trim()) return fullName;
        if (user.telegramUsername) return user.telegramUsername;
        return user.username;
    };

    const getUserInitials = () => {
        if (!user) return 'U';
        if (user.firstName || user.lastName) {
            const parts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
            } else if (parts.length === 1 && parts[0].length > 0) {
                return parts[0].charAt(0).toUpperCase();
            }
        }
        if (user.telegramUsername) {
            return user.telegramUsername.charAt(0).toUpperCase();
        }
        return user.username ? user.username.charAt(0).toUpperCase() : 'U';
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

    const handleAuditPageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setAuditPage(newPage);
    };

    const handleAuditRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAuditRowsPerPage(parseInt(event.target.value, 10));
        setAuditPage(0);
    };

    const handleAuditFilterChange = (field: keyof AuditFilters, value: string) => {
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

    const viewAuditDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setAuditDetailDialogOpen(true);
    };

    const refreshAuditLogs = () => {
        fetchAuditLogs();
        fetchAuditStats();
    };

    const toggleFilters = () => {
        setFiltersExpanded(!filtersExpanded);
    };

    const getActionColor = (action: string): ChipProps['color'] => {
        const colors: Record<string, ChipProps['color']> = {
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

    const formatDate = (date: string): string => {
        try {
            return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
        } catch {
            return 'Invalid date';
        }
    };

    // Report handlers
    const handleGenerateReport = async () => {
        setReportLoading(true);
        setReportProgress(0);
        
        // Simulate progress
        const progressInterval = setInterval(() => {
            setReportProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 300);

        try {
            const params = reportType === "monthly" 
                ? { month: reportMonth, year: reportYear }
                : { year: reportYear };

            const response = await API.get(`/reports/${reportType}`, {
                params,
                responseType: "blob"
            });

            clearInterval(progressInterval);
            setReportProgress(100);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Store preview data
            setReportPreview({
                url,
                type: reportType,
                month: reportType === 'monthly' ? reportMonth : null,
                year: reportYear
            });

            // Auto download
            const link = document.createElement("a");
            link.href = url;
            
            const fileName = reportType === "monthly"
                ? `Monthly_Report_${months[reportMonth - 1]}_${reportYear}.xlsx`
                : `Yearly_Report_${reportYear}.xlsx`;
            
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSnackbar({
                open: true,
                message: 'Report generated successfully!',
                severity: 'success'
            });

            setTimeout(() => setReportProgress(0), 1000);

        } catch (error) {
            clearInterval(progressInterval);
            setReportProgress(0);
            console.error("Error generating report:", error);
            setSnackbar({
                open: true,
                message: 'Failed to generate report. Please try again.',
                severity: 'error'
            });
        } finally {
            setReportLoading(false);
        }
    };

    const handleViewReportSummary = () => {
        setReportDialogOpen(true);
    };

    // Quick stats for reports section
    const reportQuickStats = {
        monthly: {
            title: "Monthly Report",
            description: "Detailed monthly analysis including sales, orders, products, and customer insights",
            icon: <CalendarIcon sx={{ fontSize: 40 }} />,
            color: theme.palette.primary.main
        },
        yearly: {
            title: "Yearly Report",
            description: "Year-over-year comparison with monthly breakdowns and trend analysis",
            icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
            color: theme.palette.secondary.main
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

                {/* Sticky Mobile-Optimized Sub-Navigation Bar */}
                <Box
                    sx={{
                        position: 'sticky',
                        top: { xs: 56, sm: 64 },
                        zIndex: 100,
                        bgcolor: 'background.paper',
                        backdropFilter: 'blur(16px)',
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(22, 33, 62, 0.94)' 
                            : 'rgba(255, 255, 255, 0.94)',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mx: { xs: -2, sm: -3 },
                        px: { xs: 1.5, sm: 3 },
                        py: 0.8,
                        mb: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            minHeight: 46,
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: 1.5,
                            },
                            '& .MuiTab-root': {
                                minHeight: 44,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: { xs: '0.82rem', sm: '0.9rem' },
                                px: { xs: 1.75, sm: 2.5 },
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                            }
                        }}
                    >
                        <Tab
                            icon={<PersonIcon fontSize="small" />}
                            iconPosition="start"
                            label="Profile"
                        />
                        <Tab
                            icon={
                                <Badge badgeContent={totalAuditLogs > 0 ? totalAuditLogs : null} color="primary" max={999}>
                                    <HistoryIcon fontSize="small" />
                                </Badge>
                            }
                            iconPosition="start"
                            label="Audit Trail"
                        />
                        <Tab
                            icon={<AssessmentIcon fontSize="small" />}
                            iconPosition="start"
                            label="Reports"
                        />
                        <Tab
                            icon={
                                <Badge badgeContent={dbStats ? (dbStats.orders + dbStats.products) : null} color="error" max={999}>
                                    <StorageIcon fontSize="small" />
                                </Badge>
                            }
                            iconPosition="start"
                            label="Reset & System"
                            sx={{
                                color: activeTab === 3 ? 'error.main' : undefined,
                                '&.Mui-selected': { color: 'error.main' }
                            }}
                        />
                    </Tabs>
                </Box>


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
                                                bgcolor: 'primary.main',
                                                fontSize: 32
                                            }}
                                            src={user?.photoUrl || user?.avatar || profileData.avatar}
                                        >
                                            {getUserInitials()}
                                        </Avatar>
                                    </Badge>
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="h6" fontWeight="600">
                                                {getUserDisplayName()}
                                            </Typography>
                                            <VerifiedIcon color="primary" fontSize="small" />
                                        </Stack>
                                        {user?.telegramUsername ? (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                @{user.telegramUsername}
                                            </Typography>
                                        ) : (
                                            user?.username && !user.username.startsWith('tg_') && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    @{user.username}
                                                </Typography>
                                            )
                                        )}
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
                {activeTab === 1 && (
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

                        {/* Collapsible Filter Section */}
                        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                                onClick={toggleFilters}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <FilterIcon color="action" />
                                    <Typography variant="subtitle1" fontWeight="500">
                                        Filters
                                    </Typography>
                                    {activeFiltersCount > 0 && (
                                        <Chip 
                                            label={`${activeFiltersCount} active`} 
                                            size="small" 
                                            color="primary" 
                                        />
                                    )}
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {activeFiltersCount > 0 && (
                                        <Button
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearAuditFilters();
                                            }}
                                            startIcon={<ClearIcon />}
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                    <IconButton size="small">
                                        {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Stack>
                            </Box>

                            <Collapse in={filtersExpanded}>
                                <Divider />
                                <Box sx={{ p: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Search"
                                                placeholder="Search descriptions..."
                                                value={auditFilters.search}
                                                onChange={(e) => handleAuditFilterChange('search', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: auditFilters.search && (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAuditFilterChange('search', '')}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Action</InputLabel>
                                                <Select
                                                    value={auditFilters.action}
                                                    onChange={(e) => handleAuditFilterChange('action', e.target.value)}
                                                    label="Action"
                                                    endAdornment={auditFilters.action && (
                                                        <InputAdornment position="end" sx={{ mr: 2 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAuditFilterChange('action', '')}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )}
                                                >
                                                    <MenuItem value="">All Actions</MenuItem>
                                                    {filterOptions.actions?.map(action => (
                                                        <MenuItem key={action} value={action}>{action}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Entity</InputLabel>
                                                <Select
                                                    value={auditFilters.entity}
                                                    onChange={(e) => handleAuditFilterChange('entity', e.target.value)}
                                                    label="Entity"
                                                    endAdornment={auditFilters.entity && (
                                                        <InputAdornment position="end" sx={{ mr: 2 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAuditFilterChange('entity', '')}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )}
                                                >
                                                    <MenuItem value="">All Entities</MenuItem>
                                                    {filterOptions.entities?.map(entity => (
                                                        <MenuItem key={entity} value={entity}>{entity}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="date"
                                                label="Start Date"
                                                value={auditFilters.startDate}
                                                onChange={(e) => handleAuditFilterChange('startDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    endAdornment: auditFilters.startDate && (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAuditFilterChange('startDate', '')}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="date"
                                                label="End Date"
                                                value={auditFilters.endDate}
                                                onChange={(e) => handleAuditFilterChange('endDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    endAdornment: auditFilters.endDate && (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAuditFilterChange('endDate', '')}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Button
                                                variant="outlined"
                                                onClick={clearAuditFilters}
                                                startIcon={<ClearIcon />}
                                                fullWidth
                                                size="small"
                                                disabled={activeFiltersCount === 0}
                                            >
                                                Clear Filters
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Collapse>
                        </Paper>

                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={refreshAuditLogs}
                            >
                                Refresh Data
                            </Button>
                        </Box>

                        {/* Audit Log - Mobile Cards / Desktop Table */}
                        {auditLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : auditLogs.length === 0 ? (
                            <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                                <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary">No audit logs found</Typography>
                            </Paper>
                        ) : isMobile ? (
                            /* Mobile Card View */
                            <Stack spacing={1.5}>
                                {auditLogs.map((log) => (
                                    <Paper
                                        key={log._id}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            borderLeft: 4,
                                            borderColor: `${getActionColor(log.action)}.main`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:active': { transform: 'scale(0.98)' },
                                        }}
                                        onClick={() => viewAuditDetails(log)}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box flex={1} mr={1}>
                                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                    <Chip
                                                        label={log.action}
                                                        size="small"
                                                        color={getActionColor(log.action)}
                                                        sx={{ fontSize: '0.72rem', height: 22 }}
                                                    />
                                                    <Chip
                                                        label={log.entity}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.72rem', height: 22 }}
                                                    />
                                                </Stack>
                                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                                                    {log.description}
                                                </Typography>
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        @{log.performedByUsername}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(log.timestamp)}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                            <ChevronRightIcon color="action" fontSize="small" />
                                        </Stack>
                                    </Paper>
                                ))}
                                <TablePagination
                                    component="div"
                                    count={totalAuditLogs}
                                    page={auditPage}
                                    onPageChange={handleAuditPageChange}
                                    rowsPerPage={auditRowsPerPage}
                                    onRowsPerPageChange={handleAuditRowsPerPageChange}
                                    rowsPerPageOptions={[10, 20, 50]}
                                    sx={{ bgcolor: 'background.paper', borderRadius: 2, mt: 1 }}
                                />
                            </Stack>
                        ) : (
                            /* Desktop Table View */
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
                                                <TableCell align="center">Details</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {auditLogs.map((log) => (
                                                <TableRow key={log._id} hover>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <TimeIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">{formatDate(log.timestamp)}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <PersonIcon fontSize="small" color="action" />
                                                            <Box>
                                                                <Typography variant="body2">{log.performedByUsername}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{log.performedByRole}</Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={log.action} size="small" color={getActionColor(log.action)} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <CategoryIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">{log.entity}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{log.description}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" onClick={() => viewAuditDetails(log)}>
                                                                <SearchIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
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
                        )}

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
                        {/* Bottom Jump Navigation - Audit Trail */}
                        <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: 'action.hover' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Button
                                    size="small"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={() => changeTab(0)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    ← Profile
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    Audit Trail
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => changeTab(2)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Reports →
                                </Button>
                            </Stack>
                        </Paper>
                    </Box>
                )}

                {/* Reports Tab Content */}
                {activeTab === 2 && (
                    <Box>
                        <Grid container spacing={3}>
                            {/* Report Type Selection Cards */}
                            <Grid item xs={12} md={6}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        border: reportType === 'monthly' ? 2 : 1,
                                        borderColor: reportType === 'monthly' ? 'primary.main' : 'divider',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4
                                        }
                                    }}
                                    onClick={() => setReportType('monthly')}
                                >
                                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                        <CalendarIcon 
                                            sx={{ 
                                                fontSize: 48, 
                                                color: 'primary.main',
                                                mb: 2 
                                            }} 
                                        />
                                        <Typography variant="h5" gutterBottom fontWeight="600">
                                            Monthly Report
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Detailed monthly analysis including sales, orders, products, and customer insights
                                        </Typography>
                                        {reportType === 'monthly' && (
                                            <Chip 
                                                label="Selected" 
                                                color="primary" 
                                                size="small" 
                                                sx={{ mt: 2 }} 
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        border: reportType === 'yearly' ? 2 : 1,
                                        borderColor: reportType === 'yearly' ? 'secondary.main' : 'divider',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4
                                        }
                                    }}
                                    onClick={() => setReportType('yearly')}
                                >
                                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                        <TrendingUpIcon 
                                            sx={{ 
                                                fontSize: 48, 
                                                color: 'secondary.main',
                                                mb: 2 
                                            }} 
                                        />
                                        <Typography variant="h5" gutterBottom fontWeight="600">
                                            Yearly Report
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Year-over-year comparison with monthly breakdowns and trend analysis
                                        </Typography>
                                        {reportType === 'yearly' && (
                                            <Chip 
                                                label="Selected" 
                                                color="secondary" 
                                                size="small" 
                                                sx={{ mt: 2 }} 
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Report Configuration */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="600" gutterBottom>
                                        Configure Report
                                    </Typography>
                                    
                                    <Grid container spacing={3} alignItems="center">
                                        {reportType === 'monthly' && (
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Month</InputLabel>
                                                    <Select
                                                        value={reportMonth}
                                                        onChange={(e) => setReportMonth(Number(e.target.value))}
                                                        label="Month"
                                                    >
                                                        {months.map((monthName, index) => (
                                                            <MenuItem key={index} value={index + 1}>
                                                                {monthName}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        )}
                                        
                                        <Grid item xs={12} sm={reportType === 'monthly' ? 6 : 6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Year</InputLabel>
                                                <Select
                                                    value={reportYear}
                                                    onChange={(e) => setReportYear(Number(e.target.value))}
                                                    label="Year"
                                                >
                                                    {years.map((yr) => (
                                                        <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} sm={reportType === 'monthly' ? 12 : 6}>
                                            <Stack direction="row" spacing={2}>
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<DownloadIcon />}
                                                    onClick={handleGenerateReport}
                                                    disabled={reportLoading}
                                                    fullWidth
                                                    sx={{ py: 1.5 }}
                                                >
                                                    {reportLoading ? 'Generating...' : 'Generate & Download Report'}
                                                </Button>
                                                
                                                <Tooltip title="Preview report summary">
                                                    <Button
                                                        variant="outlined"
                                                        size="large"
                                                        startIcon={<AssessmentIcon />}
                                                        onClick={handleViewReportSummary}
                                                        disabled={reportLoading}
                                                    >
                                                        Summary
                                                    </Button>
                                                </Tooltip>
                                            </Stack>
                                        </Grid>
                                    </Grid>

                                    {/* Progress Bar */}
                                    {reportLoading && (
                                        <Box sx={{ mt: 3 }}>
                                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                                <CircularProgress size={20} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Generating report...
                                                </Typography>
                                            </Stack>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={reportProgress} 
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                        </Box>
                                    )}

                                    {/* Success Message */}
                                    {reportProgress === 100 && !reportLoading && (
                                        <Alert severity="success" sx={{ mt: 3 }}>
                                            Report generated successfully! Check your downloads folder.
                                        </Alert>
                                    )}
                                </Paper>
                            </Grid>

                            {/* Report Features */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="600" gutterBottom>
                                        Report Features
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        {reportType === 'monthly' ? (
                                            <>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Card sx={{ bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Sales Summary
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Revenue, costs, profits overview
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Card sx={{ bgcolor: 'info.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Detailed Orders
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Complete order history
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Card sx={{ bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Product Analysis
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Sales by product and size
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Card sx={{ bgcolor: 'warning.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Daily Breakdown
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Day-by-day sales analysis
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            </>
                                        ) : (
                                            <>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Card sx={{ bgcolor: 'secondary.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Monthly Comparison
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                12-month performance tracking
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Card sx={{ bgcolor: 'info.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Trend Analysis
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Revenue and growth patterns
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Card sx={{ bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom>
                                                                Annual Totals
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Year-end summary statistics
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Report Summary Dialog */}
                        <Dialog
                            open={reportDialogOpen}
                            onClose={() => setReportDialogOpen(false)}
                            maxWidth="md"
                            fullWidth
                        >
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Report Summary
                                <IconButton onClick={() => setReportDialogOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent>
                                <Stack spacing={3} sx={{ mt: 1 }}>
                                    <Alert severity="info">
                                        This is a preview of what will be included in your report
                                    </Alert>
                                    
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            {reportType === 'monthly' 
                                                ? `${months[reportMonth - 1]} ${reportYear} Report`
                                                : `${reportYear} Annual Report`
                                            }
                                        </Typography>
                                        
                                        <List>
                                            {reportType === 'monthly' ? (
                                                <>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Sales Summary"
                                                            secondary="Total revenue, costs, profit margins, and key metrics"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Detailed Orders"
                                                            secondary="Complete list of all orders with customer information"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Product Performance"
                                                            secondary="Sales breakdown by product, size, and current stock levels"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Daily Breakdown"
                                                            secondary="Day-by-day sales analysis with order counts"
                                                        />
                                                    </ListItem>
                                                </>
                                            ) : (
                                                <>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Monthly Breakdown"
                                                            secondary="Performance data for all 12 months"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Comparative Analysis"
                                                            secondary="Month-over-month growth and trend identification"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircleIcon color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary="Annual Totals"
                                                            secondary="Yearly revenue, costs, profits, and product sales"
                                                        />
                                                    </ListItem>
                                                </>
                                            )}
                                        </List>
                                    </Paper>

                                    <Alert severity="success" variant="outlined">
                                        Reports are generated in Excel format with multiple sheets, professional formatting, 
                                        auto-filters, and color-coded data for easy analysis.
                                    </Alert>
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setReportDialogOpen(false)}>Close</Button>
                                <Button 
                                    variant="contained"
                                    onClick={() => {
                                        setReportDialogOpen(false);
                                        handleGenerateReport();
                                    }}
                                    startIcon={<DownloadIcon />}
                                >
                                    Generate Report
                                </Button>
                            </DialogActions>
                        </Dialog>
                        {/* Bottom Jump Navigation - Reports */}
                        <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: 'action.hover' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Button
                                    size="small"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={() => changeTab(1)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    ← Audit Trail
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    Reports
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => changeTab(3)}
                                    color="error"
                                    sx={{ textTransform: 'none' }}
                                >
                                    Reset &amp; System →
                                </Button>
                            </Stack>
                        </Paper>
                    </Box>
                )}

                {/* Reset & System Tab Content */}
                {activeTab === 3 && (
                    <Box>
                        {/* Database Stats */}
                        <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <StorageIcon color="primary" />
                                    <Typography variant="h6" fontWeight={600}>Current Database Records</Typography>
                                </Stack>
                                <Tooltip title="Refresh counts">
                                    <IconButton size="small" onClick={fetchDatabaseStats} disabled={dbStatsLoading}>
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            {dbStatsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {[
                                        { label: 'Orders', count: dbStats?.orders ?? '–', icon: <ShoppingCartIcon />, color: 'primary' },
                                        { label: 'Products', count: dbStats?.products ?? '–', icon: <InventoryIcon />, color: 'success' },
                                        { label: 'Customers', count: dbStats?.customers ?? '–', icon: <PeopleIcon />, color: 'info' },
                                        { label: 'Audit Logs', count: dbStats?.auditLogs ?? '–', icon: <HistoryIcon />, color: 'warning' },
                                    ].map((stat) => (
                                        <Grid item xs={6} sm={3} key={stat.label}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    textAlign: 'center',
                                                    borderRadius: 2,
                                                    borderColor: `${stat.color}.main`,
                                                    background: `linear-gradient(135deg, transparent 60%, ${stat.color === 'primary' ? '#e3f2fd' : stat.color === 'success' ? '#e8f5e9' : stat.color === 'info' ? '#e1f5fe' : '#fff8e1'} 100%)`,
                                                }}
                                            >
                                                <Box sx={{ color: `${stat.color}.main`, mb: 0.5 }}>{stat.icon}</Box>
                                                <Typography variant="h4" fontWeight={700} color={`${stat.color}.main`}>
                                                    {stat.count}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>

                        {/* Safety Backup */}
                        <Paper sx={{ p: 3, borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'info.light' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={backupsList.length > 0 ? 2 : 0}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <BackupIcon color="info" sx={{ mt: 0.25 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>Create Database Snapshot</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Save a full snapshot of the current database before making any changes.
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Button
                                    variant="outlined"
                                    color="info"
                                    startIcon={backupLoading ? <CircularProgress size={16} color="inherit" /> : <BackupIcon />}
                                    onClick={handleManualBackup}
                                    disabled={backupLoading}
                                    sx={{ whiteSpace: 'nowrap', minWidth: 160 }}
                                >
                                    {backupLoading ? 'Saving…' : 'Backup Now'}
                                </Button>
                            </Stack>

                            {/* Existing Backups List */}
                            {backupsList.length > 0 && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        Recent Backups ({backupsList.length})
                                    </Typography>
                                    <Stack spacing={1}>
                                        {backupsList.slice(0, 3).map((b, idx) => (
                                            <Paper
                                                key={b.name || idx}
                                                variant="outlined"
                                                sx={{
                                                    p: 1.25,
                                                    borderRadius: 1.5,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    bgcolor: 'background.default',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {b.name}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Chip
                                                        size="small"
                                                        label={`${b.totalDocuments ?? 0} docs`}
                                                        variant="outlined"
                                                        color="info"
                                                        sx={{ height: 20, fontSize: '0.72rem' }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {b.timestamp ? format(new Date(b.timestamp), 'MMM dd, HH:mm') : ''}
                                                    </Typography>
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Paper>

                        {/* Danger Zone – Reset */}
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: 'error.main',
                                background: 'linear-gradient(135deg, transparent 70%, rgba(211,47,47,0.04) 100%)',
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
                                <WarningAmberIcon color="error" sx={{ mt: 0.25, fontSize: 28 }} />
                                <Box>
                                    <Typography variant="h6" fontWeight={700} color="error.main">
                                        Danger Zone – Reset All Test Data
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        This will permanently delete all orders, products, customers, and audit logs.
                                        Your admin account will be preserved.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Alert severity="error" sx={{ mb: 2 }}>
                                <strong>This action cannot be undone.</strong> All test data will be permanently erased.
                                We strongly recommend creating a backup first.
                            </Alert>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                                        What will be deleted:
                                    </Typography>
                                    {[
                                        `${dbStats?.orders ?? 0} Orders`,
                                        `${dbStats?.products ?? 0} Products`,
                                        `${dbStats?.customers ?? 0} Customers`,
                                        `${dbStats?.auditLogs ?? 0} Audit Log entries`,
                                    ].map((item) => (
                                        <Stack key={item} direction="row" spacing={0.5} alignItems="center">
                                            <DeleteForeverIcon sx={{ fontSize: 14 }} color="error" />
                                            <Typography variant="body2">{item}</Typography>
                                        </Stack>
                                    ))}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                                        What will be preserved:
                                    </Typography>
                                    {['All Admin accounts', 'App configuration', 'Your session'].map((item) => (
                                        <Stack key={item} direction="row" spacing={0.5} alignItems="center">
                                            <CheckCircleOutlineIcon sx={{ fontSize: 14 }} color="success" />
                                            <Typography variant="body2">{item}</Typography>
                                        </Stack>
                                    ))}
                                </Box>
                            </Stack>

                            <Divider sx={{ my: 2.5 }} />

                            <Button
                                variant="contained"
                                color="error"
                                size="large"
                                startIcon={<DeleteForeverIcon />}
                                onClick={() => { setResetDialogOpen(true); fetchDatabaseStats(); }}
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
                                    boxShadow: '0 4px 20px rgba(211,47,47,0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)',
                                        boxShadow: '0 6px 24px rgba(211,47,47,0.55)',
                                    }
                                }}
                            >
                                Reset All Test Data
                            </Button>
                        </Paper>

                        {/* Bottom Jump Navigation - System */}
                        <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: 'action.hover' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Button
                                    size="small"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={() => changeTab(2)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    ← Reports
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    Reset & System
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<PersonIcon fontSize="small" />}
                                    onClick={() => changeTab(0)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Back to Profile →
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Reset Confirmation Dialog */}
                        <Dialog
                            open={resetDialogOpen}
                            onClose={() => { if (!resetLoading) { setResetDialogOpen(false); setResetConfirmationText(''); } }}
                            maxWidth="sm"
                            fullWidth
                            PaperProps={{ sx: { borderTop: '4px solid', borderColor: 'error.main', borderRadius: 2 } }}
                        >
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <WarningAmberIcon color="error" />
                                    <Typography variant="h6" fontWeight={700} color="error.main">
                                        Confirm Database Reset
                                    </Typography>
                                </Stack>
                                <IconButton onClick={() => { if (!resetLoading) { setResetDialogOpen(false); setResetConfirmationText(''); } }} disabled={resetLoading}>
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>

                            <DialogContent>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    This will permanently delete all test data and cannot be reversed.
                                </Alert>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    The following will be permanently deleted:
                                </Typography>
                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                    {[
                                        { label: 'Orders', value: dbStats?.orders ?? 0, color: 'primary' },
                                        { label: 'Products', value: dbStats?.products ?? 0, color: 'success' },
                                        { label: 'Customers', value: dbStats?.customers ?? 0, color: 'info' },
                                        { label: 'Audit Logs', value: dbStats?.auditLogs ?? 0, color: 'warning' },
                                    ].map((s) => (
                                        <Grid item xs={6} key={s.label}>
                                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 1.5, borderColor: `${s.color}.light` }}>
                                                <Typography variant="h5" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={resetBackupOption}
                                            onChange={(e) => setResetBackupOption(e.target.checked)}
                                            color="primary"
                                            disabled={resetLoading}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            <strong>Create safety backup</strong> before resetting (recommended)
                                        </Typography>
                                    }
                                    sx={{ mb: 1, display: 'flex' }}
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={resetUsersOption}
                                            onChange={(e) => setResetUsersOption(e.target.checked)}
                                            color="error"
                                            disabled={resetLoading}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" color="error.main">
                                            Also delete non-admin user accounts
                                        </Typography>
                                    }
                                    sx={{ mb: 2.5, display: 'flex' }}
                                />

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    To confirm, type <strong>RESET</strong> in the field below:
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder='Type RESET to confirm'
                                    value={resetConfirmationText}
                                    onChange={(e) => setResetConfirmationText(e.target.value.toUpperCase())}
                                    disabled={resetLoading}
                                    error={resetConfirmationText.length > 0 && resetConfirmationText !== 'RESET'}
                                    helperText={resetConfirmationText.length > 0 && resetConfirmationText !== 'RESET' ? 'Type exactly RESET (all caps)' : ''}
                                    InputProps={{
                                        sx: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }
                                    }}
                                />
                            </DialogContent>

                            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => { setResetDialogOpen(false); setResetConfirmationText(''); }}
                                    disabled={resetLoading}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={resetLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
                                    onClick={handleResetDatabase}
                                    disabled={resetConfirmationText !== 'RESET' || resetLoading}
                                    fullWidth
                                    sx={{ py: 1.2, fontWeight: 700 }}
                                >
                                    {resetLoading ? 'Resetting Database…' : 'Yes, Delete All Test Data'}
                                </Button>
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