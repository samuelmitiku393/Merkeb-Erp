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
  Select,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
  Container
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
  ShoppingBag as ShoppingBagIcon,
  LocationOn as LocationIcon
} from "@mui/icons-material";
import API from "../api/axios";

const QuickOrder = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Customer State
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ 
    name: "", 
    phone: "", 
    address: "", 
    instagram: "" 
  });

  // Items State
  const [items, setItems] = useState([
    { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false }
  ]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const searchTimeout = useRef(null);
  const productInputRefs = useRef([]);

  // Calculate total
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
  const handleCustomerSearch = (query) => {
    setCustomerQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim() || query.length < 2) {
      setCustomerResults([]);
      return;
    }

    setCustomerLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await API.get(`/customers/search?q=${query}`);
        setCustomerResults(res.data);
      } catch (error) {
        console.error("Error searching customers:", error);
      } finally {
        setCustomerLoading(false);
      }
    }, 300);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery("");
    setCustomerResults([]);
    setTimeout(() => {
      productInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleCreateCustomer = async () => {
    try {
      const res = await API.post("/customers", {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        instagramHandle: newCustomer.instagram || newCustomer.name
      });
      selectCustomer(res.data);
      setCreateCustomerOpen(false);
      setNewCustomer({ name: "", phone: "", address: "", instagram: "" });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    }
  };

  // Product Search
  const handleProductSearch = (index, query) => {
    const newItems = [...items];
    newItems[index].productQuery = query;
    setItems(newItems);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim() || query.length < 2) {
      newItems[index].productResults = [];
      newItems[index].loading = false;
      setItems([...newItems]);
      return;
    }

    newItems[index].loading = true;
    setItems([...newItems]);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await API.get(`/products/search?q=${query}`);
        const updatedItems = [...items];
        updatedItems[index].productResults = res.data;
        updatedItems[index].loading = false;
        setItems(updatedItems);
      } catch (error) {
        console.error("Error searching products:", error);
        const updatedItems = [...items];
        updatedItems[index].loading = false;
        setItems(updatedItems);
      }
    }, 300);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index].selectedProduct = product;
    newItems[index].productQuery = "";
    newItems[index].productResults = [];
    newItems[index].size = "";
    newItems[index].quantity = 1;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false }
    ]);
    setTimeout(() => {
      productInputRefs.current[items.length]?.focus();
    }, 100);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
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
      setItems([
        { productQuery: "", productResults: [], selectedProduct: null, size: "", quantity: 1, loading: false }
      ]);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = items.filter(item => item.selectedProduct && item.size).length;
  const canCreateOrder = selectedCustomer && items.every(item => item.selectedProduct && item.size);

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Mobile-Optimized Header */}
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Toolbar sx={{ px: 2 }}>
            <ShoppingBagIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Quick Order
            </Typography>
            {totalItems > 0 && (
              <Chip
                label={`${totalItems} • $${orderTotal}`}
                color="primary"
                size="small"
                sx={{ height: 28 }}
              />
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content - Full Width on Mobile */}
      <Container
        maxWidth="sm"
        disableGutters={isMobile}
        sx={{
          flex: 1,
          px: isMobile ? 0 : 2,
          py: isMobile ? 0 : 2
        }}
      >
        <Stack spacing={isMobile ? 0 : 2}>
          {/* Customer Section */}
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: isMobile ? 0 : 2,
              borderBottom: isMobile ? '1px solid #e0e0e0' : 'none'
            }}
            elevation={isMobile ? 0 : 1}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              <PersonIcon color="primary" fontSize={isMobile ? 'small' : 'medium'} />
              Customer Information
            </Typography>

            {selectedCustomer ? (
              <Box sx={{
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                borderRadius: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedCustomer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCustomer.phone}
                  </Typography>
                  {selectedCustomer.address && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedCustomer.address}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Button
                  size="small"
                  onClick={() => setSelectedCustomer(null)}
                  startIcon={<CloseIcon />}
                >
                  Change
                </Button>
              </Box>
            ) : (
              <>
                <TextField
                  fullWidth
                  placeholder="Search customer by name, phone, or address..."
                  value={customerQuery}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  autoFocus
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" fontSize={isMobile ? 'small' : 'medium'} />
                      </InputAdornment>
                    ),
                    endAdornment: customerLoading && (
                      <InputAdornment position="end">
                        <LinearProgress sx={{ width: 20 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                />

                {/* Search Results */}
                {customerResults.length > 0 && (
                  <Paper variant="outlined" sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
                    {customerResults.map((customer) => (
                      <Box
                        key={customer._id}
                        onClick={() => selectCustomer(customer)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          borderBottom: '1px solid #e0e0e0',
                          '&:last-child': { borderBottom: 'none' },
                          '&:hover': { bgcolor: '#f5f5f5' },
                          '&:active': { bgcolor: '#eeeeee' }
                        }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.phone}
                        </Typography>
                        {customer.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {customer.address}
                            </Typography>
                          </Box>
                        )}
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
                    size={isMobile ? "medium" : "large"}
                  >
                    Create New Customer "{customerQuery}"
                  </Button>
                )}
              </>
            )}
          </Paper>

          {/* Items Section */}
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: isMobile ? 0 : 2,
              borderBottom: isMobile ? '1px solid #e0e0e0' : 'none'
            }}
            elevation={isMobile ? 0 : 1}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: isMobile ? '1rem' : '1.25rem'
                }}
              >
                <ShoppingBagIcon color="primary" fontSize={isMobile ? 'small' : 'medium'} />
                Order Items
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addItem}
                size="small"
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                {isMobile ? 'Add' : 'Add Item'}
              </Button>
            </Box>

            <Stack spacing={2}>
              {items.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: '#fafafa',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  {/* Product Selection */}
                  {!item.selectedProduct ? (
                    <>
                      <TextField
                        fullWidth
                        placeholder="Search product by name..."
                        value={item.productQuery}
                        onChange={(e) => handleProductSearch(index, e.target.value)}
                        inputRef={(el) => (productInputRefs.current[index] = el)}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: item.loading && (
                            <InputAdornment position="end">
                              <LinearProgress sx={{ width: 20 }} />
                            </InputAdornment>
                          )
                        }}
                      />

                      {item.productResults.length > 0 && (
                        <Paper
                          variant="outlined"
                          sx={{
                            mt: 1,
                            maxHeight: 250,
                            overflow: 'auto'
                          }}
                        >
                          {item.productResults.map((product) => (
                            <Box
                              key={product._id}
                              onClick={() => selectProduct(index, product)}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                borderBottom: '1px solid #e0e0e0',
                                '&:last-child': { borderBottom: 'none' },
                                '&:hover': { bgcolor: '#f5f5f5' },
                                '&:active': { bgcolor: '#eeeeee' },
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.team}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color="primary"
                                sx={{ ml: 1 }}
                              >
                                ${product.price}
                              </Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Selected Product Display */}
                      <Box sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: isMobile ? 'wrap' : 'nowrap'
                      }}>
                        <Box sx={{ flex: 1, mb: isMobile ? 1 : 0 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {item.selectedProduct.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {item.selectedProduct.team} • ${item.selectedProduct.price}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => updateItem(index, "selectedProduct", null)}
                            variant="outlined"
                          >
                            Change
                          </Button>
                          {items.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => removeItem(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Size and Quantity */}
                      <Stack
                        direction={isMobile ? 'column' : 'row'}
                        spacing={2}
                      >
                        <FormControl size="small" fullWidth={isMobile}>
                          <InputLabel>Size</InputLabel>
                          <Select
                            value={item.size}
                            onChange={(e) => updateItem(index, "size", e.target.value)}
                            label="Size"
                          >
                            {item.selectedProduct.sizes.map((sizeObj, i) => (
                              <MenuItem key={i} value={sizeObj.size}>
                                Size {sizeObj.size} ({sizeObj.stock} in stock)
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          type="number"
                          label="Quantity"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          size="small"
                          fullWidth={isMobile}
                          sx={{ minWidth: isMobile ? '100%' : 100 }}
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                      </Stack>
                    </>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Order Summary */}
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: isMobile ? 0 : 2,
              bgcolor: '#fafafa'
            }}
            elevation={isMobile ? 0 : 1}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              <ReceiptIcon color="primary" fontSize={isMobile ? 'small' : 'medium'} />
              Order Summary
            </Typography>

            {/* Customer Info in Summary */}
            {selectedCustomer && (
              <Box sx={{ 
                p: 1.5, 
                bgcolor: alpha(theme.palette.primary.main, 0.05), 
                borderRadius: 1,
                mb: 2 
              }}>
                <Typography variant="body2" fontWeight="medium">
                  Customer: {selectedCustomer.name}
                </Typography>
                {selectedCustomer.address && (
                  <Typography variant="caption" color="text.secondary">
                    Delivery to: {selectedCustomer.address}
                  </Typography>
                )}
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Items List */}
            <Box sx={{ maxHeight: isMobile ? 'none' : 300, overflow: 'auto' }}>
              {items.map((item, index) => (
                item.selectedProduct && item.size && (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: index < totalItems - 1 ? '1px solid #e0e0e0' : 'none'
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {item.selectedProduct.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Size: {item.size} × {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium" sx={{ ml: 2 }}>
                      ${(item.selectedProduct.price * item.quantity).toLocaleString()}
                    </Typography>
                  </Box>
                )
              ))}
            </Box>

            {totalItems === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No items added yet
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Total */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                Total
              </Typography>
              <Typography
                variant="h5"
                color="primary"
                fontWeight="bold"
                sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem' }}
              >
                ${orderTotal.toLocaleString()}
              </Typography>
            </Box>

            {/* Action Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<CartIcon />}
              onClick={createOrder}
              disabled={!canCreateOrder || submitting}
              sx={{
                py: 1.5,
                fontSize: isMobile ? '1rem' : '1.1rem'
              }}
            >
              {submitting ? "Creating Order..." : "Place Order"}
            </Button>

            {!canCreateOrder && (
              <Alert severity="info" sx={{ mt: 2, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                {!selectedCustomer
                  ? "Please select a customer"
                  : "Please complete all items with size selection"}
              </Alert>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Create Customer Dialog - Mobile Optimized with Address Field */}
      <Dialog
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Create New Customer
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
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              fullWidth
              label="Address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              size={isMobile ? "small" : "medium"}
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="action" />
                  </InputAdornment>
                )
              }}
              placeholder="Enter delivery address"
            />
            <TextField
              fullWidth
              label="Instagram Handle (Optional)"
              value={newCustomer.instagram}
              onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: <InputAdornment position="start">@</InputAdornment>
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setCreateCustomerOpen(false)}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomer.name}
            fullWidth={isMobile}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog - Mobile Optimized */}
      <Dialog
        open={successDialog}
        onClose={() => setSuccessDialog(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Order Created Successfully!
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Order #{createdOrder?._id?.slice(-8)} has been created.
          </Typography>
          {selectedCustomer && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Customer: {selectedCustomer.name}
              </Typography>
              {selectedCustomer.address && (
                <Typography variant="body2" color="text.secondary">
                  Delivery to: {selectedCustomer.address}
                </Typography>
              )}
            </Box>
          )}
          <Typography variant="h6" color="primary">
            Total: ${createdOrder?.totalPrice?.toLocaleString()}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
          <Button
            onClick={() => setSuccessDialog(false)}
            fullWidth={isMobile}
            variant={isMobile ? "outlined" : "text"}
          >
            Create Another Order
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialog(false);
              window.location.href = '/orders';
            }}
            fullWidth={isMobile}
          >
            View All Orders
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickOrder;