/**
 * Case statuses in their canonical lifecycle order, from creation to closure.
 * @type {string[]}
 */
export const STATUS_ORDER = ['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant'];

/**
 * Map of each case status to the statuses it is allowed to transition into.
 * `Cleared` and `Discrepant` are terminal states with no further transitions.
 * @type {Object<string, string[]>}
 */
export const STATUS_TRANSITIONS = {
  New: ['Assigned'],
  Assigned: ['In Progress'],
  'In Progress': ['Submitted'],
  Submitted: ['Cleared', 'Discrepant'],
  Cleared: [],
  Discrepant: []
};

/**
 * Checks whether a case is allowed to move from one status to another
 * according to {@link STATUS_TRANSITIONS}.
 *
 * @param {string} fromStatus - Current status of the case.
 * @param {string} toStatus - Status the case is being moved to.
 * @returns {boolean} `true` if the transition is permitted, otherwise `false`.
 */
export const canTransitionStatus = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return false;
  return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

/**
 * Returns a human-readable label for a case status, defaulting to `'New'`
 * when no status has been set.
 *
 * @param {string} [status] - The raw status value.
 * @returns {string} The resolved status label.
 */
export const getStatusLabel = (status) => {
  return status || 'New';
};
