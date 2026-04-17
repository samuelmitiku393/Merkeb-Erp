import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Card,
  CardContent,
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
  Slide,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  SwipeableDrawer
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  LocalOffer as PriceIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingBag as ShoppingBagIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  LocalMall as LocalMallIcon
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
    { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false, expanded: true }
  ]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [summaryExpanded, setSummaryExpanded] = useState(!isMobile);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const productRefs = useRef([]);
  const customerInputRef = useRef(null);

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
    newItems[index].expanded = true;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false, expanded: true }
    ]);
    setTimeout(() => {
      productRefs.current[items.length]?.focus();
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

  const toggleItemExpanded = (index) => {
    const newItems = [...items];
    newItems[index].expanded = !newItems[index].expanded;
    setItems(newItems);
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
        { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false, expanded: true }
      ]);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateOrder = selectedCustomer && items.every(item => item.selectedProduct && item.size);
  const totalItems = items.filter(item => item.selectedProduct && item.size).length;

  // Mobile Summary Drawer
  const MobileSummaryDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={mobileSummaryOpen}
      onClose={() => setMobileSummaryOpen(false)}
      onOpen={() => setMobileSummaryOpen(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80vh',
          pb: 8 // Space for bottom navigation
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Order Summary
          </Typography>
          <IconButton onClick={() => setMobileSummaryOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box mb={3}>
          {items.map((item, index) => (
            item.selectedProduct && item.size && (
              <Box key={index} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body1" fontWeight="medium">
                      {item.selectedProduct.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Chip
                        label={`Size: ${item.size}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                      <Chip
                        label={`Qty: ${item.quantity}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ₹{(item.selectedProduct.price * item.quantity).toLocaleString()}
                  </Typography>
                </Box>
                {index < items.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            )
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body1" color="text.secondary">Subtotal</Typography>
            <Typography variant="body1">₹{orderTotal.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body1" color="text.secondary">Shipping</Typography>
            <Typography variant="body1" color="success.main">Free</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Total</Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              ₹{orderTotal.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<CartIcon />}
          onClick={() => {
            setMobileSummaryOpen(false);
            createOrder();
          }}
          disabled={!canCreateOrder || submitting}
          sx={{
            py: 1.5,
            borderRadius: 3,
            fontSize: '1.1rem'
          }}
        >
          {submitting ? "Creating Order..." : `Place Order • ₹${orderTotal.toLocaleString()}`}
        </Button>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      pb: { xs: 8, sm: 3 } // Padding for bottom navigation on mobile
    }}>
      {/* Header */}
      <Box sx={{
        mb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'background.default',
        pt: 2,
        pb: 1
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          {isMobile && (
            <IconButton>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box flex={1}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Quick Order
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new order quickly with customer and product search
            </Typography>
          </Box>
          {isMobile && totalItems > 0 && (
            <Badge badgeContent={totalItems} color="primary">
              <IconButton
                onClick={() => setMobileSummaryOpen(true)}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <ShoppingBagIcon />
              </IconButton>
            </Badge>
          )}
        </Box>
      </Box>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Left Column - Customer & Items */}
        <Grid item xs={12} md={8}>
          {/* Customer Selection */}
          <Slide direction="down" in={true} mountOnEnter unmountOnExit>
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? 2 : 3,
                mb: isMobile ? 2 : 3,
                borderRadius: isMobile ? 2 : 3,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" fontSize={isMobile ? '1.1rem' : '1.25rem'}>
                    Customer Information
                  </Typography>
                </Box>
                {!selectedCustomer && showCustomerSearch && (
                  <Chip label="Required" size="small" color="error" variant="outlined" />
                )}
              </Box>

              {!selectedCustomer ? (
                <>
                  {showCustomerSearch ? (
                    <>
                      <TextField
                        fullWidth
                        placeholder="Search customer by name or phone..."
                        value={customerQuery}
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        inputRef={customerInputRef}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="action" />
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
                        sx={{ mb: 2 }}
                        autoFocus
                      />

                      {/* Search Results */}
                      <Fade in={customerResults.length > 0}>
                        <Paper
                          variant="outlined"
                          sx={{
                            mb: 2,
                            maxHeight: 280,
                            overflow: 'auto',
                            borderRadius: 2
                          }}
                        >
                          {customerResults.map((customer) => (
                            <Box
                              key={customer._id}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  transform: 'translateX(4px)'
                                }
                              }}
                              onClick={() => selectCustomer(customer)}
                            >
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                  {customer.name.charAt(0)}
                                </Avatar>
                                <Box flex={1}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {customer.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {customer.phone} {customer.instagramHandle && `• @${customer.instagramHandle}`}
                                  </Typography>
                                </Box>
                                <KeyboardArrowDownIcon color="action" />
                              </Box>
                            </Box>
                          ))}
                        </Paper>
                      </Fade>

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
                            py: 1.5,
                            borderRadius: 2,
                            borderStyle: 'dashed'
                          }}
                        >
                          Create New Customer "{customerQuery}"
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => setShowCustomerSearch(true)}
                      fullWidth
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      Search for Customer
                    </Button>
                  )}
                </>
              ) : (
                <Zoom in={true}>
                  <Card
                    variant="outlined"
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.03),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                            <CheckCircleIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {selectedCustomer.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedCustomer.phone} {selectedCustomer.instagramHandle && `• @${selectedCustomer.instagramHandle}`}
                            </Typography>
                          </Box>
                        </Box>
                        <Tooltip title="Change Customer">
                          <IconButton
                            onClick={() => {
                              setSelectedCustomer(null);
                              setCustomerQuery("");
                              setShowCustomerSearch(true);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              )}
            </Paper>
          </Slide>

          {/* Order Items */}
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: isMobile ? 2 : 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                  <LocalMallIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6" fontSize={isMobile ? '1.1rem' : '1.25rem'}>
                  Order Items
                </Typography>
                <Chip
                  label={`${totalItems} item${totalItems !== 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                />
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addItem}
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                Add Item
              </Button>
            </Box>

            <Stack spacing={2}>
              {items.map((item, index) => (
                <Zoom in={true} key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={item.expanded ? 2 : 0}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Item {index + 1}
                          </Typography>
                          {item.selectedProduct && (
                            <Chip
                              label={item.selectedProduct.team}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {item.selectedProduct && (
                            <IconButton
                              size="small"
                              onClick={() => toggleItemExpanded(index)}
                            >
                              {item.expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          )}
                          {items.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(index)}
                              sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.05),
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {item.expanded && (
                        <Grid container spacing={2}>
                          {/* Product Search */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              placeholder="Search product by name or team..."
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
                                endAdornment: item.loading ? (
                                  <InputAdornment position="end">
                                    <LinearProgress sx={{ width: 20 }} />
                                  </InputAdornment>
                                ) : item.productQuery && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      size="small"
                                      onClick={() => updateItem(index, "productQuery", "")}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                              }}
                            />

                            {/* Product Results */}
                            <Fade in={item.productResults.length > 0}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  mt: 1,
                                  maxHeight: 240,
                                  overflow: 'auto',
                                  borderRadius: 2
                                }}
                              >
                                {item.productResults.map((product) => (
                                  <Box
                                    key={product._id}
                                    sx={{
                                      p: 2,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      borderBottom: `1px solid ${theme.palette.divider}`,
                                      '&:last-child': { borderBottom: 'none' },
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                        transform: 'translateX(4px)'
                                      }
                                    }}
                                    onClick={() => selectProduct(index, product)}
                                  >
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                      <Box flex={1}>
                                        <Typography variant="body2" fontWeight="medium">
                                          {product.name}
                                        </Typography>
                                        <Box display="flex" gap={1} mt={0.5}>
                                          <Chip
                                            label={product.team}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                          />
                                          <Chip
                                            label="In Stock"
                                            size="small"
                                            color="success"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                          />
                                        </Box>
                                      </Box>
                                      <Typography variant="h6" color="primary" fontSize="1rem">
                                        ₹{product.price}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Paper>
                            </Fade>
                          </Grid>

                          {/* Selected Product Info */}
                          {item.selectedProduct && (
                            <>
                              <Grid item xs={12}>
                                <Box
                                  sx={{
                                    p: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                  }}
                                >
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                      <Typography variant="body1" fontWeight="medium">
                                        {item.selectedProduct.name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Team: {item.selectedProduct.team}
                                      </Typography>
                                    </Box>
                                    <Typography variant="h6" color="primary">
                                      ₹{item.selectedProduct.price}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>

                              {/* Size and Quantity Selection */}
                              <Grid item xs={6}>
                                <TextField
                                  select
                                  fullWidth
                                  label="Size"
                                  value={item.size}
                                  onChange={(e) => updateItem(index, "size", e.target.value)}
                                  size="small"
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                >
                                  {item.selectedProduct.sizes.map((sizeObj, i) => (
                                    <MenuItem key={i} value={sizeObj.size}>
                                      <Box display="flex" justifyContent="space-between" width="100%">
                                        <span>{sizeObj.size}</span>
                                        <Typography variant="caption" color="text.secondary">
                                          Stock: {sizeObj.stock}
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>

                              <Grid item xs={6}>
                                <TextField
                                  type="number"
                                  fullWidth
                                  label="Quantity"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                                  size="small"
                                  InputProps={{
                                    inputProps: { min: 1 },
                                    sx: { borderRadius: 2 }
                                  }}
                                />
                              </Grid>

                              {/* Item Total */}
                              {item.size && (
                                <Grid item xs={12}>
                                  <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    sx={{
                                      p: 1.5,
                                      bgcolor: alpha(theme.palette.success.main, 0.05),
                                      borderRadius: 2
                                    }}
                                  >
                                    <Typography variant="body2" color="text.secondary" mr={2}>
                                      Item Total:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" color="success.main">
                                      ₹{(item.selectedProduct.price * item.quantity).toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </>
                          )}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Zoom>
              ))}
            </Stack>
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
                <Box sx={{ maxHeight: 300, overflow: 'auto', pr: 1 }}>
                  {items.map((item, index) => (
                    item.selectedProduct && item.size && (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
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

              {/* Quick Tips */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  💡 Tip: You can add multiple items and select different sizes for each product.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Mobile Bottom Bar */}
      {isMobile && canCreateOrder && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 56, // Height of bottom navigation
            left: 0,
            right: 0,
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            zIndex: 1000
          }}
          elevation={3}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
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
              onClick={() => setMobileSummaryOpen(true)}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                boxShadow: 'none'
              }}
            >
              Review Order
            </Button>
          </Box>
        </Paper>
      )}

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

      {/* Mobile Summary Drawer */}
      {isMobile && <MobileSummaryDrawer />}
    </Box>
  );
};

export default QuickOrder;