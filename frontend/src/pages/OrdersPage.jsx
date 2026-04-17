import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    Tabs,
    Tab,
    Stack,
    TextField,
    InputAdornment,
    Paper,
    Avatar,
    IconButton,
    Badge,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    alpha,
    useTheme,
    useMediaQuery
} from "@mui/material";
import {
    Search as SearchIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    Receipt as ReceiptIcon,
    LocalShipping as ShippingIcon,
    CheckCircle as CheckCircleIcon,
    MoreVert as MoreVertIcon,
    FilterList as FilterIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import API from "../api/axios";

const statusColors = {
    pending: "warning",
    confirmed: "info",
    shipped: "primary",
    delivered: "success"
};

const statusIcons = {
    pending: <ReceiptIcon />,
    confirmed: <CheckCircleIcon />,
    shipped: <ShippingIcon />,
    delivered: <InventoryIcon />
};

const OrdersPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const [orders, setOrders] = useState([]);
    const [tab, setTab] = useState("pending");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await API.get("/orders");
            setOrders(res.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchesStatus = o.status === tab;
            const matchesSearch =
                search === "" ||
                o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
                o.customer?.phone?.includes(search) ||
                o.items?.some((i) =>
                    i.product?.name?.toLowerCase().includes(search.toLowerCase())
                ) ||
                o._id?.toLowerCase().includes(search.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [orders, tab, search]);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/orders/${id}/status`, { status });
            fetchOrders();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const nextStatus = (status) => {
        switch (status) {
            case "pending":
                return "confirmed";
            case "confirmed":
                return "shipped";
            case "shipped":
                return "delivered";
            default:
                return null;
        }
    };

    const getStatusCount = (status) => {
        return orders.filter(o => o.status === status).length;
    };

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    return (
        <Box sx={{
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 2, sm: 3 },
            maxWidth: { xs: '100%', lg: 1400 },
            mx: 'auto'
        }}>
            {/* Header */}
            <Box mb={{ xs: 2, sm: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Orders Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Manage and track all your orders
                </Typography>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
                <TextField
                    fullWidth
                    placeholder={isMobile ? "Search orders..." : "🔍 Search by customer name, phone, product or order ID..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                            </InputAdornment>
                        ),
                        endAdornment: search && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearch("")}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </Paper>

            {/* Tabs with Counts */}
            <Paper sx={{ mb: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
                <Tabs
                    value={tab}
                    onChange={(e, val) => setTab(val)}
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons={isMobile ? "auto" : false}
                    allowScrollButtonsMobile
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: { xs: 48, sm: 64 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            px: { xs: 1, sm: 2 }
                        }
                    }}
                >
                    <Tab
                        label={
                            <Badge badgeContent={getStatusCount('pending')} color="warning">
                                <Box sx={{ px: { xs: 0.5, sm: 2 } }}>
                                    {isMobile ? 'Pending' : 'Pending'}
                                </Box>
                            </Badge>
                        }
                        value="pending"
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getStatusCount('confirmed')} color="info">
                                <Box sx={{ px: { xs: 0.5, sm: 2 } }}>
                                    {isMobile ? 'Confirmed' : 'Confirmed'}
                                </Box>
                            </Badge>
                        }
                        value="confirmed"
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getStatusCount('shipped')} color="primary">
                                <Box sx={{ px: { xs: 0.5, sm: 2 } }}>
                                    {isMobile ? 'Shipped' : 'Shipped'}
                                </Box>
                            </Badge>
                        }
                        value="shipped"
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getStatusCount('delivered')} color="success">
                                <Box sx={{ px: { xs: 0.5, sm: 2 } }}>
                                    {isMobile ? 'Delivered' : 'Delivered'}
                                </Box>
                            </Badge>
                        }
                        value="delivered"
                    />
                </Tabs>
            </Paper>

            {/* Results Summary */}
            {search && (
                <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Found {filteredOrders.length} {tab} order{filteredOrders.length !== 1 ? 's' : ''}
                        {search && ` matching "${search}"`}
                    </Typography>
                </Box>
            )}

            {/* Orders Grid */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {filteredOrders.map((order) => (
                    <Grid item xs={12} key={order._id}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: 4,
                                    transform: { xs: 'none', sm: 'translateY(-2px)' }
                                }
                            }}
                            onClick={() => handleOrderClick(order)}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                {/* Mobile Layout */}
                                {isMobile ? (
                                    <Box>
                                        {/* Header Row */}
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                            <Box display="flex" alignItems="center">
                                                <Avatar
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        mr: 1.5
                                                    }}
                                                >
                                                    <PersonIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="medium">
                                                        {order.customer?.name || 'Unknown Customer'}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center">
                                                        <PhoneIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {order.customer?.phone || 'No phone'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Chip
                                                icon={statusIcons[order.status]}
                                                label={order.status}
                                                color={statusColors[order.status]}
                                                size="small"
                                                sx={{ height: 24, fontSize: '0.7rem' }}
                                            />
                                        </Box>

                                        {/* Items & Total Row */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                                                </Typography>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                                    {order.items?.[0]?.product?.name}
                                                    {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                                                </Typography>
                                            </Box>
                                            <Box textAlign="right">
                                                <Typography variant="caption" color="text.secondary">
                                                    Total
                                                </Typography>
                                                <Typography variant="body1" color="primary" fontWeight="bold">
                                                    ₹{order.totalPrice?.toLocaleString() || 0}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Order ID */}
                                        <Typography variant="caption" color="text.secondary">
                                            #{order._id?.slice(-8)}
                                        </Typography>

                                        {/* Quick Actions */}
                                        {nextStatus(order.status) && (
                                            <>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="contained"
                                                    color={statusColors[nextStatus(order.status)]}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateStatus(order._id, nextStatus(order.status));
                                                    }}
                                                    startIcon={statusIcons[nextStatus(order.status)]}
                                                    sx={{ fontSize: '0.75rem' }}
                                                >
                                                    Mark as {nextStatus(order.status)}
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                ) : (
                                    /* Desktop/Tablet Layout */
                                    <Grid container alignItems="center" spacing={2}>
                                        {/* Order ID & Customer */}
                                        <Grid item xs={12} sm={isTablet ? 5 : 4} md={4}>
                                            <Box display="flex" alignItems="center">
                                                <Avatar
                                                    sx={{
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        mr: 2,
                                                        width: { sm: 40, md: 48 },
                                                        height: { sm: 40, md: 48 }
                                                    }}
                                                >
                                                    <PersonIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontSize: { sm: '0.9rem', md: '1rem' } }}>
                                                        {order.customer?.name || 'Unknown Customer'}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center">
                                                        <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {order.customer?.phone || 'No phone'}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Order #{order._id?.slice(-6)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {/* Items Summary */}
                                        <Grid item xs={12} sm={isTablet ? 4 : 4} md={4}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Items ({order.items?.length || 0})
                                            </Typography>
                                            <Stack spacing={0.5}>
                                                {order.items?.slice(0, 2).map((item, i) => (
                                                    <Typography key={i} variant="body2" noWrap sx={{ fontSize: { sm: '0.8rem', md: '0.875rem' } }}>
                                                        • {item.product?.name} - {item.size} × {item.quantity}
                                                    </Typography>
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        +{order.items.length - 2} more items
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Grid>

                                        {/* Total & Status */}
                                        <Grid item xs={8} sm={isTablet ? 2 : 3} md={3}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Total Amount
                                            </Typography>
                                            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: { sm: '1rem', md: '1.25rem' } }}>
                                                ₹{order.totalPrice?.toLocaleString() || 0}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={4} sm={1}>
                                            <Box display="flex" flexDirection="column" alignItems="flex-end">
                                                <Chip
                                                    icon={statusIcons[order.status]}
                                                    label={order.status}
                                                    color={statusColors[order.status]}
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOrderClick(order);
                                                    }}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                )}

                                {/* Quick Actions for Desktop */}
                                {!isMobile && nextStatus(order.status) && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Box display="flex" justifyContent="flex-end">
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color={statusColors[nextStatus(order.status)]}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(order._id, nextStatus(order.status));
                                                }}
                                                startIcon={statusIcons[nextStatus(order.status)]}
                                            >
                                                Mark as {nextStatus(order.status)}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Empty State */}
            {filteredOrders.length === 0 && !loading && (
                <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                    <InventoryIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        No orders found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {search
                            ? `No ${tab} orders matching "${search}"`
                            : `No ${tab} orders at the moment`
                        }
                    </Typography>
                </Paper>
            )}

            {/* Order Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
            >
                {selectedOrder && (
                    <>
                        <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Order Details
                                </Typography>
                                <Chip
                                    label={selectedOrder.status}
                                    color={statusColors[selectedOrder.status]}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Order ID: {selectedOrder._id}
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
                            {/* Customer Info */}
                            <Typography variant="subtitle2" gutterBottom>
                                Customer Information
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Name:</strong> {selectedOrder.customer?.name}
                                </Typography>
                                <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Phone:</strong> {selectedOrder.customer?.phone}
                                </Typography>
                            </Paper>

                            {/* Items */}
                            <Typography variant="subtitle2" gutterBottom>
                                Order Items
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                {selectedOrder.items?.map((item, i) => (
                                    <Box key={i} sx={{ mb: 1 }}>
                                        <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                            <strong>{item.product?.name}</strong> - {item.size}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Quantity: {item.quantity} × ₹{item.price}
                                        </Typography>
                                        {i < selectedOrder.items.length - 1 && <Divider sx={{ my: 1 }} />}
                                    </Box>
                                ))}
                            </Paper>

                            {/* Total */}
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Total Amount
                                </Typography>
                                <Typography variant="h5" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                                    ₹{selectedOrder.totalPrice?.toLocaleString()}
                                </Typography>
                            </Box>

                            {/* Status Update */}
                            {nextStatus(selectedOrder.status) && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Update Status
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>New Status</InputLabel>
                                        <Select
                                            value={selectedOrder.status}
                                            onChange={(e) => {
                                                updateStatus(selectedOrder._id, e.target.value);
                                                setDetailsOpen(false);
                                            }}
                                        >
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="confirmed">Confirmed</MenuItem>
                                            <MenuItem value="shipped">Shipped</MenuItem>
                                            <MenuItem value="delivered">Delivered</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default OrdersPage;