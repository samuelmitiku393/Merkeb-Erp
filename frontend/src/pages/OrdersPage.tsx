import React, { useEffect, useState, useMemo } from "react";
import type { Order, OrderStatus, SnackbarState, PaginatedOrders } from "../types";
import { useAuth } from "../context/AuthContext";
import {
    Box,
    Typography,
    Grid,
    Button,
    Chip,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Paper,
    Avatar,
    IconButton,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    alpha,
    useTheme,
    useMediaQuery,
    Snackbar,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    Stack,
    Divider,
    Tooltip,
    ButtonGroup
} from "@mui/material";
import {
    Search as SearchIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    Receipt as ReceiptIcon,
    LocalShipping as ShippingIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    ChevronRight as ChevronRightIcon,
    Check as CheckIcon,
    LocationOn as LocationIcon,
    Home as HomeIcon,
    Cancel as CancelIcon,
    NavigateNext as NavigateNextIcon,
    NavigateBefore as NavigateBeforeIcon,
    FileUpload as UploadIcon
} from "@mui/icons-material";
import API from "../api/axios";
import BulkImportModal from "../components/BulkImportModal";

const statusColors: Record<OrderStatus, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
    pending: "warning",
    confirmed: "info",
    shipped: "primary",
    delivered: "success",
    cancelled: "error",
    refunded: "default"
};

const statusIcons: Record<OrderStatus, React.ReactElement> = {
    pending: <ReceiptIcon />,
    confirmed: <CheckCircleIcon />,
    shipped: <ShippingIcon />,
    delivered: <InventoryIcon />,
    cancelled: <CancelIcon />,
    refunded: <CancelIcon />
};

type StatusAction = { next: OrderStatus; label: string; icon: React.ReactElement; color: 'info' | 'primary' | 'success' };
const statusActions: Record<OrderStatus, StatusAction | null> = {
    pending: {
        next: "confirmed",
        label: "Confirm",
        icon: <CheckCircleIcon />,
        color: "info"
    },
    confirmed: {
        next: "shipped",
        label: "Ship",
        icon: <ShippingIcon />,
        color: "primary"
    },
    shipped: {
        next: "delivered",
        label: "Deliver",
        icon: <CheckIcon />,
        color: "success"
    },
    delivered: null,
    cancelled: null,
    refunded: null
};

const OrdersPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const isAdmin = true;

    const [orders, setOrders] = useState<Order[]>([]);
    const [tab, setTab] = useState<OrderStatus>("pending");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState<{
        customer: { name: string; phone: string; address: string };
        items: Array<{ _id?: string; product: string; productName: string; size: string; quantity: number; price: number; originalPrice?: number; catalogPrice?: number }>;
        discount?: number;
        discountType?: 'fixed' | 'percentage';
        adjustment?: number;
        negotiationNotes?: string;
    }>({
        customer: { name: "", phone: "", address: "" },
        items: [],
        discount: 0,
        discountType: 'fixed',
        adjustment: 0,
        negotiationNotes: ''
    });
    const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    // Cancel order state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 20;

    const fetchOrders = async (currentPage = page, statusFilter = tab) => {
        setLoading(true);
        try {
            const res = await API.get<PaginatedOrders>(`/orders?page=${currentPage}&limit=${PAGE_SIZE}&status=${statusFilter}`);
            setOrders(res.data.orders);
            setTotalPages(res.data.pagination.totalPages);
            setTotalCount(res.data.pagination.totalCount);
        } catch (error) {
            console.error("Error fetching orders:", error);
            showSnackbar("Error fetching orders", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchOrders(1, tab);
    }, [tab]);

    const filteredOrders = useMemo(() => {
        if (!search) return orders;
        const term = search.toLowerCase();
        return orders.filter((o) =>
            o.customer?.name?.toLowerCase().includes(term) ||
            o.customer?.phone?.includes(search) ||
            o.customer?.address?.toLowerCase().includes(term) ||
            o.items?.some((i) =>
                (typeof i.product === 'object' && i.product !== null ? i.product.name : '')?.toLowerCase().includes(term)
            ) ||
            o._id?.toLowerCase().includes(term)
        );
    }, [orders, search]);

    const updateStatus = async (id: string, status: OrderStatus) => {
        try {
            await API.put(`/orders/${id}/status`, { status });
            fetchOrders();
            showSnackbar(`Order status updated to ${status}`, "success");
        } catch (error) {
            console.error("Error updating status:", error);
            showSnackbar("Error updating order status", "error");
        }
    };

    const cancelOrder = async () => {
        if (!cancellingOrder) return;
        try {
            await API.post(`/orders/${cancellingOrder._id}/cancel`, { reason: cancelReason });
            fetchOrders();
            setCancelDialogOpen(false);
            setCancelReason("");
            setCancellingOrder(null);
            setDetailsOpen(false);
            showSnackbar("Order cancelled successfully", "success");
        } catch (error: any) {
            console.error("Error cancelling order:", error);
            showSnackbar(error.response?.data?.message || "Error cancelling order", "error");
        }
    };

    const handleCancelClick = (order: Order, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCancellingOrder(order);
        setCancelReason("");
        setCancelDialogOpen(true);
    };

    const updateOrder = async (id: string, updatedData: any) => {
        try {
            await API.put(`/orders/${id}`, updatedData);
            fetchOrders();
            setEditMode(false);
            setDetailsOpen(false);
            showSnackbar("Order updated successfully", "success");
        } catch (error: any) {
            console.error("Error updating order:", error);
            showSnackbar(error.response?.data?.message || "Error updating order", "error");
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            await API.delete(`/orders/${id}`);
            fetchOrders();
            setDeleteConfirmOpen(false);
            setDetailsOpen(false);
            showSnackbar("Order deleted successfully", "success");
        } catch (error) {
            console.error("Error deleting order:", error);
            showSnackbar("Error deleting order", "error");
        }
    };

    const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
        setSnackbar({ open: true, message, severity });
    };

    const nextStatus = (status: OrderStatus): OrderStatus | null => {
        switch (status) {
            case "pending": return "confirmed";
            case "confirmed": return "shipped";
            case "shipped": return "delivered";
            default: return null;
        }
    };

    const getStatusCount = (status: OrderStatus): number =>
        status === tab ? totalCount : 0;

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setEditFormData({
            customer: { 
                name: order.customer?.name || "", 
                phone: order.customer?.phone || "",
                address: order.customer?.address || ""
            },
            items: order.items?.map((item: any) => ({
                _id: item._id,
                product: typeof item.product === 'object' && item.product !== null ? item.product._id : item.product,
                productName: typeof item.product === 'object' && item.product !== null ? item.product.name : "",
                catalogPrice: typeof item.product === 'object' && item.product !== null ? item.product.price : (item.originalPrice || item.price),
                originalPrice: item.originalPrice !== undefined ? item.originalPrice : item.price,
                size: item.size,
                quantity: item.quantity,
                price: item.price
            })) || [],
            discount: order.discount || 0,
            discountType: order.discountType || 'fixed',
            adjustment: order.adjustment || 0,
            negotiationNotes: order.negotiationNotes || ''
        });
        setEditMode(false);
        setDetailsOpen(true);
    };

    const handleEditChange = (field: string, value: unknown, itemIndex: number | null = null) => {
        if (itemIndex !== null) {
            const newItems = [...editFormData.items];
            newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
            setEditFormData({ ...editFormData, items: newItems });
        } else if (field.startsWith('customer.')) {
            const customerField = field.split('.')[1];
            setEditFormData({
                ...editFormData,
                customer: { ...editFormData.customer, [customerField]: value }
            });
        } else {
            setEditFormData({ ...editFormData, [field]: value });
        }
    };

    const handleSaveEdit = () => {
        const subtotal = editFormData.items.reduce((sum: number, item: any) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
        let discountAmount = 0;
        const numDiscount = Number(editFormData.discount) || 0;
        if (numDiscount > 0) {
            if (editFormData.discountType === 'percentage') {
                discountAmount = (subtotal * numDiscount) / 100;
            } else {
                discountAmount = numDiscount;
            }
        }
        const numAdjustment = Number(editFormData.adjustment) || 0;
        const finalTotal = Math.max(0, subtotal - discountAmount + numAdjustment);

        const updatedOrder = {
            customer: editFormData.customer,
            items: editFormData.items.map((item: any) => ({
                product: item.product,
                size: item.size,
                quantity: item.quantity,
                price: Number(item.price) || 0,
                originalPrice: item.originalPrice !== undefined ? item.originalPrice : item.price
            })),
            discount: discountAmount,
            discountType: editFormData.discountType || 'fixed',
            adjustment: numAdjustment,
            totalPrice: finalTotal,
            negotiationNotes: editFormData.negotiationNotes || ''
        };
        if (selectedOrder) {
            updateOrder(selectedOrder._id, updatedOrder);
        }
    };

    // Handle quick action button click
    const handleQuickAction = (e: React.MouseEvent<HTMLButtonElement>, order: Order) => {
        e.stopPropagation();
        const action = statusActions[order.status];
        if (action) {
            updateStatus(order._id, action.next);
        }
    };

    return (
        <Box sx={{
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 2, sm: 3 },
            maxWidth: { xs: '100%', lg: 1200 },
            mx: 'auto'
        }}>
            {/* Header */}
            <Box mb={{ xs: 2, sm: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            Orders Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage and track all your orders
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<UploadIcon />}
                        onClick={() => setImportModalOpen(true)}
                        size="small"
                        sx={{ alignSelf: 'center', whiteSpace: 'nowrap' }}
                    >
                        Bulk Import
                    </Button>
                </Box>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }} elevation={1}>
                <TextField
                    fullWidth
                    placeholder="Search by customer name, phone, address, product or order ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
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
            <Paper sx={{ mb: 3 }} elevation={1}>
                <Tabs
                    value={tab}
                    onChange={(e, val) => setTab(val)}
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons={isMobile ? "auto" : false}
                    allowScrollButtonsMobile
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: 56,
                            fontSize: '0.875rem',
                            textTransform: 'none'
                        }
                    }}
                >
                    {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'] as OrderStatus[]).map((status) => (
                        <Tab
                            key={status}
                            label={
                                <Badge badgeContent={status === tab ? totalCount : undefined} color={statusColors[status] as any}>
                                    <Box sx={{ px: 1, textTransform: 'capitalize' }}>
                                        {status}
                                    </Box>
                                </Badge>
                            }
                            value={status}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Results Summary */}
            {search && (
                <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                        Found {filteredOrders.length} {tab} order{filteredOrders.length !== 1 ? 's' : ''}
                        {search && ` matching "${search}"`}
                    </Typography>
                </Box>
            )}

            {/* Orders List */}
            <Paper elevation={1} sx={{ overflow: 'hidden' }}>
                {filteredOrders.length > 0 ? (
                    <List sx={{ p: 0 }}>
                        {filteredOrders.map((order, index) => (
                            <React.Fragment key={order._id}>
                                <ListItem
                                    button
                                    onClick={() => handleOrderClick(order)}
                                    sx={{
                                        py: { xs: 1.5, sm: 2 },
                                        px: { xs: 2, sm: 3 },
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            sx={{
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                color: theme.palette.primary.main,
                                                width: 48,
                                                height: 48
                                            }}
                                        >
                                            <PersonIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    {order.customer?.name || 'Unknown Customer'}
                                                </Typography>
                                                <Typography variant="body1" color="primary" fontWeight="bold">
                                                    {order.totalPrice?.toLocaleString() || 0} ETB
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box mt={0.5}>
                                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                    <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {order.customer?.phone || 'No phone'}
                                                    </Typography>
                                                </Box>
                                                {order.customer?.address && (
                                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                        <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography 
                                                            variant="body2" 
                                                            color="text.secondary"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: { xs: '200px', sm: '300px' }
                                                            }}
                                                        >
                                                            {order.customer.address}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                    {(typeof order.items?.[0]?.product === 'object' && order.items?.[0]?.product !== null ? order.items[0].product.name : '') || 'No items'}
                                                    {order.items?.length > 1 && (
                                                        <Typography component="span" color="text.secondary">
                                                            {' '} +{order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Chip
                                                        icon={statusIcons[order.status]}
                                                        label={order.status}
                                                        color={statusColors[order.status]}
                                                        size="small"
                                                        sx={{ 
                                                            height: 24, 
                                                            fontSize: '0.75rem',
                                                            textTransform: 'capitalize'
                                                        }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        #{order._id?.slice(-8)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                        sx={{ pr: isMobile ? 8 : 12 }}
                                    />
                                    
                                    <ListItemSecondaryAction>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {/* Quick Action Button */}
                                            {statusActions[order.status] && (
                                                <Tooltip title={`Mark as ${statusActions[order.status]?.next}`}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        color={statusActions[order.status]?.color}
                                                        onClick={(e) => handleQuickAction(e, order)}
                                                        startIcon={statusActions[order.status]?.icon}
                                                        sx={{
                                                            minWidth: isMobile ? 'auto' : 100,
                                                            px: isMobile ? 1 : 2,
                                                            '& .MuiButton-startIcon': {
                                                                mr: isMobile ? 0 : 1
                                                            }
                                                        }}
                                                    >
                                                        {!isMobile && statusActions[order.status]?.label}
                                                    </Button>
                                                </Tooltip>
                                            )}
                                            
                                            {/* Details Button */}
                                            <Tooltip title="View Details">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleOrderClick(order)}
                                                    size="small"
                                                >
                                                    <ChevronRightIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < filteredOrders.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No orders found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {search
                                ? `No ${tab} orders matching "${search}"`
                                : `No ${tab} orders at the moment`
                            }
                        </Typography>
                    </Box>
                )}
            </Paper>

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
                                <Box>
                                    {!editMode && (
                                        <>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => setEditMode(true)}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => setDeleteConfirmOpen(true)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </>
                                    )}
                                    <Chip
                                        label={selectedOrder.status}
                                        color={statusColors[selectedOrder.status]}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    />
                                </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Order ID: {selectedOrder._id}
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
                            {/* Customer Info */}
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" />
                                Customer Information
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                {editMode ? (
                                    <>
                                        <TextField
                                            fullWidth
                                            label="Customer Name"
                                            value={editFormData.customer.name}
                                            onChange={(e) => handleEditChange('customer.name', e.target.value)}
                                            size="small"
                                            sx={{ mb: 1.5 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            value={editFormData.customer.phone}
                                            onChange={(e) => handleEditChange('customer.phone', e.target.value)}
                                            size="small"
                                            sx={{ mb: 1.5 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            value={editFormData.customer.address}
                                            onChange={(e) => handleEditChange('customer.address', e.target.value)}
                                            size="small"
                                            multiline
                                            rows={2}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationIcon color="action" fontSize="small" />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                            <PersonIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedOrder.customer?.name || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {selectedOrder.customer?.phone || 'No phone'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {selectedOrder.customer?.address && (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <LocationIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.2 }} />
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                                        Delivery Address:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {selectedOrder.customer.address}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Paper>

                            {/* Items */}
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InventoryIcon fontSize="small" />
                                Order Items &amp; Pricing
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                {editMode ? (
                                    <>
                                        {editFormData.items.map((item: any, idx: number) => (
                                            <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: idx < editFormData.items.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                                    {item.productName || `Item #${idx + 1}`}
                                                </Typography>
                                                <Grid container spacing={1.5}>
                                                    <Grid item xs={4}>
                                                        <TextField
                                                            fullWidth
                                                            label="Size"
                                                            value={item.size}
                                                            onChange={(e) => handleEditChange('size', e.target.value, idx)}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <TextField
                                                            fullWidth
                                                            label="Quantity"
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleEditChange('quantity', parseInt(e.target.value) || 1, idx)}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <TextField
                                                            fullWidth
                                                            label="Unit Price (ETB)"
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => handleEditChange('price', parseFloat(e.target.value) || 0, idx)}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}

                                        {/* Order-Level Adjustments in Edit Mode */}
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                            Order-Level Discounts &amp; Adjustments
                                        </Typography>
                                        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                            <Grid item xs={7}>
                                                <TextField
                                                    fullWidth
                                                    label="Order Discount"
                                                    type="number"
                                                    size="small"
                                                    value={editFormData.discount}
                                                    onChange={(e) => setEditFormData({ ...editFormData, discount: parseFloat(e.target.value) || 0 })}
                                                />
                                            </Grid>
                                            <Grid item xs={5}>
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Type</InputLabel>
                                                    <Select
                                                        value={editFormData.discountType || 'fixed'}
                                                        label="Type"
                                                        onChange={(e) => setEditFormData({ ...editFormData, discountType: e.target.value as any })}
                                                    >
                                                        <MenuItem value="fixed">Fixed ETB</MenuItem>
                                                        <MenuItem value="percentage">Percent %</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Adjustment / Extra Fee (ETB)"
                                                    type="number"
                                                    size="small"
                                                    value={editFormData.adjustment}
                                                    onChange={(e) => setEditFormData({ ...editFormData, adjustment: parseFloat(e.target.value) || 0 })}
                                                    placeholder="e.g. +200 delivery fee"
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Negotiation Notes"
                                                    size="small"
                                                    value={editFormData.negotiationNotes}
                                                    onChange={(e) => setEditFormData({ ...editFormData, negotiationNotes: e.target.value })}
                                                    placeholder="e.g. Reason for discount or deal terms"
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                ) : (
                                    <>
                                        {selectedOrder.items?.map((item: any, i: number) => {
                                            const origPrice = item.originalPrice;
                                            const hasVariance = origPrice && origPrice !== item.price;
                                            const isDiscounted = hasVariance && item.price < origPrice;
                                            const isMarkedUp = hasVariance && item.price > origPrice;

                                            return (
                                                <Box key={i} sx={{ mb: 1.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                            <Typography fontWeight={600}>
                                                                {typeof item.product === 'object' && item.product !== null ? item.product.name : 'Item'}
                                                                <Chip size="small" label={`Size: ${item.size}`} sx={{ ml: 1, height: 20, fontSize: '0.72rem' }} />
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                                                Qty: {item.quantity} × {item.price?.toLocaleString()} ETB
                                                                {hasVariance && (
                                                                    <span style={{ textDecoration: 'line-through', marginLeft: 8, opacity: 0.6 }}>
                                                                        list: {origPrice.toLocaleString()} ETB
                                                                    </span>
                                                                )}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ textAlign: 'right' }}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {((item.price || 0) * item.quantity).toLocaleString()} ETB
                                                            </Typography>
                                                            {isDiscounted && (
                                                                <Chip
                                                                    size="small"
                                                                    color="success"
                                                                    label={`-${((origPrice - item.price) * item.quantity).toLocaleString()} ETB`}
                                                                    sx={{ height: 18, fontSize: '0.68rem', mt: 0.25 }}
                                                                />
                                                            )}
                                                            {isMarkedUp && (
                                                                <Chip
                                                                    size="small"
                                                                    color="primary"
                                                                    label={`+${((item.price - origPrice) * item.quantity).toLocaleString()} ETB`}
                                                                    sx={{ height: 18, fontSize: '0.68rem', mt: 0.25 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                    {i < (selectedOrder.items?.length || 0) - 1 && <Divider sx={{ my: 1.5 }} />}
                                                </Box>
                                            );
                                        })}

                                        {/* Negotiation Notes in View Mode */}
                                        {selectedOrder.negotiationNotes && (
                                            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                                                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">
                                                    Negotiation Notes:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {selectedOrder.negotiationNotes}
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Paper>

                            {/* Total & Pricing Breakdown */}
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: 1.5,
                                    mb: 2,
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.primary.main, 0.15)
                                }}
                            >
                                {!editMode && (((selectedOrder.discount || 0) > 0) || (selectedOrder.adjustment !== undefined && selectedOrder.adjustment !== 0)) && (
                                    <Stack spacing={0.75} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px dashed', borderColor: 'divider' }}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Items Subtotal</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {(selectedOrder.subtotal || selectedOrder.totalPrice).toLocaleString()} ETB
                                            </Typography>
                                        </Box>
                                        {(selectedOrder.discount || 0) > 0 && (
                                            <Box display="flex" justifyContent="space-between" color="success.main">
                                                <Typography variant="body2">Order Discount</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    -{(selectedOrder.discount || 0).toLocaleString()} ETB
                                                </Typography>
                                            </Box>
                                        )}
                                        {selectedOrder.adjustment !== undefined && selectedOrder.adjustment !== 0 && (
                                            <Box display="flex" justifyContent="space-between" color={selectedOrder.adjustment > 0 ? "primary.main" : "error.main"}>
                                                <Typography variant="body2">Adjustment / Charges</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedOrder.adjustment > 0 ? `+${selectedOrder.adjustment.toLocaleString()}` : selectedOrder.adjustment.toLocaleString()} ETB
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                )}

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">
                                        Total Payable Amount
                                    </Typography>
                                    <Typography variant="h5" color="primary" fontWeight="bold">
                                        {(editMode 
                                            ? Math.max(0, editFormData.items.reduce((sum: number, item: any) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0) - (Number(editFormData.discount) || 0) + (Number(editFormData.adjustment) || 0))
                                            : selectedOrder.totalPrice || 0
                                        ).toLocaleString()} ETB
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Status Update — Admin only */}
                            {!editMode && isAdmin && nextStatus(selectedOrder.status) && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ShippingIcon fontSize="small" />
                                        Update Status
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>New Status</InputLabel>
                                        <Select
                                            value={selectedOrder.status}
                                            onChange={(e) => {
                                                updateStatus(selectedOrder._id, e.target.value as OrderStatus);
                                                setDetailsOpen(false);
                                            }}
                                        >
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="confirmed">Confirmed</MenuItem>
                                            <MenuItem value="shipped">Shipped</MenuItem>
                                            <MenuItem value="delivered">Delivered</MenuItem>
                                            <MenuItem value="refunded">Refunded</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
                            {editMode ? (
                                <>
                                    <Button onClick={() => setEditMode(false)}>Cancel</Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveIcon />}
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Admin-only: progress status */}
                                    {isAdmin && selectedOrder && selectedOrder.status && statusActions[selectedOrder.status] && (
                                        <Button
                                            variant="contained"
                                            color={statusActions[selectedOrder.status]?.color}
                                            onClick={() => {
                                                if (selectedOrder && selectedOrder.status && statusActions[selectedOrder.status]) {
                                                    updateStatus(selectedOrder._id, statusActions[selectedOrder.status]!.next);
                                                    setDetailsOpen(false);
                                                }
                                            }}
                                            startIcon={statusActions[selectedOrder.status]?.icon}
                                        >
                                            Mark as {statusActions[selectedOrder.status]?.next}
                                        </Button>
                                    )}
                                    {/* Admin-only: cancel order */}
                                    {isAdmin && selectedOrder &&
                                        !['cancelled', 'delivered', 'refunded'].includes(selectedOrder.status) && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => handleCancelClick(selectedOrder)}
                                        >
                                            Cancel Order
                                        </Button>
                                    )}
                                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                                </>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: 'error.main' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CancelIcon />
                        Cancel Order
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Are you sure you want to cancel this order? Stock will be automatically restored.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Cancellation Reason (optional)"
                        multiline
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g. Customer requested cancellation"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>Keep Order</Button>
                    <Button onClick={cancelOrder} color="error" variant="contained" startIcon={<CancelIcon />}>
                        Yes, Cancel Order
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this order? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => deleteOrder(selectedOrder!._id)} 
                        color="error" 
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Import Modal */}
            <BulkImportModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title="Bulk Import Orders"
                templateEndpoint="/orders/import-template"
                importEndpoint="/orders/import"
                onSuccess={() => fetchOrders(1, tab)}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={page <= 1}
                        onClick={() => { const p = page - 1; setPage(p); fetchOrders(p, tab); }}
                        startIcon={<NavigateBeforeIcon />}
                    >
                        Previous
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        Page {page} of {totalPages} ({totalCount} orders)
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={page >= totalPages}
                        onClick={() => { const p = page + 1; setPage(p); fetchOrders(p, tab); }}
                        endIcon={<NavigateNextIcon />}
                    >
                        Next
                    </Button>
                </Box>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OrdersPage;