import AppError from './AppError.js';

export const ORDER_STATUSES = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PRINTING: 'Printing',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

const ALLOWED_TRANSITIONS = {
  [ORDER_STATUSES.PLACED]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.PRINTING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PRINTING]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [],
  [ORDER_STATUSES.CANCELLED]: []
};

/**
 * Validates if a target status transition is legal from the current status.
 * Throws AppError if transition is illegal.
 */
export const validateStatusTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) {
    return true; // Idempotent same-status call
  }

  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowedNextStates) {
    throw new AppError(`Unknown current order status: '${currentStatus}'`, 400);
  }

  if (!allowedNextStates.includes(targetStatus)) {
    throw new AppError(
      `Invalid order status transition from '${currentStatus}' to '${targetStatus}'. Allowed next steps: [${allowedNextStates.join(', ')}]`,
      400
    );
  }

  return true;
};
