import React, { useEffect, useState } from "react";
import type { DashboardStats, LowStockItem, ProductStat, ProfitData, RestockSuggestion } from "../types";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Alert,
    Avatar,
    Button,
    Divider,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    useTheme,
    alpha,
    useMediaQuery,
    Fade,
    Zoom,
    Tooltip,
    LinearProgress
} from "@mui/material";
import {
    TrendingUp,
    Warning,
    Inventory,
    ShoppingCart,
    AttachMoney,
    AddShoppingCart,
    Receipt,
    ArrowForward,
    Refresh,
    Circle,
    ArrowUpward,
    ArrowDownward,
    CheckCircle,
    Error as ErrorIcon,
    Schedule,
    NotificationsActive,
    Assessment,
    Analytics,
    TrendingDown,
    MoreHoriz
} from "@mui/icons-material";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [productStats, setProductStats] = useState<ProductStat[]>([]);
    const [profit, setProfit] = useState<ProfitData | null>(null);
    const [restock, setRestock] = useState<RestockSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchAllData = async () => {
        try {
            const [statsRes, lowStockRes, productRes, profitRes, restockRes] = await Promise.all([
                API.get("/analytics/dashboard"),
                API.get("/inventory/low-stock"),
                API.get("/analytics/products"),
                API.get("/analytics/profit"),
                API.get("/inventory/restock-suggestions")
            ]);

            setStats(statsRes.data);
            setLowStock(lowStockRes.data);
            setProductStats(productRes.data);
            setProfit(profitRes.data);
            setRestock(restockRes.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load dashboard data");
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        await fetchAllData();
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            fetchAllData();
        }, 300000);
        return () => clearInterval(interval);
    }, []);

    const formatNumber = (value: unknown, defaultValue = 0): number => {
        if (value === null || value === undefined) return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    };

    const formatCurrency = (value: unknown): string => {
        const num = formatNumber(value);
        return num.toLocaleString('en-IN');
    };

    const formatPercentage = (value: unknown): string => {
        const num = formatNumber(value);
        return num.toFixed(1);
    };

    const getRestockPriority = (item: RestockSuggestion): { color: 'error' | 'warning' | 'info'; label: string; bg: string } => {
        const stockRatio = item.currentStock / (item.reorderQty || 1);
        if (stockRatio < 0.5) return { color: 'error', label: 'URGENT', bg: alpha(theme.palette.error.main, 0.1) };
        if (stockRatio < 1) return { color: 'warning', label: 'PRIORITY', bg: alpha(theme.palette.warning.main, 0.1) };
        return { color: 'info', label: 'RECOMMENDED', bg: alpha(theme.palette.info.main, 0.1) };
    };

    const getTimeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    // Stats configuration for the clean list
    const statItems = [
        {
            label: "Total Orders",
            value: formatNumber(stats?.totalOrders),
            icon: ShoppingCart,
            color: theme.palette.primary.main,
            trend: { value: 12.5, isUp: true },
            accent: theme.palette.primary.main
        },
        {
            label: "Today's Orders",
            value: formatNumber(stats?.todayOrders),
            icon: TrendingUp,
            color: theme.palette.success.main,
            trend: { value: 8.2, isUp: true },
            accent: theme.palette.success.main
        },
        {
            label: "Revenue",
            value: `$${formatCurrency(stats?.revenue)}`,
            icon: AttachMoney,
            color: theme.palette.warning.main,
            trend: { value: 15.3, isUp: true },
            accent: theme.palette.warning.main
        },
        {
            label: "Pending",
            value: formatNumber(stats?.pendingOrders),
            icon: Schedule,
            color: (stats?.pendingOrders || 0) > 10 ? theme.palette.error.main : theme.palette.info.main,
            trend: (stats?.pendingOrders || 0) > 10 ? { value: 5, isUp: true } : { value: 2, isUp: false },
            accent: (stats?.pendingOrders || 0) > 10 ? theme.palette.error.main : theme.palette.info.main,
            alert: (stats?.pendingOrders || 0) > 10
        }
    ];

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Skeleton variant="text" width={200} height={40} />
                        <Skeleton variant="text" width={300} height={20} />
                    </Box>
                    <Skeleton variant="circular" width={40} height={40} />
                </Box>
                <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
                <Skeleton variant="rounded" height={isMobile ? 100 : 80} sx={{ mb: 3 }} />
                <Skeleton variant="rounded" height={isMobile ? 180 : 200} sx={{ mb: 3 }} />
                <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
                <Skeleton variant="rounded" height={200} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert
                    severity="error"
                    icon={<ErrorIcon />}
                    action={
                        <Button color="inherit" size="small" onClick={loadData}>
                            Retry
                        </Button>
                    }
                    sx={{ alignItems: 'center' }}
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflowX: 'hidden' }}>
            <Fade in={true} timeout={500}>
                <Box>
                    {/* Header Section */}
                    <Box
                        display="flex"
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        mb={3}
                        gap={1}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                fontSize={{ xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }}
                                color="text.primary"
                            >
                                Welcome Back! 👋
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                            >
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Typography>
                        </Box>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            width={{ xs: '100%', sm: 'auto' }}
                            justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                        >
                            <Tooltip title="Refresh data">
                                <IconButton
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    sx={{
                                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': {
                                            from: { transform: 'rotate(0deg)' },
                                            to: { transform: 'rotate(360deg)' }
                                        }
                                    }}
                                >
                                    <Refresh />
                                </IconButton>
                            </Tooltip>

                            <Chip
                                icon={<CheckCircle fontSize="small" />}
                                label={`Updated ${getTimeAgo(lastUpdated)}`}
                                size="small"
                                variant="outlined"
                                color="success"
                                sx={{
                                    height: { xs: 24, sm: 28 },
                                    '& .MuiChip-label': {
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                        px: { xs: 1, sm: 1.5 }
                                    }
                                }}
                            />
                        </Stack>
                    </Box>

                    {/* Quick Actions */}
                    <Zoom in={true} timeout={600}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.5, sm: 2 },
                                mb: 3,
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 3
                            }}
                        >
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                                alignItems={{ xs: 'stretch', sm: 'center' }}
                            >
                                <Box display="flex" alignItems="center" sx={{ minWidth: { sm: 120 } }}>
                                    <Assessment sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                        Quick Actions:
                                    </Typography>
                                </Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    useFlexGap
                                    sx={{ ml: { sm: 2 } }}
                                >
                                    <Button
                                        variant="contained"
                                        size={isMobile ? "small" : "medium"}
                                        startIcon={<AddShoppingCart />}
                                        onClick={() => navigate('/quick-order')}
                                        sx={{
                                            flex: { xs: 1, sm: 'none' },
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: theme.shadows[2]
                                            }
                                        }}
                                    >
                                        New Order
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size={isMobile ? "small" : "medium"}
                                        startIcon={<Receipt />}
                                        onClick={() => navigate('/orders')}
                                        sx={{
                                            flex: { xs: 1, sm: 'none' },
                                            borderRadius: 2.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        View Orders
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size={isMobile ? "small" : "medium"}
                                        startIcon={<Inventory />}
                                        onClick={() => navigate('/inventory')}
                                        sx={{
                                            flex: { xs: 1, sm: 'none' },
                                            borderRadius: 2.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Check Stock
                                    </Button>
                                    {isDesktop && (
                                        <Button
                                            variant="outlined"
                                            size="medium"
                                            startIcon={<Analytics />}
                                            onClick={() => navigate('/analytics')}
                                            sx={{
                                                borderRadius: 2.5,
                                                textTransform: 'none'
                                            }}
                                        >
                                            Analytics
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                    </Zoom>

                    {/* Clean Stats List - Redesigned */}
                    <Fade in={true} timeout={700}>
                        <Paper
                            elevation={0}
                            sx={{
                                mb: 3,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                overflow: 'hidden',
                                bgcolor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    '& > *': {
                                        flex: 1,
                                        borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.08)}`, md: 'none' },
                                        borderRight: { md: `1px solid ${alpha(theme.palette.divider, 0.08)}` },
                                        '&:last-child': {
                                            borderBottom: 'none',
                                            borderRight: 'none'
                                        }
                                    }
                                }}
                            >
                                {statItems.map((item, index) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <Zoom in={true} timeout={700 + (index * 100)} key={index}>
                                            <Box
                                                sx={{
                                                    p: { xs: 2, sm: 2.5 },
                                                    transition: 'all 0.2s ease',
                                                    position: 'relative',
                                                    '&:hover': {
                                                        bgcolor: alpha(item.accent, 0.03)
                                                    },
                                                    ...(item.alert && {
                                                        '&::before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            left: 0,
                                                            top: 0,
                                                            bottom: 0,
                                                            width: 3,
                                                            bgcolor: 'error.main',
                                                            borderTopLeftRadius: 3,
                                                            borderBottomLeftRadius: 3
                                                        }
                                                    })
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    {/* Icon Container */}
                                                    <Box
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 2.5,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: alpha(item.color, 0.08),
                                                            color: item.color,
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <IconComponent sx={{ fontSize: 24 }} />
                                                    </Box>

                                                    {/* Content */}
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Stack direction="row" alignItems="baseline" spacing={1}>
                                                            <Typography
                                                                variant="h5"
                                                                fontWeight="bold"
                                                                fontSize={{ xs: '1.35rem', sm: '1.5rem', md: '1.6rem' }}
                                                                sx={{ lineHeight: 1.2 }}
                                                            >
                                                                {item.value}
                                                            </Typography>
                                                            <Chip
                                                                icon={item.trend.isUp ?
                                                                    <ArrowUpward sx={{ fontSize: 12 }} /> :
                                                                    <ArrowDownward sx={{ fontSize: 12 }} />
                                                                }
                                                                label={`${item.trend.value}%`}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    bgcolor: item.trend.isUp
                                                                        ? alpha(theme.palette.success.main, 0.1)
                                                                        : alpha(theme.palette.error.main, 0.1),
                                                                    color: item.trend.isUp
                                                                        ? theme.palette.success.main
                                                                        : theme.palette.error.main,
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600,
                                                                    '& .MuiChip-icon': {
                                                                        ml: 0.25,
                                                                        mr: -0.25
                                                                    },
                                                                    '& .MuiChip-label': {
                                                                        px: 0.75
                                                                    }
                                                                }}
                                                            />
                                                        </Stack>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            fontWeight={500}
                                                            fontSize={{ xs: '0.75rem', sm: '0.8rem' }}
                                                            sx={{ mt: 0.25 }}
                                                        >
                                                            {item.label}
                                                            {item.alert && (
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        ml: 1,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        color: 'error.main',
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    <Circle sx={{ fontSize: 6, mr: 0.5 }} />
                                                                    ATTENTION
                                                                </Box>
                                                            )}
                                                        </Typography>
                                                    </Box>

                                                    {/* Action Arrow (subtle) */}
                                                    <MoreHoriz
                                                        sx={{
                                                            fontSize: 20,
                                                            color: alpha(theme.palette.text.secondary, 0.3),
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s ease',
                                                            '&:hover': { opacity: 1 }
                                                        }}
                                                    />
                                                </Stack>
                                            </Box>
                                        </Zoom>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Fade>

                    {/* Profit Overview - Full Width */}
                    <Fade in={true} timeout={900}>
                        <Card
                            elevation={0}
                            sx={{
                                mb: 3,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: theme.shadows[2],
                                    borderColor: alpha(theme.palette.primary.main, 0.2)
                                }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    fontSize={{ xs: '1rem', sm: '1.1rem', md: '1.25rem' }}
                                    fontWeight="bold"
                                    sx={{ mb: 3 }}
                                >
                                    💰 Profit Overview
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={{ xs: 3, sm: 0 }}
                                    divider={!isMobile && <Divider orientation="vertical" flexItem />}
                                >
                                    <Box flex={1} textAlign="center">
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Revenue
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="success.main"
                                            fontSize={{ xs: '1.25rem', sm: '1.5rem' }}
                                            fontWeight="bold"
                                            sx={{ mb: 1 }}
                                        >
                                            ${formatCurrency(profit?.totalRevenue)}
                                        </Typography>
                                        <Chip
                                            label="+15%"
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                                color: theme.palette.success.main,
                                                fontWeight: 600
                                            }}
                                        />
                                    </Box>

                                    <Box flex={1} textAlign="center">
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Cost
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="error.main"
                                            fontSize={{ xs: '1.25rem', sm: '1.5rem' }}
                                            fontWeight="bold"
                                            sx={{ mb: 1 }}
                                        >
                                            ${formatCurrency(profit?.totalCost)}
                                        </Typography>
                                        <Chip
                                            label="+8%"
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.grey[500], 0.1),
                                                color: theme.palette.text.secondary,
                                                fontWeight: 600
                                            }}
                                        />
                                    </Box>

                                    <Box flex={1} textAlign="center">
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Net Profit
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="primary"
                                            fontWeight="bold"
                                            fontSize={{ xs: '1.25rem', sm: '1.5rem' }}
                                            sx={{ mb: 1 }}
                                        >
                                            ${formatCurrency(profit?.profit)}
                                        </Typography>
                                        <Chip
                                            label={`${formatPercentage(profit?.profitMargin)}% margin`}
                                            size="small"
                                            sx={{
                                                bgcolor: (profit?.profitMargin || 0) > 20
                                                    ? alpha(theme.palette.success.main, 0.1)
                                                    : alpha(theme.palette.primary.main, 0.1),
                                                color: (profit?.profitMargin || 0) > 20
                                                    ? theme.palette.success.main
                                                    : theme.palette.primary.main,
                                                fontWeight: 600
                                            }}
                                        />
                                    </Box>
                                </Stack>

                                <Box sx={{ mt: 4 }}>
                                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                                        <Typography variant="body2" color="text.secondary">
                                            Profit Target Progress
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {Math.round(((profit?.profit || 0) / (profit?.totalRevenue || 1)) * 100)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(((profit?.profit || 0) / (profit?.totalRevenue || 1)) * 100, 100)}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 4,
                                                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                                            }
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Fade>

                    {/* Restock Suggestions */}
                    {restock.length > 0 && (
                        <Fade in={true} timeout={1000}>
                            <Box mb={3}>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={2.5}
                                    flexWrap="wrap"
                                    gap={1}
                                >
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                                        <Typography
                                            variant="h6"
                                            fontSize={{ xs: '1rem', sm: '1.1rem', md: '1.25rem' }}
                                            fontWeight="bold"
                                        >
                                            📦 Restock Suggestions
                                        </Typography>
                                        <Chip
                                            label={`${restock.length} items`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                color: theme.palette.primary.main,
                                                fontWeight: 600
                                            }}
                                        />
                                        {restock.some(item => getRestockPriority(item).color === 'error') && (
                                            <Chip
                                                label="URGENT"
                                                size="small"
                                                color="error"
                                                icon={<NotificationsActive sx={{ fontSize: 14 }} />}
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                    <Button
                                        size="small"
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/inventory')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        View All
                                    </Button>
                                </Box>

                                <Stack spacing={1.5}>
                                    {restock.slice(0, isMobile ? 2 : 3).map((item, index) => {
                                        const priority = getRestockPriority(item);
                                        return (
                                            <Paper
                                                key={index}
                                                elevation={0}
                                                sx={{
                                                    p: { xs: 2, sm: 2.5 },
                                                    bgcolor: priority.bg,
                                                    border: `1px solid ${alpha(theme.palette[priority.color].main, 0.15)}`,
                                                    borderLeft: `4px solid ${theme.palette[priority.color].main}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        transform: 'translateX(4px)',
                                                        boxShadow: theme.shadows[3],
                                                        bgcolor: alpha(theme.palette[priority.color].main, 0.12)
                                                    }
                                                }}
                                                onClick={() => navigate('/inventory')}
                                            >
                                                <Grid container alignItems="center" spacing={2}>
                                                    <Grid item xs={12} sm={5} md={4}>
                                                        <Box display="flex" alignItems="center">
                                                            <Circle
                                                                sx={{
                                                                    fontSize: 10,
                                                                    mr: 1.5,
                                                                    color: `${priority.color}.main`
                                                                }}
                                                            />
                                                            <Box>
                                                                <Typography
                                                                    variant="body1"
                                                                    fontWeight="medium"
                                                                    fontSize={{ xs: '0.875rem', sm: '0.95rem', md: '1rem' }}
                                                                >
                                                                    {item.productName}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    fontSize={{ xs: '0.7rem', sm: '0.75rem' }}
                                                                >
                                                                    {item.size || 'N/A'} • {item.team || 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    <Grid item xs={4} sm={3} md={3}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Current
                                                        </Typography>
                                                        <Typography
                                                            variant="body1"
                                                            fontWeight="bold"
                                                            color={`${priority.color}.main`}
                                                            fontSize={{ xs: '0.875rem', sm: '1rem' }}
                                                        >
                                                            {item.currentStock} units
                                                        </Typography>
                                                    </Grid>

                                                    <Grid item xs={4} sm={2} md={3}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Suggested
                                                        </Typography>
                                                        <Typography
                                                            variant="body1"
                                                            fontWeight="bold"
                                                            fontSize={{ xs: '0.875rem', sm: '1rem' }}
                                                        >
                                                            {item.reorderQty} units
                                                        </Typography>
                                                    </Grid>

                                                    <Grid item xs={4} sm={2}>
                                                        <Chip
                                                            label={priority.label}
                                                            color={priority.color}
                                                            size="small"
                                                            sx={{
                                                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                                                fontWeight: 600,
                                                                height: { xs: 20, sm: 22 }
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Fade>
                    )}

                    {/* Low Stock Alerts */}
                    {lowStock.length > 0 && (
                        <Fade in={true} timeout={1100}>
                            <Box mb={3}>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={2.5}
                                    flexWrap="wrap"
                                    gap={1}
                                >
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                                        <Typography
                                            variant="h6"
                                            fontSize={{ xs: '1rem', sm: '1.1rem', md: '1.25rem' }}
                                            fontWeight="bold"
                                        >
                                            ⚠️ Low Stock Alerts
                                        </Typography>
                                        {lowStock.filter(item => item.stock <= 5).length > 0 && (
                                            <Chip
                                                label={`${lowStock.filter(item => item.stock <= 5).length} Critical`}
                                                size="small"
                                                color="error"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                    <Button
                                        size="small"
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/inventory')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        View All
                                    </Button>
                                </Box>

                                <Stack spacing={1.5}>
                                    {lowStock.slice(0, isMobile ? 2 : 3).map((item, index) => {
                                        const isCritical = item.stock <= 5;
                                        return (
                                            <Paper
                                                key={index}
                                                elevation={0}
                                                sx={{
                                                    p: { xs: 2, sm: 2.5 },
                                                    bgcolor: isCritical
                                                        ? alpha(theme.palette.error.main, 0.03)
                                                        : alpha(theme.palette.warning.main, 0.03),
                                                    border: `1px solid ${isCritical
                                                        ? alpha(theme.palette.error.main, 0.15)
                                                        : alpha(theme.palette.warning.main, 0.15)}`,
                                                    borderLeft: `4px solid ${isCritical
                                                        ? theme.palette.error.main
                                                        : theme.palette.warning.main
                                                        }`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        bgcolor: isCritical
                                                            ? alpha(theme.palette.error.main, 0.08)
                                                            : alpha(theme.palette.warning.main, 0.08),
                                                        boxShadow: theme.shadows[2]
                                                    }
                                                }}
                                                onClick={() => navigate('/inventory')}
                                            >
                                                <Grid container alignItems="center" spacing={2}>
                                                    <Grid item xs={12} sm={4} md={4}>
                                                        <Box display="flex" alignItems="center">
                                                            <Warning
                                                                color={isCritical ? "error" : "warning"}
                                                                sx={{
                                                                    mr: 1.5,
                                                                    fontSize: { xs: 20, sm: 22, md: 24 }
                                                                }}
                                                            />
                                                            <Box>
                                                                <Typography
                                                                    variant="body1"
                                                                    fontWeight="medium"
                                                                    fontSize={{ xs: '0.875rem', sm: '0.95rem', md: '1rem' }}
                                                                >
                                                                    {item.productName}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    fontSize={{ xs: '0.7rem', sm: '0.75rem' }}
                                                                >
                                                                    {item.size || 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    <Grid item xs={4} sm={3} md={3}>
                                                        <Typography
                                                            variant="h6"
                                                            color={isCritical ? "error" : "warning.main"}
                                                            fontSize={{ xs: '0.9rem', sm: '1rem', md: '1.1rem' }}
                                                            fontWeight="bold"
                                                        >
                                                            {item.stock} units
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Current Stock
                                                        </Typography>
                                                    </Grid>

                                                    <Grid item xs={4} sm={3} md={3}>
                                                        <Typography
                                                            variant="body1"
                                                            fontSize={{ xs: '0.875rem', sm: '0.95rem' }}
                                                        >
                                                            {item.team || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Team
                                                        </Typography>
                                                    </Grid>

                                                    <Grid item xs={4} sm={2} md={2}>
                                                        <Chip
                                                            label={isCritical ? "CRITICAL" : "LOW"}
                                                            color={isCritical ? "error" : "warning"}
                                                            size="small"
                                                            sx={{
                                                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                                                fontWeight: 600,
                                                                height: { xs: 20, sm: 22 }
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Fade>
                    )}

                    {/* Top Products */}
                    {productStats.length > 0 && (
                        <Fade in={true} timeout={1200}>
                            <Box>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={2.5}
                                    flexWrap="wrap"
                                    gap={1}
                                >
                                    <Typography
                                        variant="h6"
                                        fontSize={{ xs: '1rem', sm: '1.1rem', md: '1.25rem' }}
                                        fontWeight="bold"
                                    >
                                        🔥 Top Products
                                    </Typography>
                                    <Button
                                        size="small"
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/inventory')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        View All
                                    </Button>
                                </Box>

                                <Stack spacing={1.5}>
                                    {productStats.slice(0, isMobile ? 3 : 5).map((product, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{
                                                p: { xs: 2, sm: 2.5 },
                                                borderRadius: 2,
                                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    boxShadow: theme.shadows[3],
                                                    borderColor: alpha(theme.palette.primary.main, 0.2),
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Grid container alignItems="center" spacing={2}>
                                                <Grid item xs={2} sm={1}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: index === 0
                                                                ? alpha(theme.palette.warning.main, 0.12)
                                                                : alpha(theme.palette.primary.main, 0.08),
                                                            color: index === 0
                                                                ? theme.palette.warning.main
                                                                : theme.palette.primary.main,
                                                            width: { xs: 36, sm: 40, md: 44 },
                                                            height: { xs: 36, sm: 40, md: 44 },
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        #{index + 1}
                                                    </Avatar>
                                                </Grid>

                                                <Grid item xs={5} sm={4} md={5}>
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="medium"
                                                        fontSize={{ xs: '0.875rem', sm: '0.95rem', md: '1rem' }}
                                                    >
                                                        {product.productName}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        fontSize={{ xs: '0.7rem', sm: '0.75rem' }}
                                                    >
                                                        {product.team || 'N/A'}
                                                    </Typography>
                                                </Grid>

                                                <Grid item xs={5} sm={3} md={3}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Sold
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                        fontSize={{ xs: '0.875rem', sm: '1rem', md: '1.1rem' }}
                                                        fontWeight="bold"
                                                    >
                                                        {formatNumber(product.totalQuantity)} units
                                                    </Typography>
                                                </Grid>

                                                <Grid item xs={12} sm={4} md={3} sx={{ mt: { xs: 1, sm: 0 } }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Revenue
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                        color="success.main"
                                                        fontSize={{ xs: '0.875rem', sm: '1rem', md: '1.1rem' }}
                                                        fontWeight="bold"
                                                    >
                                                        ${formatCurrency(product.totalRevenue)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        </Fade>
                    )}
                </Box>
            </Fade>
        </Box>
    );
};

export default Dashboard;