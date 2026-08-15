import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
  Skeleton,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  alpha
} from "@mui/material";
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Instagram as InstagramIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ShoppingBag as ShoppingBagIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon
} from "@mui/icons-material";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Customer, Order } from "../types";

interface EnrichedCustomer extends Customer {
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  orders?: Order[];
}

interface CustomerFormData {
  name: string;
  phone: string;
  address: string;
  instagramHandle: string;
  notes: string;
}

const CustomersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<EnrichedCustomer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    address: "",
    instagramHandle: "",
    notes: ""
  });

  // Selected Customer Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<EnrichedCustomer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      showSnackbar("Failed to fetch customers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const term = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.instagramHandle?.toLowerCase().includes(term) ||
        c.address?.toLowerCase().includes(term)
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeBuyers = customers.filter((c) => (c.totalOrders || 0) > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    return { totalCustomers, activeBuyers, totalRevenue };
  }, [customers]);

  const handleOpenDialog = (customer: EnrichedCustomer | null = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        instagramHandle: customer.instagramHandle || "",
        notes: customer.notes || ""
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", address: "", instagramHandle: "", notes: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.phone) {
      showSnackbar("Name and phone are required", "error");
      return;
    }

    try {
      if (editingCustomer) {
        await API.put(`/customers/${editingCustomer._id}`, formData);
        showSnackbar("Customer updated successfully", "success");
      } else {
        await API.post("/customers", formData);
        showSnackbar("Customer created successfully", "success");
      }
      handleCloseDialog();
      fetchCustomers();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || "Failed to save customer", "error");
    }
  };

  const handleDeleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      await API.delete(`/customers/${id}`);
      showSnackbar("Customer deleted successfully", "success");
      fetchCustomers();
    } catch (err) {
      showSnackbar("Failed to delete customer", "error");
    }
  };

  const handleCustomerClick = async (customer: EnrichedCustomer) => {
    try {
      const res = await API.get(`/customers/${customer._id}`);
      setSelectedCustomer(res.data);
      setDrawerOpen(true);
    } catch (err) {
      setSelectedCustomer(customer);
      setDrawerOpen(true);
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Customers CRM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your customer profiles, purchase metrics, and notes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? "small" : "medium"}
        >
          Add Customer
        </Button>
      </Box>

      {/* Overview Metric Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Customers</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.totalCustomers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Active Buyers</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.activeBuyers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Lifetime Value</Typography>
              <Typography variant="h4" fontWeight="bold">₹{stats.totalRevenue.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <TextField
          fullWidth
          placeholder="Search by name, phone, address, or Instagram handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Customers List / Table */}
      {loading ? (
        <Skeleton variant="rounded" height={300} />
      ) : filteredCustomers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No customers found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Instagram</TableCell>
                <TableCell align="center">Orders</TableCell>
                <TableCell align="right">Total Spent</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer._id}
                  hover
                  onClick={() => handleCustomerClick(customer)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography fontWeight="medium">{customer.name}</Typography>
                    {customer.address && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {customer.address}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PhoneIcon fontSize="small" color="action" />
                      {customer.phone}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {customer.instagramHandle ? (
                      <Chip
                        icon={<InstagramIcon fontSize="small" />}
                        label={`@${customer.instagramHandle.replace("@", "")}`}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={customer.totalOrders || 0} size="small" color="primary" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="success.main">
                      ₹{(customer.totalSpent || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(customer);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteCustomer(customer._id, e)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Customer Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Instagram Handle"
              value={formData.instagramHandle}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              fullWidth
              placeholder="e.g. username"
            />
            <TextField
              label="Delivery Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Customer Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. Prefers size L, frequent buyer"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCustomer} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Detail Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: 300, sm: 400 }, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Customer Details
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          {selectedCustomer && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold">{selectedCustomer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedCustomer.phone}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Total Spent</Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  ₹{(selectedCustomer.totalSpent || 0).toLocaleString()}
                </Typography>
              </Box>
              {selectedCustomer.notes && (
                <Box bgcolor={alpha(theme.palette.info.main, 0.1)} p={2} borderRadius={1}>
                  <Typography variant="caption" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                    <NotesIcon fontSize="small" /> Notes
                  </Typography>
                  <Typography variant="body2">{selectedCustomer.notes}</Typography>
                </Box>
              )}
              <Typography variant="subtitle2" fontWeight="bold" mt={2}>
                Order History ({selectedCustomer.orders?.length || 0})
              </Typography>
              <List dense disablePadding>
                {selectedCustomer.orders?.map((order) => (
                  <ListItem key={order._id} divider sx={{ px: 0 }}>
                    <ListItemText
                      primary={`Order Total: ₹${order.totalPrice}`}
                      secondary={`Status: ${order.status} | ${new Date(order.createdAt!).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomersPage;
