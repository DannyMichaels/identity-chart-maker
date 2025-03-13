// store/chartStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Initial nodes similar to your identity chart
const initialNodes = [];

// Initial connections
const initialConnections = [];

// Define node colors for random selection
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

// Function to get a random color
const getRandomColor = () => {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
};

const generateRandomId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// Main store
export const useChartStore = create(
  persist(
    (set, get) => ({
      // App state
      currentTab: 0,
      setCurrentTab: (tab) => set({ currentTab: tab }),

      // Current chart being edited
      currentChart: {
        id: 'my-chart-' + generateRandomId(),
        title: 'My Identity Chart',
        createdAt: Date.now(),
        lastModified: Date.now(),
      },
      updateChart: (chartData) =>
        set({
          currentChart: {
            ...get().currentChart,
            ...chartData,
            lastModified: Date.now(),
          },
        }),

      // Nodes & connections for current chart
      nodes: initialNodes,
      connections: initialConnections,

      // Node selection - multi-select support
      selectedNode: null, // For backwards compatibility
      selectedNodes: [], // Array of selected node IDs

      // Node operations
      addNode: (node) => {
        // Use a random color if none provided
        const nodeWithColor = {
          ...node,
          color: node.color || getRandomColor(),
        };

        set({
          nodes: [...get().nodes, nodeWithColor],
          selectedNode: nodeWithColor.id,
          selectedNodes: [nodeWithColor.id], // Select only this node
        });
      },

      updateNode: (updatedNode) =>
        set({
          nodes: get().nodes.map((node) =>
            node.id === updatedNode.id ? updatedNode : node
          ),
        }),

      removeNode: (nodeId) => {
        // Also remove connections involving this node
        const filteredConnections = get().connections.filter(
          (conn) => conn.source !== nodeId && conn.target !== nodeId
        );

        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          connections: filteredConnections,
          selectedNode:
            get().selectedNode === nodeId ? null : get().selectedNode,
          selectedNodes: get().selectedNodes.filter((id) => id !== nodeId),
        });
      },

      // Multi-selection operations
      selectNode: (nodeId) => {
        // If nodeId is null, clear selection
        if (nodeId === null) {
          set({
            selectedNode: null,
            selectedNodes: [],
          });
          return;
        }

        // Otherwise select just this node
        set({
          selectedNode: nodeId,
          selectedNodes: [nodeId],
        });
      },

      selectMultipleNodes: (nodeIds) => {
        set({
          selectedNodes: nodeIds,
          selectedNode: nodeIds.length === 1 ? nodeIds[0] : null,
        });
      },

      toggleNodeSelection: (nodeId) => {
        const { selectedNodes } = get();
        if (selectedNodes.includes(nodeId)) {
          // Deselect this node
          const newSelection = selectedNodes.filter((id) => id !== nodeId);
          set({
            selectedNodes: newSelection,
            selectedNode: newSelection.length === 1 ? newSelection[0] : null,
          });
        } else {
          // Add this node to selection
          const newSelection = [...selectedNodes, nodeId];
          set({
            selectedNodes: newSelection,
            selectedNode: newSelection.length === 1 ? newSelection[0] : null,
          });
        }
      },

      clearNodeSelection: () => {
        set({
          selectedNode: null,
          selectedNodes: [],
        });
      },

      // Multiple nodes operations
      removeMultipleNodes: (nodeIds) => {
        // Remove all connections involving these nodes
        const filteredConnections = get().connections.filter(
          (conn) =>
            !nodeIds.includes(conn.source) && !nodeIds.includes(conn.target)
        );

        set({
          nodes: get().nodes.filter((node) => !nodeIds.includes(node.id)),
          connections: filteredConnections,
          selectedNode: null,
          selectedNodes: [],
        });
      },

      // Connection operations
      addConnection: (connection) => {
        // Prevent duplicate connections
        const exists = get().connections.some(
          (conn) =>
            (conn.source === connection.source &&
              conn.target === connection.target) ||
            (conn.source === connection.target &&
              conn.target === connection.source)
        );

        if (!exists) {
          set({
            connections: [...get().connections, connection],
          });
          return true;
        }
        return false;
      },

      removeConnection: (connection) =>
        set({
          connections: get().connections.filter(
            (conn) =>
              !(
                conn.source === connection.source &&
                conn.target === connection.target
              )
          ),
        }),

      // Saved charts
      savedCharts: [],
      saveChart: () => {
        const { currentChart, nodes, connections } = get();
        const chartToSave = {
          ...currentChart,
          id: currentChart.id || `chart-${Date.now()}`,
          nodes: JSON.parse(JSON.stringify(nodes)),
          connections: JSON.parse(JSON.stringify(connections)),
          lastModified: Date.now(),
        };

        const existingIndex = get().savedCharts.findIndex(
          (chart) => chart.id === chartToSave.id
        );

        if (existingIndex >= 0) {
          // Update existing chart
          set({
            savedCharts: get().savedCharts.map((chart, index) =>
              index === existingIndex ? chartToSave : chart
            ),
          });
        } else {
          // Add new chart
          chartToSave.createdAt = Date.now();
          set({
            savedCharts: [...get().savedCharts, chartToSave],
            currentChart: {
              ...chartToSave,
              id: chartToSave.id, // Maintain the same ID for continuity
            },
          });
        }

        return chartToSave.id;
      },

      loadChart: (chartData) =>
        set({
          currentChart: {
            ...chartData,
            lastModified: Date.now(),
          },
          nodes: chartData.nodes || [],
          connections: chartData.connections || [],
          selectedNode: null,
          selectedNodes: [],
          currentTab: 0, // Switch to editor tab
        }),

      deleteChart: (chartId) =>
        set({
          savedCharts: get().savedCharts.filter(
            (chart) => chart.id !== chartId
          ),
        }),

      clearCurrentChart: () =>
        set({
          currentChart: {
            id: `chart-${Date.now()}`,
            title: 'New Identity Chart',
            createdAt: Date.now(),
            lastModified: Date.now(),
          },
          nodes: [],
          connections: [],
          selectedNode: null,
          selectedNodes: [],
        }),

      // Utility functions
      duplicateNode: (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const newNode = {
          ...node,
          id: `node-${Date.now()}`,
          x: node.x + 30, // Offset slightly
          y: node.y + 30,
        };

        set({
          nodes: [...get().nodes, newNode],
          selectedNode: newNode.id,
          selectedNodes: [newNode.id],
        });

        return newNode.id;
      },

      // Duplicate multiple nodes at once
      duplicateMultipleNodes: (nodeIds) => {
        const nodesToDuplicate = get().nodes.filter((n) =>
          nodeIds.includes(n.id)
        );
        if (nodesToDuplicate.length === 0) return [];

        // Create duplicates with new IDs and shifted positions
        const newNodes = nodesToDuplicate.map((node) => {
          const newId = `node-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)}`;
          return {
            ...node,
            id: newId,
            x: node.x + 30,
            y: node.y + 30,
          };
        });

        const newNodeIds = newNodes.map((n) => n.id);

        set({
          nodes: [...get().nodes, ...newNodes],
          selectedNode: null,
          selectedNodes: newNodeIds,
        });

        return newNodeIds;
      },

      // Check if the current chart has unsaved changes
      hasUnsavedChanges: () => {
        const { currentChart, nodes, connections, savedCharts } = get();

        const savedChart = savedCharts.find(
          (chart) => chart.id === currentChart.id
        );
        if (!savedChart) return true; // New unsaved chart

        // Simple length check first
        if (
          savedChart.nodes.length !== nodes.length ||
          savedChart.connections.length !== connections.length
        ) {
          return true;
        }

        // Deep comparison would be better but this is a start
        return true;
      },
    }),
    {
      name: 'identity-chart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedCharts: state.savedCharts,
        currentTab: state.currentTab,
      }),
    }
  )
);
