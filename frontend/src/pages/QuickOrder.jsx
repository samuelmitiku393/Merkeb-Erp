import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Stack,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Zoom,
  Fade,
  Select,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
  Collapse,
  Fab
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingBag as ShoppingBagIcon,
  ExpandMore as ExpandMoreIcon,
  LocalMall as LocalMallIcon,
  Remove as RemoveIcon
} from "@mui/icons-material";
import API from "../api/axios";

const QuickOrder = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", instagram: "" });
  const [showCustomerSearch, setShowCustomerSearch] = useState(true);

  const [items, setItems] = useState([
    { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false }
  ]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ customer: true, items: {} });

  const productRefs = useRef([]);
  const customerInputRef = useRef(null);
  const mainContentRef = useRef(null);

  // Calculate order total whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      if (item.selectedProduct && item.size && item.quantity) {
        return sum + (item.selectedProduct.price * item.quantity);
      }
      return sum;
    }, 0);
    setOrderTotal(total);
  }, [items]);

  // Initialize expanded states for items
  useEffect(() => {
    const itemStates = {};
    items.forEach((_, index) => {
      itemStates[index] = items[index]?.selectedProduct ? false : true;
    });
    setExpandedSections(prev => ({ ...prev, items: itemStates }));
  }, [items.length]);

  // Customer Search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!customerQuery.trim() || customerQuery.length < 2) {
        setCustomerResults([]);
        return;
      }

      setCustomerLoading(true);
      try {
        const res = await API.get(`/customers/search?q=${customerQuery}`);
        setCustomerResults(res.data);
      } catch (error) {
        console.error("Error searching customers:", error);
      } finally {
        setCustomerLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [customerQuery]);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setCustomerResults([]);
    setShowCustomerSearch(false);
    setExpandedSections(prev => ({ ...prev, customer: false }));
    setTimeout(() => {
      productRefs.current[0]?.focus();
    }, 100);
  };

  const handleCreateCustomer = async () => {
    try {
      const res = await API.post("/customers", {
        name: newCustomer.name,
        phone: newCustomer.phone,
        instagramHandle: newCustomer.instagram || newCustomer.name
      });
      selectCustomer(res.data);
      setCreateCustomerOpen(false);
      setNewCustomer({ name: "", phone: "", instagram: "" });
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  // Product Search
  const handleProductSearch = (index, query) => {
    const newItems = [...items];
    newItems[index].productQuery = query;
    newItems[index].loading = true;
    setItems(newItems);

    setTimeout(async () => {
      if (!query.trim() || query.length < 2) {
        newItems[index].productResults = [];
        newItems[index].loading = false;
        setItems([...newItems]);
        return;
      }

      try {
        const res = await API.get(`/products/search?q=${query}`);
        newItems[index].productResults = res.data;
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        newItems[index].loading = false;
        setItems([...newItems]);
      }
    }, 300);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index].selectedProduct = product;
    newItems[index].productQuery = product.name;
    newItems[index].productResults = [];
    newItems[index].size = "";
    newItems[index].quantity = 1;
    setItems(newItems);

    // Collapse this item's search and expand next if exists
    setExpandedSections(prev => ({
      ...prev,
      items: { ...prev.items, [index]: false }
    }));
  };

  const addItem = () => {
    const newIndex = items.length;
    setItems([
      ...items,
      { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false }
    ]);
    setExpandedSections(prev => ({
      ...prev,
      items: { ...prev.items, [newIndex]: true }
    }));
    setTimeout(() => {
      productRefs.current[newIndex]?.focus();
    }, 100);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const toggleSection = (section, index = null) => {
    if (index !== null) {
      setExpandedSections(prev => ({
        ...prev,
        items: { ...prev.items, [index]: !prev.items[index] }
      }));
    } else {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  const createOrder = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    const invalidItems = items.filter(item => !item.selectedProduct || !item.size);
    if (invalidItems.length > 0) {
      alert("Please complete all items (product and size)");
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        product: item.selectedProduct._id,
        size: item.size,
        quantity: parseInt(item.quantity)
      }));

      const res = await API.post("/orders", {
        customer: selectedCustomer._id,
        items: orderItems
      });

      setCreatedOrder(res.data);
      setSuccessDialog(true);

      // Reset form
      setSelectedCustomer(null);
      setCustomerQuery("");
      setShowCustomerSearch(true);
      setItems([
        { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false }
      ]);
      setExpandedSections({ customer: true, items: { 0: true } });
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateOrder = selectedCustomer && items.every(item => item.selectedProduct && item.size);
  const totalItems = items.filter(item => item.selectedProduct && item.size).length;
  const completedItems = items.filter(item => item.selectedProduct && item.size);

  // Mobile Order Summary Component (Always Visible)
  const MobileOrderSummary = () => (
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 100,
        mt: 'auto'
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Customer Summary */}
        {selectedCustomer ? (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                <CheckCircleIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {selectedCustomer.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedCustomer.phone}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerQuery("");
                setShowCustomerSearch(true);
                setExpandedSections(prev => ({ ...prev, customer: true }));
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 2, py: 0 }}>
            Please select a customer
          </Alert>
        )}

        {/* Items List */}
        {completedItems.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Order Items ({completedItems.length})
            </Typography>
            <Stack spacing={1}>
              {completedItems.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {item.selectedProduct.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Size: {item.size} × {item.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="medium" sx={{ ml: 2 }}>
                    ₹{(item.selectedProduct.price * item.quantity).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Total and Action */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              ₹{orderTotal.toLocaleString()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={createOrder}
            disabled={!canCreateOrder || submitting}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: 'none'
            }}
          >
            {submitting ? "Creating..." : "Place Order"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Quick Order
            </Typography>
            {totalItems > 0 && (
              <Typography variant="caption" color="text.secondary">
                {totalItems} item{totalItems !== 1 ? 's' : ''} • ₹{orderTotal.toLocaleString()}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${totalItems}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      {/* Main Scrollable Content */}
      <Box
        ref={mainContentRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          pb: isMobile ? 0 : 3
        }}
      >
        <Box sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 3}>
            {/* Left Column - Forms */}
            <Grid item xs={12} md={8}>
              {/* Customer Section */}
              <Paper
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: 'background.paper',
                  overflow: 'hidden'
                }}
              >
                {/* Section Header */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    bgcolor: selectedCustomer ? alpha(theme.palette.success.main, 0.04) : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }
                  }}
                  onClick={() => !selectedCustomer && toggleSection('customer')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: selectedCustomer ? 'success.main' : 'primary.main' }}>
                      {selectedCustomer ? <CheckCircleIcon /> : <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Customer Information
                      </Typography>
                      {selectedCustomer ? (
                        <Typography variant="body2" color="text.secondary">
                          {selectedCustomer.name} • {selectedCustomer.phone}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="error">
                          Required
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {!selectedCustomer && (
                    <IconButton size="small">
                      {expandedSections.customer ? <RemoveIcon /> : <AddIcon />}
                    </IconButton>
                  )}
                </Box>

                {/* Customer Form */}
                {!selectedCustomer && (
                  <Collapse in={expandedSections.customer}>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      {showCustomerSearch ? (
                        <>
                          <TextField
                            fullWidth
                            placeholder="Search by name or phone..."
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                            inputRef={customerInputRef}
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                              ),
                              endAdornment: customerLoading ? (
                                <InputAdornment position="end">
                                  <LinearProgress sx={{ width: 20 }} />
                                </InputAdornment>
                              ) : customerQuery && (
                                <InputAdornment position="end">
                                  <IconButton size="small" onClick={() => setCustomerQuery("")}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              sx: { borderRadius: 2 }
                            }}
                            autoFocus
                          />

                          {/* Search Results */}
                          {customerResults.length > 0 && (
                            <Paper
                              variant="outlined"
                              sx={{
                                mt: 1,
                                maxHeight: 250,
                                overflow: 'auto',
                                borderRadius: 2
                              }}
                            >
                              {customerResults.map((customer) => (
                                <Box
                                  key={customer._id}
                                  onClick={() => selectCustomer(customer)}
                                  sx={{
                                    p: 1.5,
                                    cursor: 'pointer',
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    '&:last-child': { borderBottom: 'none' },
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                      {customer.name.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" fontWeight="medium">
                                        {customer.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {customer.phone}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Paper>
                          )}

                          {/* Create New Customer */}
                          {customerQuery && customerResults.length === 0 && !customerLoading && (
                            <Button
                              variant="outlined"
                              startIcon={<PersonAddIcon />}
                              onClick={() => {
                                setNewCustomer({ ...newCustomer, name: customerQuery });
                                setCreateCustomerOpen(true);
                              }}
                              fullWidth
                              sx={{
                                mt: 2,
                                py: 1,
                                borderRadius: 2,
                                borderStyle: 'dashed'
                              }}
                            >
                              Create "{customerQuery}"
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="outlined"
                          onClick={() => setShowCustomerSearch(true)}
                          fullWidth
                          sx={{ py: 1, borderRadius: 2 }}
                        >
                          Search Customer
                        </Button>
                      )}
                    </Box>
                  </Collapse>
                )}
              </Paper>

              {/* Items Section */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: 'background.paper',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
                      <LocalMallIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Order Items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalItems} item{totalItems !== 1 ? 's' : ''} added
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      boxShadow: 'none'
                    }}
                  >
                    Add Item
                  </Button>
                </Box>

                <Divider />

                {/* Items List */}
                <Box>
                  {items.map((item, index) => (
                    <Box key={index}>
                      {/* Item Header */}
                      <Box
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          borderBottom: expandedSections.items[index] ? `1px solid ${theme.palette.divider}` : 'none',
                          bgcolor: item.selectedProduct ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('items', index)}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: item.selectedProduct ? 'primary.main' : alpha(theme.palette.primary.main, 0.1),
                            color: item.selectedProduct ? 'white' : 'primary.main',
                            fontSize: '0.875rem'
                          }}
                        >
                          {index + 1}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          {item.selectedProduct ? (
                            <>
                              <Typography variant="body2" fontWeight="medium">
                                {item.selectedProduct.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label={item.selectedProduct.team}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                {item.size && (
                                  <Chip
                                    label={`Size: ${item.size}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                                {item.quantity > 1 && (
                                  <Chip
                                    label={`Qty: ${item.quantity}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Select a product
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.selectedProduct && item.size && (
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              ₹{(item.selectedProduct.price * item.quantity).toLocaleString()}
                            </Typography>
                          )}
                          <IconButton size="small">
                            {expandedSections.items[index] ? <RemoveIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          {items.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(index);
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Item Form */}
                      <Collapse in={expandedSections.items[index]}>
                        <Box sx={{ p: 2, pt: 0, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                          <Stack spacing={2}>
                            {/* Product Search */}
                            {!item.selectedProduct ? (
                              <>
                                <TextField
                                  fullWidth
                                  placeholder="Search products..."
                                  value={item.productQuery}
                                  onChange={(e) => handleProductSearch(index, e.target.value)}
                                  inputRef={(el) => (productRefs.current[index] = el)}
                                  size="small"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                      </InputAdornment>
                                    ),
                                    endAdornment: item.loading && (
                                      <InputAdornment position="end">
                                        <LinearProgress sx={{ width: 20 }} />
                                      </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 }
                                  }}
                                />

                                {/* Product Results */}
                                {item.productResults.length > 0 && (
                                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', borderRadius: 2 }}>
                                    {item.productResults.map((product) => (
                                      <Box
                                        key={product._id}
                                        onClick={() => selectProduct(index, product)}
                                        sx={{
                                          p: 1.5,
                                          cursor: 'pointer',
                                          borderBottom: `1px solid ${theme.palette.divider}`,
                                          '&:last-child': { borderBottom: 'none' },
                                          '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                                          }
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                              {product.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                              <Chip
                                                label={product.team}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                              />
                                            </Box>
                                          </Box>
                                          <Typography variant="body2" fontWeight="bold" color="primary">
                                            ₹{product.price}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ))}
                                  </Paper>
                                )}
                              </>
                            ) : (
                              <>
                                {/* Selected Product Info */}
                                <Box
                                  sx={{
                                    p: 1.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    borderRadius: 2
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {item.selectedProduct.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Team: {item.selectedProduct.team}
                                      </Typography>
                                    </Box>
                                    <Button
                                      size="small"
                                      onClick={() => {
                                        updateItem(index, "selectedProduct", null);
                                        updateItem(index, "productQuery", "");
                                        setExpandedSections(prev => ({
                                          ...prev,
                                          items: { ...prev.items, [index]: true }
                                        }));
                                      }}
                                    >
                                      Change
                                    </Button>
                                  </Box>
                                </Box>

                                {/* Size Selection */}
                                <FormControl fullWidth size="small">
                                  <InputLabel>Select Size</InputLabel>
                                  <Select
                                    value={item.size}
                                    onChange={(e) => updateItem(index, "size", e.target.value)}
                                    label="Select Size"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {item.selectedProduct.sizes.map((sizeObj, i) => (
                                      <MenuItem key={i} value={sizeObj.size}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                          <span>Size {sizeObj.size}</span>
                                          <Typography variant="caption" color="text.secondary">
                                            Stock: {sizeObj.stock}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>

                                {/* Quantity */}
                                <TextField
                                  type="number"
                                  label="Quantity"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                                  size="small"
                                  fullWidth
                                  InputProps={{
                                    inputProps: { min: 1 },
                                    sx: { borderRadius: 2 }
                                  }}
                                />

                                {/* Done Button for Mobile */}
                                {isMobile && item.size && (
                                  <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => toggleSection('items', index)}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    Done
                                  </Button>
                                )}
                              </>
                            )}
                          </Stack>
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Right Column - Order Summary (Desktop/Tablet) */}
            {!isMobile && (
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    position: 'sticky',
                    top: 80,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ReceiptIcon color="primary" />
                    <Typography variant="h6">
                      Order Summary
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Customer Summary */}
                  {selectedCustomer && (
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Customer
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          {selectedCustomer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedCustomer.phone}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Items Summary */}
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Items ({totalItems})
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {items.map((item, index) => (
                        item.selectedProduct && item.size && (
                          <Box key={index} sx={{ py: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {item.selectedProduct.name}
                              </Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                <Chip
                                  label={`Size: ${item.size}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                <Chip
                                  label={`Qty: ${item.quantity}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              </Box>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              ₹{(item.selectedProduct.price * item.quantity).toLocaleString()}
                            </Typography>
                          </Box>
                        )
                      ))}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Total */}
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="body2">₹{orderTotal.toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">Shipping</Typography>
                      <Typography variant="body2" color="success.main">Free</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="h6" fontWeight="bold">Total</Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ₹{orderTotal.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Create Order Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<CartIcon />}
                    onClick={createOrder}
                    disabled={!canCreateOrder || submitting}
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' }
                    }}
                  >
                    {submitting ? "Creating Order..." : "Create Order"}
                  </Button>

                  {!canCreateOrder && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                      {!selectedCustomer
                        ? "Please select a customer to continue"
                        : "Please complete all items (product and size)"
                      }
                    </Alert>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Mobile Order Summary - Always Visible */}
      {isMobile && <MobileOrderSummary />}

      {/* Create Customer Dialog */}
      <Dialog
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Create New Customer</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Customer Name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              required
              autoFocus
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Instagram Handle (Optional)"
              value={newCustomer.instagram}
              onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
              InputProps={{
                sx: { borderRadius: 2 },
                startAdornment: (
                  <InputAdornment position="start">@</InputAdornment>
                )
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setCreateCustomerOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomer.name}
            sx={{
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={successDialog}
        onClose={() => setSuccessDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <CheckCircleIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Order Created!</Typography>
              <Typography variant="caption" color="text.secondary">
                Order #{createdOrder?._id?.slice(-8)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
            <Typography gutterBottom>
              Your order has been created successfully.
            </Typography>
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
              <Typography variant="h6" color="primary">
                ₹{createdOrder?.totalPrice?.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setSuccessDialog(false)} sx={{ borderRadius: 2 }}>
            Create Another
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialog(false);
              window.location.href = '/orders';
            }}
            sx={{
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            View Orders
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickOrder;