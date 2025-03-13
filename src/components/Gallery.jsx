import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

import { useChartStore } from '../store/chartStore';

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8),
  textAlign: 'center',
}));

const ChartCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ChartPreview = styled(CardMedia)(({ theme }) => ({
  height: 0,
  paddingTop: '75%', // 4:3 aspect ratio
  backgroundColor: '#f8f9fa',
  position: 'relative',
  '& svg': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
}));

const GalleryHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const Gallery = () => {
  const [deleteDialog, setDeleteDialog] = React.useState({
    open: false,
    chartId: null,
    chartTitle: '',
  });

  const {
    savedCharts,
    loadChart,
    deleteChart,
    clearCurrentChart,
    setCurrentTab,
  } = useChartStore();

  const handleEditChart = (chartData) => {
    loadChart(chartData);
    // This ensures we switch to the editor tab when editing
    setCurrentTab(0);
  };

  const handleOpenDeleteDialog = (chartId, chartTitle) => {
    setDeleteDialog({
      open: true,
      chartId,
      chartTitle,
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      chartId: null,
      chartTitle: '',
    });
  };

  const handleDeleteChart = () => {
    if (deleteDialog.chartId) {
      deleteChart(deleteDialog.chartId);
    }
    handleCloseDeleteDialog();
  };

  const handleNewChart = () => {
    clearCurrentChart();
    // Ensure we switch to the editor tab when creating a new chart
    setCurrentTab(0);
  };

  const downloadChart = (chartData) => {
    // Create SVG data
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateSVG(chartData);
    const svg = tempDiv.querySelector('svg');

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size with higher resolution
    const width = 800;
    const height = 600;
    const scale = 2; // Higher resolution
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const DOMURL = window.URL || window.webkitURL || window;
    const svgUrl = DOMURL.createObjectURL(svgBlob);

    // Create an image from the SVG
    const img = new Image();
    img.onload = function () {
      // Draw the image on the canvas with background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale); // Scale for higher resolution
      ctx.drawImage(img, 0, 0, width, height);
      DOMURL.revokeObjectURL(svgUrl);

      // Convert canvas to PNG
      try {
        const pngUrl = canvas.toDataURL('image/png');

        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${
          chartData.title || 'identity-chart'
        }-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (err) {
        console.error('Error creating PNG:', err);
        alert('There was an error creating the PNG. Please try again.');
      }
    };

    img.onerror = function () {
      console.error('Error loading SVG');
      DOMURL.revokeObjectURL(svgUrl);
      alert('There was an error generating the image. Please try again.');
    };

    img.src = svgUrl;
  };

  // Function to generate SVG preview for each chart
  const generateSVG = (chartData) => {
    const { title, nodes, connections } = chartData;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="#f8f9fa" rx="10" ry="10" />
        
        <text 
          x="50%" 
          y="30" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="24" 
          font-weight="bold" 
          fill="#333"
        >
          ${title || 'Identity Chart'}
        </text>
        
        ${connections
          .map((conn) => {
            const source = nodes.find((n) => n.id === conn.source);
            const target = nodes.find((n) => n.id === conn.target);

            if (!source || !target) return '';

            return `
            <line
              x1="${source.x}"
              y1="${source.y}"
              x2="${target.x}"
              y2="${target.y}"
              stroke="#666"
              stroke-width="2"
            />
          `;
          })
          .join('')}
        
        ${nodes
          .map(
            (node) => `
          <g>
            <circle
              cx="${node.x}"
              cy="${node.y}"
              r="${node.radius}"
              fill="${node.color}"
              opacity="${node.opacity}"
            />
            
            ${
              node.title
                ? `
              <text
                x="${node.x}"
                y="${node.y - (node.lines.length > 0 ? node.radius / 3 : 0)}"
                font-family="Arial, sans-serif"
                font-size="${(node.fontSize || 14) + 2}"
                font-weight="bold"
                text-anchor="middle"
                dominant-baseline="middle"
                fill="white"
              >
                ${node.title}
              </text>
            `
                : ''
            }
            
            ${
              node.lines
                ? node.lines
                    .map(
                      (line, i) => `
              <text
                x="${node.x}"
                y="${
                  node.y +
                  (node.title ? node.radius / 6 : 0) +
                  i * (node.fontSize || 14) * 1.2
                }"
                font-family="Arial, sans-serif"
                font-size="${node.fontSize || 14}"
                font-weight="${node.fontWeight || 'normal'}"
                text-anchor="middle"
                dominant-baseline="middle"
                fill="white"
              >
                ${line}
              </text>
            `
                    )
                    .join('')
                : ''
            }
            
            ${
              node.image
                ? `
              <image
                href="${node.image}"
                x="${
                  node.x +
                  (node.imageX || 0) -
                  (node.radius * (node.imageSize || 1)) / 2
                }"
                y="${
                  node.y +
                  (node.imageY || 0) -
                  (node.radius * (node.imageSize || 1)) / 2
                }"
                width="${node.radius * (node.imageSize || 1)}"
                height="${node.radius * (node.imageSize || 1)}"
                preserveAspectRatio="xMidYMid meet"
                style="transform: rotate(${
                  node.imageRotation || 0
                }deg); transform-origin: ${node.x + (node.imageX || 0)}px ${
                    node.y + (node.imageY || 0)
                  }px"
              />
            `
                : ''
            }
          </g>
        `
          )
          .join('')}
      </svg>
    `;
  };

  if (savedCharts.length === 0) {
    return (
      <EmptyState>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your Gallery is Empty
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and save identity charts to see them here.
        </Typography>
        <Button
          variant="contained"
          startIcon={<CreateNewFolderIcon />}
          onClick={handleNewChart}>
          Create a New Chart
        </Button>
      </EmptyState>
    );
  }

  return (
    <>
      <GalleryHeader>
        <Typography variant="h5" color="primary">
          Your Saved Charts
        </Typography>
        <Button
          variant="contained"
          startIcon={<CreateNewFolderIcon />}
          onClick={handleNewChart}>
          Create New Chart
        </Button>
      </GalleryHeader>

      <Grid container spacing={3}>
        {savedCharts.map((chart) => (
          <Grid item xs={12} sm={6} md={4} key={chart.id}>
            <ChartCard elevation={3}>
              <ChartPreview>
                <div dangerouslySetInnerHTML={{ __html: generateSVG(chart) }} />
              </ChartPreview>

              <CardContent>
                <Typography variant="h6" gutterBottom noWrap>
                  {chart.title || 'Untitled Chart'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(chart.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last modified:{' '}
                  {new Date(chart.lastModified).toLocaleDateString()}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditChart(chart)}>
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadChart(chart)}>
                  Download PNG
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleOpenDeleteDialog(chart.id, chart.title)}
                  sx={{ marginLeft: 'auto' }}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </ChartCard>
          </Grid>
        ))}
      </Grid>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Chart</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the chart "
            {deleteDialog.chartTitle || 'Untitled'}"? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteChart} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Gallery;
