import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip,
    Stack,
    useMediaQuery,
    useTheme,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Divider,
    Fab
} from "@mui/material";
import {
    Inventory as InventoryIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Menu as MenuIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
    MoreVert as MoreVertIcon
} from "@mui/icons-material";
import API from "../api/axios";
import type { Product, LowStockItem, RestockSuggestion, ProductSize } from "../types";
import type { ChipProps } from "@mui/material";

interface ProductFormData {
    name: string;
    team: string;
    price: string;
    costPrice: string;
    sizes: ProductSize[];
}

const Inventory = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [products, setProducts] = useState<Product[]>([]);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [tabValue, setTabValue] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        team: "",
        price: "",
        costPrice: "",
        sizes: [{ size: "", stock: 0 }]
    });

    // Fetch all data on component mount
    useEffect(() => {
        fetchProducts();
        fetchLowStockItems();
        fetchRestockSuggestions();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await API.get("/products");
            setProducts(response.data);
        } catch (error) {
            setError("Failed to fetch products");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLowStockItems = async () => {
        try {
            const response = await API.get("/inventory/low-stock");
            setLowStockItems(response.data);
        } catch (error) {
            console.error("Failed to fetch low stock items:", error);
        }
    };

    const fetchRestockSuggestions = async () => {
        try {
            const response = await API.get("/inventory/restock-suggestions");
            setRestockSuggestions(response.data);
        } catch (error) {
            console.error("Failed to fetch restock suggestions:", error);
        }
    };

    const handleOpenDialog = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                team: product.team || "",
                price: product.price?.toString() || "",
                costPrice: product.costPrice?.toString() || "",
                sizes: product.sizes.map(s => ({
                    size: s.size,
                    stock: Number(s.stock) || 0
                }))
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                team: "",
                price: "",
                costPrice: "",
                sizes: [{ size: "", stock: 0 }]
            });
        }
        setOpenDialog(true);
        setMobileMenuOpen(false);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingProduct(null);
        setError("");
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSizeChange = (index: number, field: keyof ProductSize, value: string) => {
        const newSizes = [...formData.sizes];
        if (field === "stock") {
            newSizes[index][field] = parseInt(value) || 0;
        } else {
            newSizes[index][field] = value;
        }
        setFormData({ ...formData, sizes: newSizes });
    };

    const addSize = () => {
        setFormData({
            ...formData,
            sizes: [...formData.sizes, { size: "", stock: 0 }]
        });
    };

    const removeSize = (index: number) => {
        const newSizes = formData.sizes.filter((_, i) => i !== index);
        setFormData({ ...formData, sizes: newSizes });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError("");

            // Validate form
            if (!formData.name || !formData.costPrice) {
                setError("Name and Cost Price are required");
                return;
            }

            // Check for duplicate sizes
            const sizeNames = formData.sizes.map(s => s.size.toLowerCase());
            const hasDuplicates = sizeNames.some((size, index) => sizeNames.indexOf(size) !== index);
            if (hasDuplicates) {
                setError("Duplicate sizes are not allowed. Please use unique size names.");
                return;
            }

            // Validate sizes
            const invalidSizes = formData.sizes.filter(s => !s.size || s.size.trim() === "");
            if (invalidSizes.length > 0) {
                setError("All sizes must have a valid size name");
                return;
            }

            // Ensure at least one size
            if (formData.sizes.length === 0) {
                setError("At least one size variant is required");
                return;
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                costPrice: parseFloat(formData.costPrice),
                sizes: formData.sizes.map(s => ({
                    size: s.size.trim(),
                    stock: Number(s.stock) || 0
                }))
            };

            if (editingProduct) {
                await API.put(`/products/${editingProduct._id}`, payload);
                setSuccess("Product updated successfully");
            } else {
                await API.post("/products", payload);
                setSuccess("Product created successfully");
            }

            handleCloseDialog();
            fetchProducts();
            fetchLowStockItems();
            fetchRestockSuggestions();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

        try {
            setLoading(true);
            await API.delete(`/products/${id}`);
            setSuccess("Product deleted successfully");
            fetchProducts();
            fetchLowStockItems();
            fetchRestockSuggestions();
            setTimeout(() => setSuccess(""), 3000);
            setMobileMenuOpen(false);
        } catch (error) {
            setError("Failed to delete product");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (productId: string, size: string, currentStock: number) => {
        const newStock = prompt(`Update stock for size ${size}:`, currentStock.toString());
        if (newStock === null || newStock === "") return;

        const stockValue = parseInt(newStock);
        if (isNaN(stockValue) || stockValue < 0) {
            setError("Please enter a valid stock number (0 or greater)");
            setTimeout(() => setError(""), 3000);
            return;
        }

        try {
            await API.patch(`/products/${productId}/stock`, {
                size,
                stock: stockValue
            });
            fetchProducts();
            fetchLowStockItems();
            fetchRestockSuggestions();
            setSuccess("Stock updated successfully");
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            setError("Failed to update stock");
            setTimeout(() => setError(""), 3000);
        }
    };

    const getStockStatus = (stock: number): { label: string; color: ChipProps['color'] } => {
        if (stock === 0) return { label: "Out of Stock", color: "error" };
        if (stock <= 3) return { label: "Low Stock", color: "warning" };
        return { label: "In Stock", color: "success" };
    };

    const getTotalStock = (product: Product): number => {
        return product.sizes.reduce((total, size) => total + size.stock, 0);
    };

    // Mobile Product Card Component
    const MobileProductCard = ({ product }: { product: Product }) => (
        <Card sx={{ mb: 2, position: 'relative' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {product.name}
                        </Typography>
                        {product.team && (
                            <Chip
                                label={product.team}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mb: 1 }}
                            />
                        )}
                    </Box>
                    <Box>
                        <IconButton
                            size="small"
                            onClick={() => setSelectedProduct(selectedProduct === product._id ? null : product._id)}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                            Price
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            ${product.price?.toFixed(2) || "0.00"}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                            Cost
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            ${product.costPrice?.toFixed(2) || "0.00"}
                        </Typography>
                    </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Size Variants
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    {product.sizes.map((size) => {
                        const status = getStockStatus(size.stock);
                        return (
                            <Chip
                                key={size.size}
                                label={`${size.size}: ${size.stock}`}
                                color={status.color}
                                size="small"
                                onClick={() => handleUpdateStock(product._id, size.size, size.stock)}
                                sx={{ cursor: 'pointer' }}
                            />
                        );
                    })}
                </Stack>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Total Stock
                        </Typography>
                        <Chip
                            label={getTotalStock(product)}
                            color={getTotalStock(product) === 0 ? "error" : "default"}
                            size="small"
                        />
                    </Box>

                    {selectedProduct === product._id && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenDialog(product)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDelete(product._id)}
                            >
                                Delete
                            </Button>
                        </Stack>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    // Mobile Low Stock Card Component
    const MobileLowStockCard = ({ item }: { item: LowStockItem }) => {
        const status = getStockStatus(item.stock);
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {item.productName}
                        </Typography>
                        <Chip label={status.label} color={status.color} size="small" />
                    </Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                                Size
                            </Typography>
                            <Typography variant="body1">
                                {item.size}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                                Current Stock
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color={status.color}>
                                {item.stock}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        onClick={() => handleUpdateStock(item.productId, item.size, item.stock)}
                    >
                        Update Stock
                    </Button>
                </CardContent>
            </Card>
        );
    };

    // Mobile Restock Suggestion Card
    const MobileRestockCard = ({ suggestion }: { suggestion: RestockSuggestion }) => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {suggestion.productName}
                </Typography>
                <Chip
                    label={suggestion.size}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                            Stock
                        </Typography>
                        <Typography variant="body1">
                            {suggestion.currentStock}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                            Daily Demand
                        </Typography>
                        <Typography variant="body1">
                            {suggestion.estimatedDailyDemand}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                            Reorder
                        </Typography>
                        <Chip
                            label={suggestion.reorderQty}
                            color="primary"
                            size="small"
                            icon={<AddIcon />}
                        />
                    </Grid>
                </Grid>
                <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={() => handleUpdateStock(
                        suggestion.productId,
                        suggestion.size,
                        suggestion.currentStock
                    )}
                >
                    Update Now
                </Button>
            </CardContent>
        </Card>
    );

    if (loading && products.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
            {/* Header Section */}
            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                mb={3}
                gap={2}
            >
                <Box>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom>
                        Inventory Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your stock levels and products with size variants
                    </Typography>
                </Box>

                <Stack
                    direction="row"
                    spacing={1}
                    justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                >
                    {isMobile ? (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                fullWidth
                            >
                                Add Product
                            </Button>
                            <IconButton
                                onClick={() => {
                                    fetchProducts();
                                    fetchLowStockItems();
                                    fetchRestockSuggestions();
                                }}
                                color="primary"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                            >
                                Add Product
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => {
                                    fetchProducts();
                                    fetchLowStockItems();
                                    fetchRestockSuggestions();
                                }}
                            >
                                Refresh
                            </Button>
                        </>
                    )}
                </Stack>
            </Box>

            {/* Alerts */}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {lowStockItems.length > 0 && (
                <Alert
                    severity="warning"
                    icon={<WarningIcon />}
                    sx={{ mb: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => setTabValue(1)}
                        >
                            View Details
                        </Button>
                    }
                >
                    You have {lowStockItems.length} size variant{lowStockItems.length !== 1 ? 's' : ''} with low stock!
                </Alert>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    variant={isMobile ? "fullWidth" : "standard"}
                    scrollButtons={isMobile ? false : "auto"}
                >
                    <Tab label={isMobile ? `Products (${products.length})` : `Products (${products.length})`} />
                    <Tab label={isMobile ? `Low Stock (${lowStockItems.length})` : `Low Stock Alerts (${lowStockItems.length})`} />
                    <Tab label={isMobile ? `Restock (${restockSuggestions.length})` : `Restock Suggestions (${restockSuggestions.length})`} />
                </Tabs>
            </Paper>

            {/* Content based on tab */}
            {tabValue === 0 && (
                <>
                    {isMobile ? (
                        // Mobile Products View
                        <Box>
                            {products.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        No products found. Click "Add Product" to create your first product.
                                    </Typography>
                                </Paper>
                            ) : (
                                products.map((product) => (
                                    <MobileProductCard key={product._id} product={product} />
                                ))
                            )}
                        </Box>
                    ) : (
                        // Desktop Products Table
                        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product Name</TableCell>
                                        <TableCell>Team</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Cost Price</TableCell>
                                        <TableCell>Size Variants & Stock</TableCell>
                                        <TableCell>Total Stock</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                                <Typography color="text.secondary">
                                                    No products found. Click "Add Product" to create your first product.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map((product) => (
                                            <TableRow key={product._id}>
                                                <TableCell>
                                                    <Typography fontWeight="medium">
                                                        {product.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{product.team || "-"}</TableCell>
                                                <TableCell>${product.price?.toFixed(2) || "0.00"}</TableCell>
                                                <TableCell>${product.costPrice?.toFixed(2) || "0.00"}</TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        {product.sizes.map((size) => {
                                                            const status = getStockStatus(size.stock);
                                                            return (
                                                                <Tooltip
                                                                    key={size.size}
                                                                    title={`Click to update stock for ${size.size}`}
                                                                    arrow
                                                                >
                                                                    <Chip
                                                                        label={`${size.size}: ${size.stock}`}
                                                                        color={status.color}
                                                                        size="small"
                                                                        onClick={() => handleUpdateStock(product._id, size.size, size.stock)}
                                                                        sx={{ cursor: 'pointer' }}
                                                                    />
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getTotalStock(product)}
                                                        color={getTotalStock(product) === 0 ? "error" : "default"}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        onClick={() => handleOpenDialog(product)}
                                                        color="primary"
                                                        size="small"
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDelete(product._id)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {tabValue === 1 && (
                <>
                    {isMobile ? (
                        // Mobile Low Stock View
                        <Box>
                            {lowStockItems.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography color="success.main">
                                        Great! No low stock items found. All inventory levels are healthy.
                                    </Typography>
                                </Paper>
                            ) : (
                                lowStockItems.map((item, index) => (
                                    <MobileLowStockCard
                                        key={`${item.productId}-${item.size}-${index}`}
                                        item={item}
                                    />
                                ))
                            )}
                        </Box>
                    ) : (
                        // Desktop Low Stock Table
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Current Stock</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lowStockItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                <Typography color="success.main">
                                                    Great! No low stock items found. All inventory levels are healthy.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lowStockItems.map((item, index) => {
                                            const status = getStockStatus(item.stock);
                                            return (
                                                <TableRow key={`${item.productId}-${item.size}-${index}`}>
                                                    <TableCell>{item.productName}</TableCell>
                                                    <TableCell>
                                                        <Chip label={item.size} size="small" />
                                                    </TableCell>
                                                    <TableCell>{item.stock}</TableCell>
                                                    <TableCell>
                                                        <Chip label={status.label} color={status.color} size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => handleUpdateStock(item.productId, item.size, item.stock)}
                                                        >
                                                            Update Stock
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {tabValue === 2 && (
                <>
                    {isMobile ? (
                        // Mobile Restock View
                        <Box>
                            {restockSuggestions.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        No restock suggestions available at this time.
                                    </Typography>
                                </Paper>
                            ) : (
                                restockSuggestions.map((suggestion, index) => (
                                    <MobileRestockCard key={index} suggestion={suggestion} />
                                ))
                            )}
                        </Box>
                    ) : (
                        // Desktop Restock Table
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Current Stock</TableCell>
                                        <TableCell>Daily Demand</TableCell>
                                        <TableCell>Suggested Reorder</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {restockSuggestions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                <Typography color="text.secondary">
                                                    No restock suggestions available at this time.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        restockSuggestions.map((suggestion, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{suggestion.productName}</TableCell>
                                                <TableCell>
                                                    <Chip label={suggestion.size} size="small" />
                                                </TableCell>
                                                <TableCell>{suggestion.currentStock}</TableCell>
                                                <TableCell>{suggestion.estimatedDailyDemand}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={suggestion.reorderQty}
                                                        color="primary"
                                                        icon={<AddIcon />}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleUpdateStock(
                                                            suggestion.productId,
                                                            suggestion.size,
                                                            suggestion.currentStock
                                                        )}
                                                    >
                                                        Update Now
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {/* Product Form Dialog - Responsive */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant={isMobile ? "h6" : "h5"}>
                            {editingProduct ? "Edit Product" : "Add New Product"}
                        </Typography>
                        {isMobile && (
                            <IconButton onClick={handleCloseDialog} edge="end">
                                <CloseIcon />
                            </IconButton>
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Product Name"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            margin="normal"
                            required
                            helperText="e.g., Home Jersey, Training Kit"
                            size={isMobile ? "small" : "medium"}
                        />
                        <TextField
                            fullWidth
                            label="Team"
                            name="team"
                            value={formData.team}
                            onChange={handleFormChange}
                            margin="normal"
                            helperText="e.g., First Team, U21, Women's Team"
                            size={isMobile ? "small" : "medium"}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Selling Price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleFormChange}
                                    margin="normal"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    helperText="Price customers will pay"
                                    size={isMobile ? "small" : "medium"}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Cost Price"
                                    name="costPrice"
                                    type="number"
                                    value={formData.costPrice}
                                    onChange={handleFormChange}
                                    margin="normal"
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    helperText="Your purchase cost"
                                    size={isMobile ? "small" : "medium"}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Size Variants & Stock Levels
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Add different sizes with their current stock quantities
                            </Typography>
                        </Box>

                        {formData.sizes.map((size, index) => (
                            <Grid container spacing={1} key={index} sx={{ mb: 1 }} alignItems="center">
                                <Grid item xs={5}>
                                    <TextField
                                        fullWidth
                                        label="Size"
                                        value={size.size}
                                        onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                                        size="small"
                                        placeholder={isMobile ? "S, M, L" : "e.g., S, M, L, XL"}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        fullWidth
                                        label="Stock"
                                        type="number"
                                        value={size.stock}
                                        onChange={(e) => handleSizeChange(index, "stock", e.target.value)}
                                        size="small"
                                        InputProps={{ inputProps: { min: 0 } }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    {formData.sizes.length > 1 && (
                                        <IconButton
                                            onClick={() => removeSize(index)}
                                            color="error"
                                            size="small"
                                            title="Remove size variant"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Grid>
                            </Grid>
                        ))}

                        <Button
                            onClick={addSize}
                            startIcon={<AddIcon />}
                            sx={{ mt: 1 }}
                            variant="outlined"
                            size="small"
                            fullWidth={isMobile}
                        >
                            Add Another Size
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleCloseDialog}
                        startIcon={<CancelIcon />}
                        fullWidth={isMobile}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                        fullWidth={isMobile}
                    >
                        {loading ? <CircularProgress size={24} /> : (editingProduct ? "Update" : "Save")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Inventory;