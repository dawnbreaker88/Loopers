import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService from '../services/orderService.js';

// Fetch all orders associated with user role
export const fetchOrders = createAsyncThunk(
  'orders/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const data = await orderService.getOrders();
      if (data.success) {
        return data.orders;
      }
      return rejectWithValue('Failed to load orders');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching orders');
    }
  }
);

// Fetch order details by ID
export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      const data = await orderService.getOrderById(orderId);
      if (data.success) {
        return data.order;
      }
      return rejectWithValue('Failed to load order details');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching order details');
    }
  }
);

// Place a new order
export const placeOrder = createAsyncThunk(
  'orders/place',
  async ({ address, paymentMethod }, { rejectWithValue }) => {
    try {
      const data = await orderService.createOrder({ address, paymentMethod });
      if (data.success) {
        return data.order;
      }
      return rejectWithValue('Failed to place order');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error placing order');
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (orderId, { rejectWithValue }) => {
    try {
      const data = await orderService.cancelOrder(orderId);
      if (data.success) {
        return data.order;
      }
      return rejectWithValue('Failed to cancel order');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error cancelling order');
    }
  }
);

// Submit ratings
export const rateOrder = createAsyncThunk(
  'orders/rate',
  async ({ orderId, ratingData }, { rejectWithValue }) => {
    try {
      const data = await orderService.rateOrder(orderId, ratingData);
      if (data.success) {
        return data.order;
      }
      return rejectWithValue('Failed to submit ratings');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error submitting ratings');
    }
  }
);

const initialState = {
  orders: [],
  activeOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearActiveOrder: (state) => {
      state.activeOrder = null;
    },
    updateOrderStatusLocal: (state, action) => {
      const { orderId, orderStatus } = action.payload;
      if (state.activeOrder && state.activeOrder._id === orderId) {
        state.activeOrder.orderStatus = orderStatus;
      }
      const existing = state.orders.find(o => o._id === orderId);
      if (existing) {
        existing.orderStatus = orderStatus;
      }
    },
    newOrderReceived: (state, action) => {
      const newOrder = action.payload;
      const exists = state.orders.some(o => o._id === newOrder._id);
      if (!exists) {
        state.orders.unshift(newOrder);
      }
    },
    orderUpdatedSocket: (state, action) => {
      const updatedOrder = action.payload;
      if (!updatedOrder || !updatedOrder._id) return;
      const index = state.orders.findIndex(o => o._id === updatedOrder._id);
      if (index > -1) {
        state.orders[index] = { ...state.orders[index], ...updatedOrder };
      } else {
        state.orders.unshift(updatedOrder);
      }
      if (state.activeOrder && state.activeOrder._id === updatedOrder._id) {
        state.activeOrder = { ...state.activeOrder, ...updatedOrder };
      }
    },
    riderLocationUpdatedSocket: (state, action) => {
      const { orderId, agentLocation } = action.payload || {};
      if (!orderId || !agentLocation) return;
      if (state.activeOrder && state.activeOrder._id === orderId) {
        state.activeOrder.agentLocation = agentLocation;
      }
      const existing = state.orders.find(o => o._id === orderId);
      if (existing) {
        existing.agentLocation = agentLocation;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        const fetchedOrders = action.payload || [];
        const existingOrdersMap = new Map(state.orders.map(o => [o._id, o]));
        
        // Add or update elements in the map
        fetchedOrders.forEach(order => {
          existingOrdersMap.set(order._id, order);
        });

        // Convert back to array, sorting by createdAt descending
        state.orders = Array.from(existingOrdersMap.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrder = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrder = action.payload;
        state.orders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o._id === action.payload._id);
        if (index > -1) {
          state.orders[index] = action.payload;
        }
        if (state.activeOrder && state.activeOrder._id === action.payload._id) {
          state.activeOrder = action.payload;
        }
      })
      .addCase(rateOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o._id === action.payload._id);
        if (index > -1) {
          state.orders[index] = action.payload;
        }
        if (state.activeOrder && state.activeOrder._id === action.payload._id) {
          state.activeOrder = action.payload;
        }
      });
  }
});

export const { clearActiveOrder, updateOrderStatusLocal, newOrderReceived, orderUpdatedSocket, riderLocationUpdatedSocket } = orderSlice.actions;
export default orderSlice.reducer;
