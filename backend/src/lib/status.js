export const STATUS_ORDER = ['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant'];

export const STATUS_TRANSITIONS = {
  New: ['Assigned'],
  Assigned: ['In Progress'],
  'In Progress': ['Submitted'],
  Submitted: ['Cleared', 'Discrepant'],
  Cleared: [],
  Discrepant: []
};

export const canTransitionStatus = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return false;
  return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

export const getStatusLabel = (status) => {
  return status || 'New';
};
