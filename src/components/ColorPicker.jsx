  import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

const ColorButton = styled(Box)(({ theme, color, selected }) => ({
  width: 32,
  height: 32,
  backgroundColor: color,
  borderRadius: '50%',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  border: selected ? '2px solid black' : '2px solid transparent',
}));

const ColorInputField = styled(TextField)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const PRESET_COLORS = [
  '#4a86e8', '#3cba54', '#f4b400', '#db4437', // Google colors
  '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', // Purples and blues
  '#009688', '#4caf50', '#8bc34a', '#cddc39', // Greens
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', // Yellows and oranges
  '#795548', '#9e9e9e', '#607d8b', '#000000', // Browns and grays
];

const ColorPicker = ({ color, onChange }) => {
  const handleColorChange = (newColor) => {
    onChange(newColor);
  };
  
  const handleInputChange = (e) => {
    // Validate color input
    const value = e.target.value;
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      onChange(value);
    }
  };
  
  return (
    <Box>
      <Grid container spacing={1}>
        {PRESET_COLORS.map((presetColor) => (
          <Grid item key={presetColor}>
            <ColorButton 
              color={presetColor}
              selected={color === presetColor}
              onClick={() => handleColorChange(presetColor)}
            />
          </Grid>
        ))}
      </Grid>
      
      <ColorInputField
        label="Hex Color"
        size="small"
        value={color}
        onChange={handleInputChange}
        InputProps={{
          startAdornment: (
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: color, 
                mr: 1, 
                borderRadius: '4px' 
              }} 
            />
          ),
        }}
      />
    </Box>
  );
};

export default ColorPicker;