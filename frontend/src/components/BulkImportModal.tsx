import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import API from "../api/axios";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  templateEndpoint: string;
  importEndpoint: string;
  onSuccess: () => void;
}

interface ImportError {
  row: number;
  product?: string;
  customer?: string;
  name?: string;
  error: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: ImportError[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  open,
  onClose,
  title,
  templateEndpoint,
  importEndpoint,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [telegramNotice, setTelegramNotice] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg("");
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      setTelegramNotice("");
      setErrorMsg("");

      // Get Telegram WebApp user ID if available
      const tgChatId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const headers: Record<string, string> = {};
      if (tgChatId) {
        headers["x-telegram-chat-id"] = String(tgChatId);
      }

      const response = await API.get(templateEndpoint, {
        headers,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setTelegramNotice("📥 Excel template generated! Downloading in browser...");
    } catch (err: any) {
      console.error("Template download error:", err);
      let msg = "Failed to download template file";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.message || msg;
        } catch {
          // Keep default msg if not JSON
        }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Please select a file to import");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post(importEndpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(res.data);
      if (res.data.importedCount > 0 || res.data.updatedCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to process import file"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setErrorMsg("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Step 1: Download Template */}
        <Box mb={3} p={2} bgcolor="action.hover" borderRadius={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Step 1: Download Excel Template
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use our pre-formatted template with column headers and sample
                data.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                downloadingTemplate ? (
                  <CircularProgress size={16} />
                ) : (
                  <DownloadIcon />
                )
              }
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
            >
              Download Template
            </Button>
          </Box>
        </Box>

        {/* Step 2: Upload File */}
        <Box mb={2}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Step 2: Upload Completed File (.xlsx, .csv)
          </Typography>

          <Box
            border="2px dashed"
            borderColor={file ? "primary.main" : "divider"}
            borderRadius={2}
            p={3}
            textAlign="center"
            bgcolor={file ? "action.selected" : "background.paper"}
            sx={{ cursor: "pointer" }}
            component="label"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={handleFileChange}
            />
            <UploadIcon
              sx={{ fontSize: 40, color: file ? "primary.main" : "text.secondary", mb: 1 }}
            />
            <Typography variant="body1" fontWeight="medium">
              {file ? file.name : "Click or drag file here to upload"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : "Supports .xlsx, .xls, and .csv files up to 5MB"}
            </Typography>
          </Box>
        </Box>

        {telegramNotice && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {telegramNotice}
          </Alert>
        )}

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Results Summary */}
        {result && (
          <Box mt={3}>
            <Alert
              severity={result.skippedCount > 0 && result.importedCount === 0 && result.updatedCount === 0 ? "warning" : "success"}
              sx={{ mb: 2 }}
            >
              {result.message}
            </Alert>

            <Box display="flex" gap={2} mb={2}>
              <Chip
                icon={<CheckIcon />}
                label={`Created: ${result.importedCount}`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<CheckIcon />}
                label={`Updated: ${result.updatedCount}`}
                color="info"
                variant="outlined"
              />
              {result.skippedCount > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`Errors / Skipped: ${result.skippedCount}`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Error Detail Table */}
            {result.errors && result.errors.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>
                  Row Error Log ({result.errors.length} failed rows)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Row #</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Error Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>
                            {err.product || err.customer || err.name || "-"}
                          </TableCell>
                          <TableCell color="error">{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {result ? "Done" : "Cancel"}
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || loading}
          startIcon={loading ? <CircularProgress size={18} /> : <UploadIcon />}
        >
          {loading ? "Importing..." : "Start Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportModal;
