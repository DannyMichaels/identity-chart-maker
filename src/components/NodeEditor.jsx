// components/NodeEditor.jsx
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Slider from '@mui/material/Slider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PhotoIcon from '@mui/icons-material/Photo';

import ColorPicker from './ColorPicker';
import ImageControl from './ImageControl';
import { useChartStore } from '../store/chartStore';

const NodeContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 320px)',
}));

const ImagePreview = styled('img')({
  width: '100%',
  height: 'auto',
  maxHeight: '100px',
  objectFit: 'contain',
  borderRadius: 8,
  marginTop: 8,
});

const NodeEditor = () => {
  const {
    nodes,
    connections,
    selectedNode,
    selectedNodes,
    addNode,
    updateNode,
    removeNode,
    selectNode,
    removeMultipleNodes,
  } = useChartStore();

  const [newLineText, setNewLineText] = useState('');

  const handleAddNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      x: 400,
      y: 400,
      radius: 60,
      color: getRandomColor(),
      opacity: 1,
      title: 'New Node',
      lines: ['Click to edit'],
      fontSize: 14,
      fontWeight: 'normal',
      image: null,
    };
    addNode(newNode);
    selectNode(newNode.id);
  };

  const getRandomColor = () => {
    const colors = [
      '#4a86e8',
      '#0f9d58',
      '#db4437',
      '#f4b400',
      '#9e5fff',
      '#00acc1',
      '#e8546a',
      '#ff9800',
      '#795548',
      '#607d8b',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleNodeChange = (field, value) => {
    if (!selectedNode) return;

    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return;

    updateNode({ ...node, [field]: value });
  };

  const handleAddLine = () => {
    if (!selectedNode || !newLineText.trim()) return;

    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return;

    updateNode({
      ...node,
      lines: [...node.lines, newLineText.trim()],
    });
    setNewLineText('');
  };

  const handleRemoveLine = (index) => {
    if (!selectedNode) return;

    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return;

    const newLines = [...node.lines];
    newLines.splice(index, 1);

    updateNode({ ...node, lines: newLines });
  };

  const handleEditLine = (index, newText) => {
    if (!selectedNode) return;

    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return;

    const newLines = [...node.lines];
    newLines[index] = newText;

    updateNode({ ...node, lines: newLines });
  };

  const handleImageUpload = (e) => {
    if (!selectedNode || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      const node = nodes.find((n) => n.id === selectedNode);
      if (!node) return;

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

  const clearNodeImage = () => {
    if (!selectedNode) return;

    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return;

    updateNode({
      ...node,
      image: null,
      imageSize: undefined,
      imageX: undefined,
      imageY: undefined,
      imageRotation: undefined,
    });
  };

  const handleDeleteSelected = () => {
    if (selectedNodes.length > 0) {
      removeMultipleNodes(selectedNodes);
    } else if (selectedNode) {
      removeNode(selectedNode);
    }
  };

  const selectedNodeData = selectedNode
    ? nodes.find((n) => n.id === selectedNode)
    : null;
  const multipleSelected = selectedNodes.length > 1;

  // When multiple nodes are selected
  if (multipleSelected) {
    return (
      <NodeContainer>
        <Typography variant="h6" gutterBottom>
          Multiple Nodes Selected
        </Typography>
        <Typography variant="body2" gutterBottom>
          {selectedNodes.length} nodes selected
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteSelected}
          sx={{ mt: 2 }}
          fullWidth>
          Delete Selected Nodes
        </Button>
      </NodeContainer>
    );
  }

  // Single node selected
  if (selectedNodeData) {
    return (
      <NodeContainer>
        <Typography variant="h6" gutterBottom>
          Edit Node
        </Typography>

        <TextField
          fullWidth
          label="Title"
          variant="outlined"
          value={selectedNodeData.title}
          onChange={(e) => handleNodeChange('title', e.target.value)}
          margin="normal"
          size="small"
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Node Color
          </Typography>
          <ColorPicker
            color={selectedNodeData.color}
            onChange={(color) => handleNodeChange('color', color)}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Opacity
          </Typography>
          <Slider
            value={selectedNodeData.opacity * 100}
            onChange={(e, newValue) =>
              handleNodeChange('opacity', newValue / 100)
            }
            min={10}
            max={100}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Size
          </Typography>
          <Slider
            value={selectedNodeData.radius}
            onChange={(e, newValue) => handleNodeChange('radius', newValue)}
            min={20}
            max={120}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Font Size
          </Typography>
          <Slider
            value={selectedNodeData.fontSize}
            onChange={(e, newValue) => handleNodeChange('fontSize', newValue)}
            min={8}
            max={24}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}px`}
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={selectedNodeData.fontWeight === 'bold'}
              onChange={(e) =>
                handleNodeChange(
                  'fontWeight',
                  e.target.checked ? 'bold' : 'normal'
                )
              }
            />
          }
          label="Bold Text"
          sx={{ mt: 1 }}
        />

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Node Text Lines</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List
              dense
              sx={{
                bgcolor: 'background.paper',
                maxHeight: '150px',
                overflow: 'auto',
              }}>
              {selectedNodeData.lines.map((line, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveLine(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }>
                  <TextField
                    fullWidth
                    size="small"
                    value={line}
                    onChange={(e) => handleEditLine(index, e.target.value)}
                    variant="standard"
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Add new line"
                value={newLineText}
                onChange={(e) => setNewLineText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLine()}
              />
              <IconButton onClick={handleAddLine}>
                <AddIcon />
              </IconButton>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Image control section */}
        <ImageControl nodeId={selectedNode} />

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => removeNode(selectedNodeData.id)}
          sx={{ mt: 2 }}
          fullWidth>
          Delete Node
        </Button>
      </NodeContainer>
    );
  }

  // No node selected
  return (
    <NodeContainer>
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ py: 4 }}>
        Select a node from the canvas or add a new one
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddNode}
        fullWidth>
        Add New Node
      </Button>
    </NodeContainer>
  );
};

export default NodeEditor;
