// components/ReportGenerator.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Stack,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Fade,
  Zoom,
  Container,
  alpha,
  useTheme,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  Step,
  StepLabel,
  Stepper,
  Fab,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Rocket as RocketIcon,
  Analytics as AnalyticsIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  CloudDownload as CloudDownloadIcon,
  FileDownload as FileDownloadIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  NavigateNext as NavigateNextIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
  Tune as TuneIcon,
  Summarize as SummarizeIcon,
} from "@mui/icons-material";
import API from "../api/axios";

const ReportGenerator = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [progress, setProgress] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeStep, setActiveStep] = useState(0);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleGenerateReport = async () => {
    setLoading(true);
    setProgress(0);
    setActiveStep(0);
    
    // Simulate progress with steps
    const steps = [
      { progress: 25, step: 0, message: "Fetching data..." },
      { progress: 50, step: 1, message: "Processing information..." },
      { progress: 75, step: 2, message: "Building spreadsheet..." },
      { progress: 90, step: 3, message: "Finalizing report..." },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].progress);
        setActiveStep(steps[stepIndex].step);
        stepIndex++;
      }
    }, 500);

    try {
      const params = reportType === "monthly" 
        ? { month, year }
        : { year };

      const response = await API.get(
        `/reports/${reportType}`,
        {
          params,
          responseType: "blob"
        }
      );

      clearInterval(progressInterval);
      setProgress(100);
      setActiveStep(4);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      const fileName = reportType === "monthly"
        ? `Monthly_Report_${months[month - 1]}_${year}.xlsx`
        : `Yearly_Report_${year}.xlsx`;
      
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Report generated and downloaded successfully! 🎉',
        severity: 'success'
      });

      setTimeout(() => {
        setProgress(0);
        setActiveStep(0);
      }, 2000);

    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      setActiveStep(0);
      console.error("Error generating report:", error);
      
      setSnackbar({
        open: true,
        message: 'Oops! Failed to generate report. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = () => {
    setSummaryOpen(true);
  };

  const getReportFileName = () => {
    if (reportType === "monthly") {
      return `Monthly_Report_${months[month - 1]}_${year}.xlsx`;
    }
    return `Yearly_Report_${year}.xlsx`;
  };

  const getReportIcon = () => {
    return reportType === "monthly" ? (
      <CalendarIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
    ) : (
      <TrendingUpIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      py: 4 
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Zoom in timeout={600}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                <AssessmentIcon sx={{ fontSize: 48 }} />
              </Avatar>
            </Zoom>
            
            <Typography 
              variant="h3" 
              fontWeight="700" 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Report Generator
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
              Generate comprehensive business reports with just a few clicks
            </Typography>
            
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
              <Chip 
                icon={<SpeedIcon />} 
                label="Fast Generation" 
                variant="outlined" 
                color="primary" 
              />
              <Chip 
                icon={<AutoAwesomeIcon />} 
                label="Professional Format" 
                variant="outlined" 
                color="secondary" 
              />
              <Chip 
                icon={<CloudDownloadIcon />} 
                label="Instant Download" 
                variant="outlined" 
                color="success" 
              />
            </Stack>
          </Box>
        </Fade>

        <Grid container spacing={3}>
          {/* Report Type Selection Cards */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={400}>
              <Card 
                sx={{ 
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: reportType === 'monthly' ? 3 : 2,
                  borderColor: reportType === 'monthly' ? 'primary.main' : 'transparent',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: reportType === 'monthly' 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                    : 'white',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                    borderColor: 'primary.main',
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': reportType === 'monthly' ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
                  } : {},
                }}
                onClick={() => setReportType('monthly')}
              >
                <CardContent sx={{ textAlign: 'center', py: 5, position: 'relative', zIndex: 1 }}>
                  <Zoom in={reportType === 'monthly'} timeout={300}>
                    <Box sx={{ display: 'inline-block', position: 'relative' }}>
                      <Badge
                        invisible={reportType !== 'monthly'}
                        badgeContent={
                          <CheckCircleIcon 
                            sx={{ 
                              color: 'primary.main', 
                              bgcolor: 'white',
                              borderRadius: '50%',
                              fontSize: 30
                            }} 
                          />
                        }
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                      >
                        <CalendarIcon 
                          sx={{ 
                            fontSize: 64, 
                            color: 'primary.main',
                            mb: 2,
                            filter: reportType === 'monthly' ? 'none' : 'grayscale(100%)',
                            transition: 'all 0.3s',
                          }} 
                        />
                      </Badge>
                    </Box>
                  </Zoom>
                  
                  <Typography variant="h5" gutterBottom fontWeight="700" color="primary">
                    Monthly Report
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Detailed monthly analysis including sales, orders, products, and customer insights
                  </Typography>
                  
                  {reportType === 'monthly' && (
                    <Chip 
                      label="Active" 
                      color="primary" 
                      size="small"
                      icon={<CheckCircleIcon />}
                      sx={{ 
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)' },
                          '70%': { boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' },
                        },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid item xs={12} md={6}>
            <Zoom in timeout={600}>
              <Card 
                sx={{ 
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: reportType === 'yearly' ? 3 : 2,
                  borderColor: reportType === 'yearly' ? 'secondary.main' : 'transparent',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: reportType === 'yearly' 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                    : 'white',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    borderColor: 'secondary.main',
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': reportType === 'yearly' ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 70%)`,
                  } : {},
                }}
                onClick={() => setReportType('yearly')}
              >
                <CardContent sx={{ textAlign: 'center', py: 5, position: 'relative', zIndex: 1 }}>
                  <Zoom in={reportType === 'yearly'} timeout={300}>
                    <Box sx={{ display: 'inline-block', position: 'relative' }}>
                      <Badge
                        invisible={reportType !== 'yearly'}
                        badgeContent={
                          <CheckCircleIcon 
                            sx={{ 
                              color: 'secondary.main', 
                              bgcolor: 'white',
                              borderRadius: '50%',
                              fontSize: 30
                            }} 
                          />
                        }
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                      >
                        <TrendingUpIcon 
                          sx={{ 
                            fontSize: 64, 
                            color: 'secondary.main',
                            mb: 2,
                            filter: reportType === 'yearly' ? 'none' : 'grayscale(100%)',
                            transition: 'all 0.3s',
                          }} 
                        />
                      </Badge>
                    </Box>
                  </Zoom>
                  
                  <Typography variant="h5" gutterBottom fontWeight="700" color="secondary">
                    Yearly Report
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Year-over-year comparison with monthly breakdowns and trend analysis
                  </Typography>
                  
                  {reportType === 'yearly' && (
                    <Chip 
                      label="Active" 
                      color="secondary" 
                      size="small"
                      icon={<CheckCircleIcon />}
                      sx={{ 
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.4)' },
                          '70%': { boxShadow: '0 0 0 10px rgba(156, 39, 176, 0)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0)' },
                        },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Report Configuration */}
          <Grid item xs={12}>
            <Zoom in timeout={800}>
              <Paper 
                sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  background: `linear-gradient(135deg, white 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                  <TuneIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">
                    Configure Your Report
                  </Typography>
                </Stack>
                
                <Grid container spacing={3} alignItems="center">
                  {reportType === 'monthly' && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarIcon fontSize="small" />
                            <span>Select Month</span>
                          </Stack>
                        </InputLabel>
                        <Select
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          label="Select Month"
                          sx={{ borderRadius: 2 }}
                        >
                          {months.map((monthName, index) => (
                            <MenuItem key={index} value={index + 1}>
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                                <Typography variant="body1">{monthName}</Typography>
                                {month === index + 1 && (
                                  <CheckIcon color="primary" fontSize="small" />
                                )}
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={reportType === 'monthly' ? 6 : 6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarIcon fontSize="small" />
                          <span>Select Year</span>
                        </Stack>
                      </InputLabel>
                      <Select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        label="Select Year"
                        sx={{ borderRadius: 2 }}
                      >
                        {years.map((yr) => (
                          <MenuItem key={yr} value={yr}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                              <Typography variant="body1">{yr}</Typography>
                              {year === yr && (
                                <CheckIcon color="primary" fontSize="small" />
                              )}
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={reportType === 'monthly' ? 12 : 6}>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RocketIcon />}
                        onClick={handleGenerateReport}
                        disabled={loading}
                        fullWidth
                        sx={{ 
                          py: 1.8,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                        }}
                      >
                        {loading ? 'Generating...' : 'Generate Report'}
                      </Button>
                      
                      <Tooltip title="See what's included in the report" arrow>
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<SummarizeIcon />}
                          onClick={handleViewSummary}
                          disabled={loading}
                          sx={{ 
                            py: 1.8,
                            borderRadius: 3,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                            }
                          }}
                        >
                          Preview
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>

                {/* Progress Section */}
                {(loading || progress === 100) && (
                  <Fade in timeout={300}>
                    <Box sx={{ mt: 4 }}>
                      <Stepper activeStep={activeStep} alternativeLabel>
                        {['Fetching Data', 'Processing', 'Building', 'Finalizing', 'Complete'].map((label) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                      
                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                          {loading && <CircularProgress size={24} />}
                          {progress === 100 && <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />}
                          <Typography variant="body1" fontWeight="500" color={progress === 100 ? 'success.main' : 'text.secondary'}>
                            {loading ? `Generating your report... ${progress}%` : 'Report ready!'}
                          </Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Success Message */}
                {progress === 100 && !loading && (
                  <Fade in timeout={500}>
                    <Alert 
                      severity="success" 
                      variant="filled"
                      sx={{ 
                        mt: 3, 
                        borderRadius: 3,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.3)}`,
                      }}
                      icon={<FileDownloadIcon />}
                    >
                      <Typography variant="body1" fontWeight="500">
                        Report downloaded successfully!
                      </Typography>
                      <Typography variant="body2">
                        File: {getReportFileName()}
                      </Typography>
                    </Alert>
                  </Fade>
                )}
              </Paper>
            </Zoom>
          </Grid>

          {/* Report Features */}
          <Grid item xs={12}>
            <Zoom in timeout={1000}>
              <Paper 
                sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  background: 'white',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                  <InsightsIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">
                    What's Inside Your {reportType === 'monthly' ? 'Monthly' : 'Yearly'} Report
                  </Typography>
                </Stack>
                
                <Grid container spacing={2}>
                  {reportType === 'monthly' ? (
                    <>
                      {[
                        { icon: <BarChartIcon />, color: 'primary', title: 'Sales Summary', desc: 'Revenue, costs, profits overview' },
                        { icon: <TableChartIcon />, color: 'info', title: 'Detailed Orders', desc: 'Complete order history with customer details' },
                        { icon: <PieChartIcon />, color: 'success', title: 'Product Analysis', desc: 'Sales breakdown by product and size' },
                        { icon: <TimelineIcon />, color: 'warning', title: 'Daily Breakdown', desc: 'Day-by-day sales analysis' },
                      ].map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                          <Zoom in timeout={1200 + index * 100}>
                            <Card 
                              sx={{ 
                                borderRadius: 3,
                                border: 1,
                                borderColor: 'divider',
                                transition: 'all 0.3s',
                                height: '100%',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 8px 24px ${alpha(theme.palette[feature.color].main, 0.15)}`,
                                  borderColor: `${feature.color}.main`,
                                }
                              }}
                              variant="outlined"
                            >
                              <CardContent>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: alpha(theme.palette[feature.color].main, 0.1),
                                    color: `${feature.color}.main`,
                                    mb: 2,
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {feature.icon}
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                  {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {feature.desc}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Zoom>
                        </Grid>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { icon: <BarChartIcon />, color: 'secondary', title: 'Monthly Comparison', desc: '12-month performance tracking' },
                        { icon: <TimelineIcon />, color: 'info', title: 'Trend Analysis', desc: 'Revenue and growth patterns' },
                        { icon: <PieChartIcon />, color: 'success', title: 'Annual Totals', desc: 'Year-end summary statistics' },
                      ].map((feature, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Zoom in timeout={1200 + index * 100}>
                            <Card 
                              sx={{ 
                                borderRadius: 3,
                                border: 1,
                                borderColor: 'divider',
                                transition: 'all 0.3s',
                                height: '100%',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 8px 24px ${alpha(theme.palette[feature.color].main, 0.15)}`,
                                  borderColor: `${feature.color}.main`,
                                }
                              }}
                              variant="outlined"
                            >
                              <CardContent>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: alpha(theme.palette[feature.color].main, 0.1),
                                    color: `${feature.color}.main`,
                                    mb: 2,
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {feature.icon}
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                  {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {feature.desc}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Zoom>
                        </Grid>
                      ))}
                    </>
                  )}
                </Grid>
              </Paper>
            </Zoom>
          </Grid>
        </Grid>
      </Container>

      {/* Report Summary Dialog */}
      <Dialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            px: 3,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <AssessmentIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight="600">Report Preview</Typography>
              <Typography variant="caption" color="text.secondary">
                {reportType === 'monthly' 
                  ? `${months[month - 1]} ${year}`
                  : `${year} Annual Report`
                }
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setSummaryOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Alert 
              severity="info" 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                borderWidth: 2,
              }}
              icon={<RocketIcon />}
            >
              Here's a preview of what will be included in your report
            </Alert>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="600">
                📊 {reportType === 'monthly' 
                  ? `${months[month - 1]} ${year} Detailed Report`
                  : `${year} Annual Business Report`
                }
              </Typography>
              
              <List>
                {reportType === 'monthly' ? (
                  <>
                    {[
                      { primary: 'Sales Summary', secondary: 'Total revenue, costs, profit margins, and key metrics' },
                      { primary: 'Detailed Orders', secondary: 'Complete list of all orders with customer information' },
                      { primary: 'Product Performance', secondary: 'Sales breakdown by product, size, and current stock levels' },
                      { primary: 'Daily Breakdown', secondary: 'Day-by-day sales analysis with order counts' },
                    ].map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={item.primary} secondary={item.secondary} />
                      </ListItem>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { primary: 'Monthly Breakdown', secondary: 'Performance data for all 12 months' },
                      { primary: 'Comparative Analysis', secondary: 'Month-over-month growth and trend identification' },
                      { primary: 'Annual Totals', secondary: 'Yearly revenue, costs, profits, and product sales' },
                    ].map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={item.primary} secondary={item.secondary} />
                      </ListItem>
                    ))}
                  </>
                )}
              </List>
            </Paper>

            <Alert 
              severity="success" 
              variant="filled"
              sx={{ borderRadius: 3 }}
              icon={<DescriptionIcon />}
            >
              <Typography variant="body2" fontWeight="500">
                Reports include multiple sheets with professional formatting, auto-filters, and color-coded data for easy analysis.
              </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="600">
                📁 File Information
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  • Format: Microsoft Excel (.xlsx)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • File name: {getReportFileName()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Multiple formatted sheets with auto-filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Professional styling with headers and alternating rows
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSummaryOpen(false)} color="inherit">
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              setSummaryOpen(false);
              handleGenerateReport();
            }}
            startIcon={<RocketIcon />}
            sx={{ 
              borderRadius: 3,
              px: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            Generate Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            borderRadius: 3,
            boxShadow: `0 8px 16px ${alpha(theme.palette[snackbar.severity].main, 0.3)}`,
          }}
          icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for quick download */}
      {progress === 100 && !loading && (
        <Zoom in>
          <Tooltip title="Download again" arrow>
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
              onClick={() => {
                // Trigger download again
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(new Blob([]));
                link.click();
              }}
            >
              <CloudDownloadIcon />
            </Fab>
          </Tooltip>
        </Zoom>
      )}
    </Box>
  );
};

export default ReportGenerator;