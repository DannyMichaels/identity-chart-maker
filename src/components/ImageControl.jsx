import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoIcon from '@mui/icons-material/Photo';

import { useChartStore } from '../store/chartStore';

const ControlBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
}));

const ImagePreview = styled('img')({
  width: '100%',
  height: 'auto',
  maxHeight: '150px',
  objectFit: 'contain',
  borderRadius: 8,
  marginTop: 8,
  marginBottom: 8,
});

const ImageControl = ({ nodeId }) => {
  const { nodes, updateNode } = useChartStore();

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const {
    image,
    imageSize = 1,
    imageX = 0,
    imageY = 0,
    imageRotation = 0,
  } = node;

  const handleImageUpload = (e) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      updateNode({
        ...node,
        image: reader.result,
        imageSize: 1,
        imageX: 0,
        imageY: 0,
        imageRotation: 0,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    updateNode({
      ...node,
      image: null,
      imageSize: undefined,
      imageX: undefined,
      imageY: undefined,
      imageRotation: undefined,
    });
  };

  const handleSizeChange = (e, newValue) => {
    updateNode({
      ...node,
      imageSize: newValue,
    });
  };

  const handleRotationChange = (e, newValue) => {
    updateNode({
      ...node,
      imageRotation: newValue,
    });
  };

  const handlePositionChange = (axis, amount) => {
    if (axis === 'x') {
      updateNode({
        ...node,
        imageX: (imageX || 0) + amount,
      });
    } else {
      updateNode({
        ...node,
        imageY: (imageY || 0) + amount,
      });
    }
  };

  const handleRotateStep = (direction) => {
    const step = direction === 'left' ? -15 : 15;
    updateNode({
      ...node,
      imageRotation: ((imageRotation || 0) + step) % 360,
    });
  };

  if (!image) {
    return (
      <ControlBox>
        <Typography variant="subtitle2" gutterBottom>
          Node Image
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoIcon />}
          fullWidth>
          Upload Image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Button>
      </ControlBox>
    );
  }

  return (
    <ControlBox>
      <Typography variant="subtitle2" gutterBottom>
        Node Image
      </Typography>

      <ImagePreview
        src={image}
        alt="Node"
        style={{
          transform: `rotate(${imageRotation || 0}deg)`,
        }}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          Size
        </Typography>
        <Slider
          value={imageSize || 1}
          min={0.2}
          max={2}
          step={0.1}
          onChange={handleSizeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          Rotation
        </Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={8}>
            <Slider
              value={imageRotation || 0}
              min={0}
              max={360}
              onChange={handleRotationChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}°`}
            />
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <IconButton size="small" onClick={() => handleRotateStep('left')}>
                <RotateLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleRotateStep('right')}>
                <RotateRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          Position Adjustment
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => handlePositionChange('y', -5)}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'center' }}>
            <Typography variant="caption">Y: {imageY || 0}</Typography>
          </Grid>
          <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => handlePositionChange('x', -5)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => handlePositionChange('y', 5)}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => handlePositionChange('x', 5)}>
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Typography variant="caption">X: {imageX || 0}</Typography>
          </Grid>
        </Grid>
      </Box>

      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleImageRemove}
        size="small"
        sx={{ mt: 2 }}
        fullWidth>
        Remove Image
      </Button>
    </ControlBox>
  );
};

export default ImageControl;
