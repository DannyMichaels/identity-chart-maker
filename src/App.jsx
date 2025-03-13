import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import IconButton from '@mui/material/IconButton';

import NodeEditor from './components/NodeEditor';
import ChartCanvas from './components/ChartCanvas';
import ColorPicker from './components/ColorPicker';
import Gallery from './components/Gallery';
import { useChartStore } from './store/chartStore';

const NODE_COLORS = [
  '#4a86e8', // Blue
  '#0f9d58', // Green
  '#db4437', // Red
  '#f4b400', // Yellow
  '#9e5fff', // Purple
  '#00acc1', // Cyan
  '#e8546a', // Pink
  '#ff9800', // Orange
  '#795548', // Brown
  '#607d8b', // Gray Blue
  '#4caf50', // Light Green
  '#9c27b0', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Light Blue
  '#009688', // Teal
  '#8bc34a', // Lime
  '#cddc39', // Yellow Green
  '#ffeb3b', // Light Yellow
  '#ffc107', // Amber
  '#ff5722', // Deep Orange
];

// Function to get a random color from our palette
const getRandomColor = () => {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#4a86e8',
    },
    secondary: {
      main: '#e8546a',
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
      marginBottom: '1rem',
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

const ControlPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const Footer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
  marginTop: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const SignatureText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Pacifico", cursive',
  color: theme.palette.secondary.main,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

const App = () => {
  const canvasRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [newChartDialog, setNewChartDialog] = useState(false);
  const [newChartTitle, setNewChartTitle] = useState('');

  const {
    savedCharts,
    saveChart,
    currentChart,
    updateChart,
    clearCurrentChart,
    addNode,
    currentTab,
    setCurrentTab,
    nodes,
    connections,
  } = useChartStore();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const downloadChart = () => {
    if (!canvasRef.current) {
      showNotification('Error: Could not find canvas element', 'error');
      return;
    }

    // Get the current SVG element for reference
    const svg = canvasRef.current.querySelector('svg');
    if (!svg) {
      showNotification('Error: Could not find SVG element', 'error');
      return;
    }

    // Calculate the actual bounds needed for all nodes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Loop through all nodes to find the boundaries
    nodes.forEach((node) => {
      // Consider node radius when calculating boundaries
      minX = Math.min(minX, node.x - node.radius * 1.5);
      minY = Math.min(minY, node.y - node.radius * 1.5);
      maxX = Math.max(maxX, node.x + node.radius * 1.5);
      maxY = Math.max(maxY, node.y + node.radius * 1.5);
    });

    // Add padding and ensure minimum size
    const width = Math.max(800, maxX - minX + 100);
    const height = Math.max(600, maxY - minY + 100);

    // Use a simpler approach by using the actual SVG on the page
    // We'll clone it and adjust its dimensions
    const clonedSvg = svg.cloneNode(true);
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Ensure the title is properly positioned
    const titleElement = clonedSvg.querySelector('text');
    if (titleElement) {
      titleElement.setAttribute('x', width / 2);
      titleElement.setAttribute('y', 30);
    }

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size with high resolution
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Create an img element
    const img = new Image();

    // Convert the SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const encodedSvg = encodeURIComponent(svgData);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

    img.onload = function () {
      // Draw the image onto the canvas
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to PNG and download
      try {
        const pngUrl = canvas.toDataURL('image/png');

        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${
          currentChart.title || 'identity-chart'
        }-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showNotification('Chart downloaded successfully!', 'success');
      } catch (err) {
        console.error('Error creating PNG:', err);
        showNotification('Error creating PNG. Please try again.', 'error');
      }
    };

    img.onerror = function (e) {
      console.error('Error loading SVG', e);
      showNotification('Error generating image. Please try again.', 'error');
    };

    img.src = dataUrl;
  };
  const saveToGallery = () => {
    if (!currentChart.title) {
      updateChart({ ...currentChart, title: 'My Identity Chart' });
    }
    const chartId = saveChart();
    showNotification(
      `Chart "${currentChart.title}" saved to gallery!`,
      'success'
    );
  };

  const handleOpenNewChartDialog = () => {
    setNewChartTitle('');
    setNewChartDialog(true);
    handleMenuClose();
  };

  const handleCloseNewChartDialog = () => {
    setNewChartDialog(false);
  };

  const handleCreateNewChart = () => {
    clearCurrentChart();
    if (newChartTitle) {
      updateChart({ title: newChartTitle });
    }
    setNewChartDialog(false);
    showNotification('New chart created!', 'success');
  };

  const handleAddNode = () => {
    // Create a node with a random color from our palette
    const newNode = {
      id: `node-${Date.now()}`,
      x: 400,
      y: 300,
      radius: 60,
      color: getRandomColor(), // Use random color
      opacity: 1,
      title: 'New Node',
      lines: ['Click to edit'],
      fontSize: 14,
      fontWeight: 'normal',
      image: null,
    };
    addNode(newNode);
    showNotification('New node added!', 'success');
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveToGallery();
      }

      // Cmd/Ctrl + N for new chart
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleOpenNewChartDialog();
      }

      // Cmd/Ctrl + D to download
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        downloadChart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: 4,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            align="center"
            color="primary"
            gutterBottom>
            Identity Chart Maker
          </Typography>

          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2 }}>
            <Tab label="Chart Editor" />
            <Tab label="Gallery" />
          </Tabs>

          {currentTab === 0 && (
            <>
              <ActionBar>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size="small"
                    label="Chart Title"
                    value={currentChart.title || ''}
                    onChange={(e) => updateChart({ title: e.target.value })}
                    sx={{ minWidth: 200 }}
                  />

                  <ButtonGroup variant="contained" size="small">
                    <Button startIcon={<AddIcon />} onClick={handleAddNode}>
                      Add Node
                    </Button>
                    <Button startIcon={<SaveIcon />} onClick={saveToGallery}>
                      Save
                    </Button>
                    <Button
                      startIcon={<DownloadIcon />}
                      onClick={downloadChart}>
                      Download
                    </Button>
                  </ButtonGroup>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<CreateNewFolderIcon />}
                  onClick={handleOpenNewChartDialog}
                  size="small">
                  New Chart
                </Button>
              </ActionBar>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <ControlPanel elevation={2}>
                    <NodeEditor />
                    <Box sx={{ mt: 'auto', display: 'flex', gap: 2, pt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveToGallery}
                        fullWidth>
                        Save to Gallery
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={downloadChart}
                        fullWidth>
                        Download PNG
                      </Button>
                    </Box>
                  </ControlPanel>
                </Grid>
                <Grid item xs={12} md={8} ref={canvasRef}>
                  <ChartCanvas />
                </Grid>
              </Grid>
            </>
          )}

          {currentTab === 1 && <Gallery />}

          {/* Footer */}
          <Footer>
            <SignatureText variant="h6">
              Yours truly... Daniel Michael{' '}
              <FavoriteIcon fontSize="small" color="secondary" />
            </SignatureText>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Made with passion for creating visual stories
            </Typography>
          </Footer>
        </Container>
      </Box>

      {/* New Chart Dialog */}
      <Dialog open={newChartDialog} onClose={handleCloseNewChartDialog}>
        <DialogTitle>Create New Chart</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a title for your new identity chart:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Chart Title"
            fullWidth
            variant="outlined"
            value={newChartTitle}
            onChange={(e) => setNewChartTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewChartDialog}>Cancel</Button>
          <Button onClick={handleCreateNewChart} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;
