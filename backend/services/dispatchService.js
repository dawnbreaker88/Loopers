import DeliveryAgent from '../models/DeliveryAgent.js';
import Order from '../models/Order.js';

let ioInstance = null;

export const setIoInstance = (io) => {
  ioInstance = io;
};

export const getIoInstance = () => {
  return ioInstance;
};

// Helper: Haversine distance in Km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the Earth in Km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Store pending assignment lists in memory for rejection workflow
const pendingAssignments = new Map();

// @desc    Initiate agent assignment workflow
export const requestAgentAssignment = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    const customerLat = order.customerLocation?.lat || 12.9780;
    const customerLng = order.customerLocation?.lng || 77.6400;
    const storeLat = order.storeLocation?.lat || (customerLat - 0.012);
    const storeLng = order.storeLocation?.lng || (customerLng - 0.012);

    // Find available agents
    let availableAgents = await DeliveryAgent.find({ 
      approvalStatus: 'approved',
      isOnline: true,
      isAvailable: true
    });

    // If no agents are online/available, let's set any approved agent online for the simulation
    if (availableAgents.length === 0) {
      const anyApprovedAgent = await DeliveryAgent.findOne({ approvalStatus: 'approved' });
      if (anyApprovedAgent) {
        anyApprovedAgent.isOnline = true;
        anyApprovedAgent.isAvailable = true;
        // Place agent near the store
        anyApprovedAgent.currentLocation = {
          lat: storeLat + 0.005,
          lng: storeLng + 0.005
        };
        await anyApprovedAgent.save();
        availableAgents = [anyApprovedAgent];
        console.log(`No active agents online. Simulating online status for agent: ${anyApprovedAgent.name}`);
      }
    }

    if (availableAgents.length === 0) {
      console.log('No approved agents exist to assign.');
      return null;
    }

    // Calculate distance of each agent to store and sort
    const agentsWithDistance = availableAgents.map(agent => {
      const distToStore = calculateDistance(
        agent.currentLocation?.lat || storeLat,
        agent.currentLocation?.lng || storeLng,
        storeLat,
        storeLng
      );
      return { agent, distToStore };
    }).sort((a, b) => a.distToStore - b.distToStore);

    // Store the list of potential agents for this order
    pendingAssignments.set(orderId.toString(), {
      agentsList: agentsWithDistance,
      currentIndex: 0
    });

    await tryAssignNextAgent(orderId);
  } catch (error) {
    console.error('Error starting agent assignment:', error.message);
  }
};

// @desc    Try assigning the next agent in the queue
export const tryAssignNextAgent = async (orderId) => {
  const assignmentInfo = pendingAssignments.get(orderId.toString());
  if (!assignmentInfo) return false;

  const { agentsList, currentIndex } = assignmentInfo;
  if (currentIndex >= agentsList.length) {
    console.log(`All agents rejected or no more agents for order ${orderId}`);
    pendingAssignments.delete(orderId.toString());
    return false;
  }

  const { agent, distToStore } = agentsList[currentIndex];
  assignmentInfo.currentIndex += 1;
  pendingAssignments.set(orderId.toString(), assignmentInfo);

  const order = await Order.findById(orderId);
  if (!order) return false;

  const pickupDistance = distToStore;
  const deliveryDistance = order.distance || 0;
  const totalDistance = pickupDistance + deliveryDistance;
  const estimatedEarnings = parseFloat((totalDistance * 4 * 0.8).toFixed(2)); // Agent gets 80% of delivery charge

  const requestData = {
    orderId: order._id,
    pickupLocation: order.storeLocation,
    deliveryLocation: order.customerLocation,
    pickupDistance: parseFloat(pickupDistance.toFixed(2)),
    deliveryDistance: parseFloat(deliveryDistance.toFixed(2)),
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedEarnings
  };

  console.log(`Sending assignment request to agent ${agent.name} for Order ${orderId}`);

  // Emit to agent user room via Socket.io
  if (ioInstance) {
    ioInstance.to(agent.user.toString()).emit('order-assignment-request', requestData);
  }

  // Also save active request in memory so agent dashboard API can fetch it as backup
  agent.activeOrderRequest = requestData;
  await agent.save();

  return true;
};

// @desc    Accept order assignment
export const acceptOrderAssignment = async (orderId, agentUser) => {
  const agent = await DeliveryAgent.findOne({ user: agentUser._id });
  if (!agent) throw new Error('Agent profile not found');

  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  order.deliveryAgent = agent._id;
  order.orderStatus = 'Assigned';
  order.agentLocation = agent.currentLocation;
  
  order.trackingHistory.push({
    status: 'Assigned',
    lat: agent.currentLocation.lat,
    lng: agent.currentLocation.lng,
    timestamp: new Date()
  });

  await order.save();

  agent.isAvailable = false;
  agent.activeOrderRequest = null;
  await agent.save();

  // Clean pending assignments map
  pendingAssignments.delete(orderId.toString());

  console.log(`Agent ${agent.name} accepted Order ${orderId}`);

  // Notify clients
  if (ioInstance) {
    ioInstance.to(order.user.toString()).emit('order-update', {
      orderId: order._id,
      orderStatus: 'Assigned',
      agent: {
        name: agent.name,
        phone: agent.phone,
        rating: agent.rating,
        currentLocation: agent.currentLocation
      }
    });

    // Notify room of this specific order
    ioInstance.to(orderId.toString()).emit('order-track-update', {
      orderId: order._id,
      orderStatus: 'Assigned',
      agentLocation: agent.currentLocation,
      trackingHistory: order.trackingHistory
    });
  }

  // Start simulation of delivery flow
  setTimeout(() => {
    simulateDeliveryFlow(order._id);
  }, 4000);

  return order;
};

// @desc    Reject order assignment
export const rejectOrderAssignment = async (orderId, agentUser) => {
  const agent = await DeliveryAgent.findOne({ user: agentUser._id });
  if (agent) {
    agent.activeOrderRequest = null;
    await agent.save();
  }

  console.log(`Agent rejected Order ${orderId}. Trying next agent...`);
  const success = await tryAssignNextAgent(orderId);
  return success;
};

// @desc    Simulate delivery agent transit and live status updates
export const simulateDeliveryFlow = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('deliveryAgent');
    if (!order || !order.deliveryAgent) return;

    const agent = order.deliveryAgent;
    const customerLat = order.customerLocation.lat;
    const customerLng = order.customerLocation.lng;
    const storeLat = order.storeLocation.lat;
    const storeLng = order.storeLocation.lng;

    // Array of simulation steps
    const steps = [
      { status: 'Preparing', lat: storeLat, lng: storeLng },
      { status: 'Picked Up', lat: storeLat, lng: storeLng },
      { status: 'On The Way', lat: (storeLat + customerLat) / 2, lng: (storeLng + customerLng) / 2 },
      { status: 'Near You', lat: customerLat - 0.001, lng: customerLng - 0.001 },
      { status: 'Delivered', lat: customerLat, lng: customerLng }
    ];

    let currentStepIndex = 0;

    const intervalId = setInterval(async () => {
      // Re-fetch order to verify it hasn't been cancelled in the meantime
      const currentOrder = await Order.findById(orderId);
      if (!currentOrder || currentOrder.orderStatus === 'Cancelled') {
        clearInterval(intervalId);
        agent.isAvailable = true;
        await agent.save();
        return;
      }

      if (currentStepIndex >= steps.length) {
        clearInterval(intervalId);
        
        // Finalize order status
        currentOrder.orderStatus = 'Delivered';
        currentOrder.paymentStatus = currentOrder.paymentMethod === 'COD' ? 'Completed' : currentOrder.paymentStatus;
        currentOrder.agentLocation = { lat: customerLat, lng: customerLng };
        currentOrder.trackingHistory.push({
          status: 'Delivered',
          lat: customerLat,
          lng: customerLng,
          timestamp: new Date()
        });
        await currentOrder.save();

        // Release agent & Add Earnings
        agent.isAvailable = true;
        agent.currentLocation = { lat: customerLat, lng: customerLng };
        // Agent earnings is 80% of delivery charge
        const tripEarnings = parseFloat(((currentOrder.deliveryCharge || 0) * 0.8).toFixed(2));
        agent.earnings = parseFloat(((agent.earnings || 0) + tripEarnings).toFixed(2));
        agent.completedDeliveries = (agent.completedDeliveries || 0) + 1;
        await agent.save();

        console.log(`Simulation finished. Order ${orderId} Delivered.`);

        if (ioInstance) {
          ioInstance.to(currentOrder.user.toString()).emit('order-update', {
            orderId: currentOrder._id,
            orderStatus: 'Delivered',
            paymentStatus: currentOrder.paymentStatus,
            agent: {
              name: agent.name,
              phone: agent.phone,
              currentLocation: agent.currentLocation
            }
          });

          ioInstance.to(orderId.toString()).emit('order-track-update', {
            orderId: currentOrder._id,
            orderStatus: 'Delivered',
            agentLocation: agent.currentLocation,
            trackingHistory: currentOrder.trackingHistory
          });
        }
        return;
      }

      const step = steps[currentStepIndex];
      
      // Update DB values
      currentOrder.orderStatus = step.status;
      currentOrder.agentLocation = { lat: step.lat, lng: step.lng };
      currentOrder.trackingHistory.push({
        status: step.status,
        lat: step.lat,
        lng: step.lng,
        timestamp: new Date()
      });
      await currentOrder.save();

      agent.currentLocation = { lat: step.lat, lng: step.lng };
      await agent.save();

      console.log(`Simulation: Order ${orderId} is now "${step.status}". Agent Location: [${step.lat}, ${step.lng}]`);

      // Notify user via Socket.io
      if (ioInstance) {
        ioInstance.to(currentOrder.user.toString()).emit('order-update', {
          orderId: currentOrder._id,
          orderStatus: step.status,
          agent: {
            name: agent.name,
            phone: agent.phone,
            rating: agent.rating,
            currentLocation: agent.currentLocation
          }
        });

        ioInstance.to(orderId.toString()).emit('order-track-update', {
          orderId: currentOrder._id,
          orderStatus: step.status,
          agentLocation: agent.currentLocation,
          trackingHistory: currentOrder.trackingHistory
        });
      }

      currentStepIndex++;
    }, 6000); // Trigger every 6 seconds

  } catch (error) {
    console.error('Error during delivery simulation:', error.message);
  }
};

// Kept for backward compatibility
export const assignNearestAgent = async (orderId) => {
  return requestAgentAssignment(orderId);
};
