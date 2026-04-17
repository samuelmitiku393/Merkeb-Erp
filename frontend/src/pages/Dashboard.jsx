import React, { useEffect, useState } from "react";
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
    Badge,
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
    TrendingDown
} from "@mui/icons-material";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const [stats, setStats] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [productStats, setProductStats] = useState([]);
    const [profit, setProfit] = useState(null);
    const [restock, setRestock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

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

    const formatNumber = (value, defaultValue = 0) => {
        if (value === null || value === undefined) return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    };

    const formatCurrency = (value) => {
        const num = formatNumber(value);
        return num.toLocaleString('en-IN');
    };

    const formatPercentage = (value) => {
        const num = formatNumber(value);
        return num.toFixed(1);
    };

    const getRestockPriority = (item) => {
        const stockRatio = item.currentStock / (item.reorderQty || 1);
        if (stockRatio < 0.5) return { color: 'error', label: 'URGENT', bg: alpha(theme.palette.error.main, 0.1) };
        if (stockRatio < 1) return { color: 'warning', label: 'PRIORITY', bg: alpha(theme.palette.warning.main, 0.1) };
        return { color: 'info', label: 'RECOMMENDED', bg: alpha(theme.palette.info.main, 0.1) };
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    // Redesigned Stat Cards Configuration
    const statCards = [
        {
            label: "Total Orders",
            value: formatNumber(stats?.totalOrders),
            icon: ShoppingCart,
            color: theme.palette.primary.main,
            bgColor: alpha(theme.palette.primary.main, 0.08),
            trend: { value: 12.5, isUp: true },
            subtitle: "All time orders"
        },
        {
            label: "Today's Orders",
            value: formatNumber(stats?.todayOrders),
            icon: TrendingUp,
            color: theme.palette.success.main,
            bgColor: alpha(theme.palette.success.main, 0.08),
            trend: { value: 8.2, isUp: true },
            subtitle: "vs yesterday"
        },
        {
            label: "Revenue Today",
            value: `₹${formatCurrency(stats?.revenue)}`,
            icon: AttachMoney,
            color: theme.palette.warning.main,
            bgColor: alpha(theme.palette.warning.main, 0.08),
            trend: { value: 15.3, isUp: true },
            subtitle: "Daily revenue"
        },
        {
            label: "Pending Orders",
            value: formatNumber(stats?.pendingOrders),
            icon: Schedule,
            color: stats?.pendingOrders > 10 ? theme.palette.error.main : theme.palette.info.main,
            bgColor: stats?.pendingOrders > 10
                ? alpha(theme.palette.error.main, 0.08)
                : alpha(theme.palette.info.main, 0.08),
            trend: stats?.pendingOrders > 10 ? { value: 5, isUp: true } : { value: 2, isUp: false },
            subtitle: "Need attention",
            alert: stats?.pendingOrders > 10
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
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={6} md={3} key={i}>
                            <Skeleton variant="rounded" height={isMobile ? 100 : 120} />
                        </Grid>
                    ))}
                </Grid>
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
                                borderRadius: 2
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
                                            borderRadius: 2,
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
                                            borderRadius: 2,
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
                                            borderRadius: 2,
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
                                                borderRadius: 2,
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

                    {/* Redesigned Stats Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {statCards.map((card, index) => {
                            const IconComponent = card.icon;
                            return (
                                <Grid item xs={6} md={3} key={index}>
                                    <Zoom in={true} timeout={700 + (index * 100)}>
                                        <Card
                                            elevation={0}
                                            sx={{
                                                height: '100%',
                                                borderRadius: 3,
                                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                transition: 'all 0.3s ease',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    borderColor: alpha(card.color, 0.3),
                                                    boxShadow: `0 4px 20px ${alpha(card.color, 0.15)}`,
                                                    transform: 'translateY(-2px)'
                                                },
                                                ...(card.alert && {
                                                    borderLeft: `4px solid ${theme.palette.error.main}`,
                                                    animation: 'pulse 2s infinite',
                                                    '@keyframes pulse': {
                                                        '0%': {
                                                            boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}`
                                                        },
                                                        '70%': {
                                                            boxShadow: `0 0 0 6px ${alpha(theme.palette.error.main, 0)}`
                                                        },
                                                        '100%': {
                                                            boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            <CardContent sx={{
                                                p: { xs: 2, sm: 2.5 },
                                                '&:last-child': { pb: { xs: 2, sm: 2.5 } }
                                            }}>
                                                {/* Header with Icon and Trend */}
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                    <Box
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: card.bgColor,
                                                            color: card.color,
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        <IconComponent sx={{ fontSize: 24 }} />
                                                    </Box>

                                                    <Chip
                                                        icon={card.trend.isUp ?
                                                            <ArrowUpward sx={{ fontSize: 14 }} /> :
                                                            <ArrowDownward sx={{ fontSize: 14 }} />
                                                        }
                                                        label={`${card.trend.value}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: card.trend.isUp
                                                                ? alpha(theme.palette.success.main, 0.1)
                                                                : alpha(theme.palette.error.main, 0.1),
                                                            color: card.trend.isUp
                                                                ? theme.palette.success.main
                                                                : theme.palette.error.main,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            height: 24,
                                                            '& .MuiChip-icon': {
                                                                ml: 0.5,
                                                                mr: -0.25
                                                            }
                                                        }}
                                                    />
                                                </Box>

                                                {/* Value */}
                                                <Typography
                                                    variant="h4"
                                                    fontWeight="bold"
                                                    fontSize={{ xs: '1.5rem', sm: '1.75rem', md: '2rem' }}
                                                    sx={{
                                                        mb: 0.5,
                                                        lineHeight: 1.2,
                                                        color: 'text.primary'
                                                    }}
                                                >
                                                    {card.value}
                                                </Typography>

                                                {/* Label and Subtitle */}
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                    color="text.primary"
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    {card.label}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5
                                                    }}
                                                >
                                                    {card.subtitle}
                                                    {card.alert && (
                                                        <Chip
                                                            label="!"
                                                            size="small"
                                                            color="error"
                                                            sx={{
                                                                height: 16,
                                                                width: 16,
                                                                ml: 1,
                                                                '& .MuiChip-label': {
                                                                    px: 0,
                                                                    fontWeight: 'bold'
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Zoom>
                                </Grid>
                            );
                        })}
                    </Grid>

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
                                            ₹{formatCurrency(profit?.totalRevenue)}
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
                                            ₹{formatCurrency(profit?.totalCost)}
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
                                            ₹{formatCurrency(profit?.profit)}
                                        </Typography>
                                        <Chip
                                            label={`${formatPercentage(profit?.profitMargin)}% margin`}
                                            size="small"
                                            sx={{
                                                bgcolor: profit?.profitMargin > 20
                                                    ? alpha(theme.palette.success.main, 0.1)
                                                    : alpha(theme.palette.primary.main, 0.1),
                                                color: profit?.profitMargin > 20
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
                                            {Math.round((profit?.profit / (profit?.totalRevenue || 1)) * 100)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min((profit?.profit / (profit?.totalRevenue || 1)) * 100, 100)}
                                        sx={{
                                            height: 10,
                                            borderRadius: 5,
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 5,
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
                                                        ₹{formatCurrency(product.totalRevenue)}
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