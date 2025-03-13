import React, { useRef, useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { useChartStore } from '../store/chartStore';

const CanvasContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '70vh',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#f8f9fa',
}));

const SVGContainer = styled('svg')(({ isSelecting }) => ({
  width: '100%',
  height: '100%',
  cursor: isSelecting ? 'crosshair' : 'default',
}));

const NodeElement = styled('circle')(({ selected, isConnecting }) => ({
  cursor: isConnecting ? 'crosshair' : 'pointer',
  stroke: selected ? '#000' : 'none',
  strokeWidth: selected ? 2 : 0,
  '&:hover': {
    filter: 'brightness(1.1)',
  },
}));

const SelectionRect = styled('rect')({
  fill: 'rgba(66, 133, 244, 0.1)',
  stroke: 'rgb(66, 133, 244)',
  strokeWidth: 1,
  strokeDasharray: '4,4',
});

const ChartCanvas = () => {
  const svgRef = useRef(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    offset: { x: 0, y: 0 },
  });
  const [connecting, setConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);

  // Selection box state
  const [selectionBox, setSelectionBox] = useState({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const {
    currentChart,
    nodes,
    connections,
    selectedNodes,
    updateNode,
    selectNode,
    selectMultipleNodes,
    clearNodeSelection,
    addConnection,
    removeConnection,
    removeNode,
    removeMultipleNodes,
  } = useChartStore();

  // For keyboard events (Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedNodes.length > 0) {
        removeMultipleNodes(selectedNodes);
      } else if (e.key === 'Escape') {
        // Cancel connecting mode or selection
        if (connecting) {
          setConnecting(false);
          setConnectionStart(null);
        } else if (selectedNodes.length > 0) {
          clearNodeSelection();
        }
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        // Select all nodes
        e.preventDefault();
        selectMultipleNodes(nodes.map((node) => node.id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodes,
    removeMultipleNodes,
    connecting,
    clearNodeSelection,
    selectMultipleNodes,
    nodes,
  ]);

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();

    // If we're in connecting mode, handle connection creation
    if (connecting) {
      if (connectionStart !== nodeId) {
        // Add new connection
        addConnection({ source: connectionStart, target: nodeId });
      }
      // Exit connecting mode
      setConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Check if shift key is pressed for multi-select
    if (e.shiftKey) {
      // Toggle the selection of this node
      if (selectedNodes.includes(nodeId)) {
        selectMultipleNodes(selectedNodes.filter((id) => id !== nodeId));
      } else {
        selectMultipleNodes([...selectedNodes, nodeId]);
      }
    } else {
      // Normal click - just select the node
      selectNode(nodeId);
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0 || connecting) return; // Only left mouse button and not when connecting

    // Only start drag if not in connecting mode
    if (!connecting) {
      // Get svg element position
      const svgRect = svgRef.current.getBoundingClientRect();

      // Find the node being dragged
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Calculate offset
      const offsetX = e.clientX - svgRect.left - node.x;
      const offsetY = e.clientY - svgRect.top - node.y;

      setDragState({
        isDragging: true,
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        offset: { x: offsetX, y: offsetY },
      });

      // Select the node if not already selected
      if (!selectedNodes.includes(nodeId)) {
        if (!e.shiftKey) {
          // Replace selection if not adding to selection
          selectNode(nodeId);
        } else {
          // Add to selection
          selectMultipleNodes([...selectedNodes, nodeId]);
        }
      }
    }

    e.stopPropagation();
  };

  const handleMouseMove = (e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    // Handle node dragging
    if (dragState.isDragging) {
      // Find the node being dragged
      const node = nodes.find((n) => n.id === dragState.nodeId);
      if (!node) return;

      // Calculate new position
      const x = Math.max(
        node.radius,
        Math.min(svgRect.width - node.radius, mouseX - dragState.offset.x)
      );
      const y = Math.max(
        node.radius,
        Math.min(svgRect.height - node.radius, mouseY - dragState.offset.y)
      );

      // Calculate movement delta
      const deltaX = x - node.x;
      const deltaY = y - node.y;

      // If multiple nodes are selected, move them all
      if (
        selectedNodes.length > 1 &&
        selectedNodes.includes(dragState.nodeId)
      ) {
        // Move all selected nodes by the same delta
        selectedNodes.forEach((id) => {
          const selectedNode = nodes.find((n) => n.id === id);
          if (selectedNode && id !== dragState.nodeId) {
            const newX = Math.max(
              selectedNode.radius,
              Math.min(
                svgRect.width - selectedNode.radius,
                selectedNode.x + deltaX
              )
            );
            const newY = Math.max(
              selectedNode.radius,
              Math.min(
                svgRect.height - selectedNode.radius,
                selectedNode.y + deltaY
              )
            );
            updateNode({ ...selectedNode, x: newX, y: newY });
          }
        });
      }

      // Update the dragged node
      updateNode({ ...node, x, y });
      return;
    }

    // Handle selection box
    if (selectionBox.isSelecting) {
      setSelectionBox((prev) => ({
        ...prev,
        endX: mouseX,
        endY: mouseY,
      }));
    }
  };

  const handleMouseUp = () => {
    // Handle the end of selection box
    if (selectionBox.isSelecting) {
      // Calculate selection box coordinates
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      // Find nodes within the selection box
      const selectedIds = nodes
        .filter((node) => {
          return (
            node.x - node.radius >= minX &&
            node.x + node.radius <= maxX &&
            node.y - node.radius >= minY &&
            node.y + node.radius <= maxY
          );
        })
        .map((node) => node.id);

      // If any nodes are selected, add them to the selection
      if (selectedIds.length > 0) {
        selectMultipleNodes(selectedIds);
      }

      // Reset selection box
      setSelectionBox({
        isSelecting: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      });
    }

    // Reset drag state
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        nodeId: null,
        startX: 0,
        startY: 0,
        offset: { x: 0, y: 0 },
      });
    }
  };

  const handleCanvasMouseDown = (e) => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Don't start selection if clicking on a node
    if (e.target.tagName === 'circle') return;

    // Get svg element position
    const svgRect = svgRef.current.getBoundingClientRect();
    const startX = e.clientX - svgRect.left;
    const startY = e.clientY - svgRect.top;

    // Start a selection box
    setSelectionBox({
      isSelecting: true,
      startX,
      startY,
      endX: startX,
      endY: startY,
    });

    // Clear current selection unless shift is pressed
    if (!e.shiftKey) {
      clearNodeSelection();
    }
  };

  const handleCanvasClick = (e) => {
    // If we already handled mousedown+mouseup as a selection, don't clear here
    if (selectionBox.isSelecting) return;

    // If we're in connecting mode and click on the canvas, cancel connecting
    if (connecting) {
      setConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Only clear selection if clicking directly on canvas (not on a node)
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      clearNodeSelection();
    }
  };

  // Handle right-click for connections
  const handleContextMenu = (e, nodeId) => {
    e.preventDefault();

    // Toggle connecting mode
    if (!connecting) {
      // Start connection
      setConnecting(true);
      setConnectionStart(nodeId);

      // Also select this node
      selectNode(nodeId);
    } else {
      // If right-click again on same node, cancel connection
      if (connectionStart === nodeId) {
        setConnecting(false);
        setConnectionStart(null);
      } else {
        // Finish connection with right-click
        addConnection({ source: connectionStart, target: nodeId });
        setConnecting(false);
        setConnectionStart(null);
      }
    }
  };

  // Calculate text positioning
  const getTextPosition = (node, index, total) => {
    // If this is the title line (index === -1), position at top
    if (index === -1) {
      return {
        x: node.x,
        y: node.y - node.radius / 2, // Position title at the top part of the node
      };
    }

    // For regular content lines
    const lineHeight = node.fontSize * 1.2;
    const totalHeight = lineHeight * total;
    const startY = node.y - totalHeight / 2 + lineHeight / 2;
    return {
      x: node.x,
      y: startY + index * lineHeight,
    };
  };

  // Calculate selection box dimensions
  const getSelectionBoxAttributes = () => {
    const minX = Math.min(selectionBox.startX, selectionBox.endX);
    const maxX = Math.max(selectionBox.startX, selectionBox.endX);
    const minY = Math.min(selectionBox.startY, selectionBox.endY);
    const maxY = Math.max(selectionBox.startY, selectionBox.endY);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  return (
    <CanvasContainer elevation={3}>
      <SVGContainer
        ref={svgRef}
        isSelecting={selectionBox.isSelecting}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}>
        {/* Background */}
        <rect width="100%" height="100%" fill="#f8f9fa" rx="10" ry="10" />

        {/* Title */}
        <text
          x="50%"
          y="30"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="#333">
          {currentChart.title || 'My Identity Chart'}
        </text>

        {/* Connections */}
        {connections.map((conn, i) => {
          const source = nodes.find((n) => n.id === conn.source);
          const target = nodes.find((n) => n.id === conn.target);

          if (!source || !target) return null;

          return (
            <line
              key={`conn-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#666"
              strokeWidth="2"
              strokeDasharray={connecting ? '5,5' : 'none'}
            />
          );
        })}

        {/* Temporary connection line */}
        {connecting && connectionStart && (
          <ConnectionLine
            startNode={nodes.find((n) => n.id === connectionStart)}
            svgRef={svgRef}
          />
        )}

        {/* Connection Mode Indicator */}
        {connecting && (
          <text
            x="50%"
            y="60"
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            fill="#e8546a">
            Connection Mode: Click on another node to connect, ESC to cancel
          </text>
        )}

        {/* Selection UI information */}
        {selectedNodes.length > 1 && (
          <text
            x="50%"
            y="60"
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            fill="#4a86e8">
            {selectedNodes.length} nodes selected - Press Delete to remove all
            selected nodes
          </text>
        )}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Circle */}
            <NodeElement
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color}
              opacity={node.opacity}
              selected={selectedNodes.includes(node.id)}
              isConnecting={connecting}
              onClick={(e) => handleNodeClick(e, node.id)}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
            />

            {/* Node Title (if present) */}
            {node.title && (
              <text
                x={node.x}
                y={node.y - (node.lines.length > 0 ? node.radius / 3 : 0)}
                fontFamily="Arial, sans-serif"
                fontSize={node.fontSize + 2} // Make title slightly larger
                fontWeight="bold" // Always bold the title
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                pointerEvents="none">
                {node.title}
              </text>
            )}

            {/* Node Text Lines */}
            {node.lines.map((line, i) => (
              <text
                key={`${node.id}-line-${i}`}
                x={node.x}
                y={
                  node.y +
                  (node.title ? node.radius / 6 : 0) +
                  i * node.fontSize * 1.2
                }
                fontFamily="Arial, sans-serif"
                fontSize={node.fontSize}
                fontWeight={node.fontWeight}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                pointerEvents="none">
                {line}
              </text>
            ))}

            {/* Node Image (if present) */}
            {node.image && (
              <image
                href={node.image}
                x={
                  node.x +
                  (node.imageX || 0) -
                  (node.radius * (node.imageSize || 1)) / 2
                }
                y={
                  node.y +
                  (node.imageY || 0) -
                  (node.radius * (node.imageSize || 1)) / 2
                }
                width={node.radius * (node.imageSize || 1)}
                height={node.radius * (node.imageSize || 1)}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  transform: `rotate(${node.imageRotation || 0}deg)`,
                  transformOrigin: `${node.x + (node.imageX || 0)}px ${
                    node.y + (node.imageY || 0)
                  }px`,
                }}
                pointerEvents="none"
              />
            )}
          </g>
        ))}

        {/* Selection Box */}
        {selectionBox.isSelecting && (
          <SelectionRect {...getSelectionBoxAttributes()} />
        )}
      </SVGContainer>
    </CanvasContainer>
  );
};

// Helper component for drawing the temporary connection line
const ConnectionLine = ({ startNode, svgRef }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!svgRef.current) return;

      const svgRect = svgRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [svgRef]);

  if (!startNode) return null;

  return (
    <line
      x1={startNode.x}
      y1={startNode.y}
      x2={mousePos.x}
      y2={mousePos.y}
      stroke="#666"
      strokeWidth="2"
      strokeDasharray="5,5"
    />
  );
};

export default ChartCanvas;
