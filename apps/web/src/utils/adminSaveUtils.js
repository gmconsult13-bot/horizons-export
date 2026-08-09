import pb from '@/lib/pocketbaseClient.js';

/**
 * Validates that the current user is authenticated and has the admin role.
 * Throws an error if authentication or authorization fails.
 * @returns {boolean} True if the user is a valid admin.
 */
export const checkAdminAuth = () => {
  if (!pb.authStore.isValid) {
    throw new Error('Authentication Error: You are not logged in.');
  }
  const admin = pb.authStore.model;
  if (admin?.role !== 'admin' && admin?.is_admin !== true) {
    throw new Error('Permission Denied: Admin role is required.');
  }
  return true;
};

/**
 * Processes data before saving to PocketBase.
 * Handles FormData pass-through and parses Date fields to ISO 8601 strings.
 * Ensures consistent data formatting before sending the payload.
 * 
 * @param {Object|FormData} data 
 * @returns {Object|FormData} Processed payload
 */
export const processData = (data) => {
  if (data instanceof FormData) return data;
  if (typeof data !== 'object' || data === null) return data;

  const processed = { ...data };
  
  // Specific fields known to require proper ISO 8601 formatting
  const dateFields = [
    'check_in_date', 'check_out_date', 'start_date', 'end_date',
    'token_expires_at', 'password_reset_expires_at', 
    'created', 'updated', 'created_at', 'updated_at'
  ];

  for (const [key, value] of Object.entries(processed)) {
    if (dateFields.includes(key) && value) {
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          processed[key] = date.toISOString();
        }
      } else if (value instanceof Date && !isNaN(value.getTime())) {
        processed[key] = value.toISOString();
      }
    }
  }
  
  return processed;
};

/**
 * Standardized error handler that logs full context and parses PocketBase validation errors.
 * 
 * @param {Error} err 
 * @param {string} context 
 * @param {Object|FormData} payload
 * @returns {Object} Structured error response { success, data, error, details }
 */
const handleError = (err, context, payload) => {
  console.group(`=== ADMIN SAVE UTILITY ERROR: ${context} ===`);
  console.error('Request Payload:', payload);
  console.error('Full Error Object:', err);
  
  let errorMsg = err.message || 'Operation failed.';
  let details = {};

  if (err.status === 403) {
    errorMsg = 'Permission Denied: Admin role is required.';
  } else if (err.status === 400) {
    // Parse field-specific validation errors from PocketBase
    const errorData = err.response?.data || err.data?.data || {};
    if (Object.keys(errorData).length > 0) {
      details = errorData;
      const messages = Object.entries(details)
        .map(([field, info]) => `${field}: ${info.message}`)
        .join(' | ');
      if (messages) errorMsg = `Validation Failed: ${messages}`;
      console.error('Parsed Validation Errors:', details);
    } else {
      errorMsg = 'Validation Failed: Bad Request.';
    }
  }

  console.groupEnd();
  return { success: false, data: null, error: errorMsg, details };
};

/**
 * Unified save function for create or update operations.
 * 
 * @param {string} collection - The PocketBase collection name.
 * @param {Object|FormData} data - The payload to save.
 * @param {string|null} recordId - Existing record ID to update, or null to create.
 * @returns {Promise<Object>} { success: boolean, data?: any, error?: string, details?: any }
 */
export const saveRecord = async (collection, data, recordId = null) => {
  try {
    checkAdminAuth();
    const payload = processData(data);
    
    console.log(`[adminSaveUtils] Attempting to ${recordId ? 'update' : 'create'} record in collection: ${collection}`);
    
    let record;
    if (recordId) {
      record = await pb.collection(collection).update(recordId, payload, { $autoCancel: false });
    } else {
      record = await pb.collection(collection).create(payload, { $autoCancel: false });
    }
    
    console.log(`[adminSaveUtils] Successfully saved record to ${collection}:`, record);
    return { success: true, data: record, error: null, details: null };
  } catch (err) {
    return handleError(err, `saveRecord(${collection})`, data);
  }
};

/**
 * Unified create function wrapper.
 * 
 * @param {string} collection - The PocketBase collection name.
 * @param {Object|FormData} data - The payload to create.
 * @returns {Promise<Object>} { success, data, error, details }
 */
export const createRecord = async (collection, data) => {
  return saveRecord(collection, data, null);
};

/**
 * Unified delete function.
 * 
 * @param {string} collection - The PocketBase collection name.
 * @param {string} recordId - The record ID to delete.
 * @returns {Promise<Object>} { success, data, error, details }
 */
export const deleteRecord = async (collection, recordId) => {
  try {
    checkAdminAuth();
    console.log(`[adminSaveUtils] Attempting to delete record ${recordId} from collection: ${collection}`);
    
    await pb.collection(collection).delete(recordId, { $autoCancel: false });
    
    console.log(`[adminSaveUtils] Successfully deleted record ${recordId} from ${collection}`);
    return { success: true, data: null, error: null, details: null };
  } catch (err) {
    return handleError(err, `deleteRecord(${collection})`, { recordId });
  }
};
