import React, { useEffect, useState, useMemo } from "react";
import type { Order, OrderStatus, SnackbarState } from "../types";
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
    Home as HomeIcon
} from "@mui/icons-material";
import API from "../api/axios";

const statusColors: Record<OrderStatus, 'warning' | 'info' | 'primary' | 'success'> = {
    pending: "warning",
    confirmed: "info",
    shipped: "primary",
    delivered: "success"
};

const statusIcons: Record<OrderStatus, React.ReactElement> = {
    pending: <ReceiptIcon />,
    confirmed: <CheckCircleIcon />,
    shipped: <ShippingIcon />,
    delivered: <InventoryIcon />
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
    delivered: null // No next action for delivered orders
};

const OrdersPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [orders, setOrders] = useState<Order[]>([]);
    const [tab, setTab] = useState<OrderStatus>("pending");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState<{
        customer: { name: string; phone: string; address: string };
        items: Array<{ _id?: string; product: string; productName: string; size: string; quantity: number; price: number }>;
    }>({
        customer: { name: "", phone: "", address: "" },
        items: []
    });
    const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await API.get("/orders");
            setOrders(res.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            showSnackbar("Error fetching orders", "error");
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
                o.customer?.address?.toLowerCase().includes(search.toLowerCase()) ||
                o.items?.some((i) =>
                    (typeof i.product === 'object' && i.product !== null ? i.product.name : '')?.toLowerCase().includes(search.toLowerCase())
                ) ||
                o._id?.toLowerCase().includes(search.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [orders, tab, search]);

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

    const getStatusCount = (status: OrderStatus): number => {
        return orders.filter(o => o.status === status).length;
    };

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
                size: item.size,
                quantity: item.quantity,
                price: item.price
            })) || []
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
        const updatedOrder = {
            customer: editFormData.customer,
            items: editFormData.items.map(item => ({
                product: item.product,
                size: item.size,
                quantity: item.quantity,
                price: item.price
            }))
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
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Orders Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage and track all your orders
                </Typography>
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
                    {(['pending', 'confirmed', 'shipped', 'delivered'] as OrderStatus[]).map((status) => (
                        <Tab
                            key={status}
                            label={
                                <Badge badgeContent={getStatusCount(status)} color={statusColors[status]}>
                                    <Box sx={{ px: 2, textTransform: 'capitalize' }}>
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
                                                    ₹{order.totalPrice?.toLocaleString() || 0}
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
                                Order Items
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                {editMode ? (
                                    <>
                                        {editFormData.items.map((item, idx) => (
                                            <Box key={idx} sx={{ mb: 2, pb: 1, borderBottom: idx < editFormData.items.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                                                <TextField
                                                    fullWidth
                                                    label="Product Name"
                                                    value={item.productName}
                                                    disabled
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                />
                                                <Grid container spacing={1}>
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
                                                            onChange={(e) => handleEditChange('quantity', parseInt(e.target.value), idx)}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <TextField
                                                            fullWidth
                                                            label="Price"
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => handleEditChange('price', parseFloat(e.target.value), idx)}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}
                                    </>
                                ) : (
                                    selectedOrder.items?.map((item, i) => (
                                        <Box key={i} sx={{ mb: 1 }}>
                                            <Typography>
                                                <strong>{typeof item.product === 'object' && item.product !== null ? item.product.name : ''}</strong> - Size: {item.size}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Quantity: {item.quantity} × ₹{item.price?.toLocaleString()}
                                            </Typography>
                                            {i < selectedOrder.items.length - 1 && <Divider sx={{ my: 1 }} />}
                                        </Box>
                                    ))
                                )}
                            </Paper>

                            {/* Total */}
                            <Box 
                                display="flex" 
                                justifyContent="space-between" 
                                alignItems="center"
                                sx={{ 
                                    p: 2, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: 1,
                                    mb: 2
                                }}
                            >
                                <Typography variant="h6">
                                    Total Amount
                                </Typography>
                                <Typography variant="h5" color="primary" fontWeight="bold">
                                    ₹{editMode 
                                        ? editFormData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()
                                        : selectedOrder.totalPrice?.toLocaleString()
                                    }
                                </Typography>
                            </Box>

                            {/* Status Update */}
                            {!editMode && nextStatus(selectedOrder.status) && (
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
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
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
                                    {selectedOrder && selectedOrder.status && statusActions[selectedOrder.status] && (
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
                                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                                </>
                            )}
                        </DialogActions>
                    </>
                )}
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