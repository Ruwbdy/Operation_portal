// Centralized API Endpoint Definitions

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9041';

export const API_ENDPOINTS = {
  // Consolidated Data Retrieval
  GET_CHARGING_PROFILE: `${API_BASE}/get-charging-profile`,
  GET_DATA_PROFILE: `${API_BASE}/get-data-profile`,
  
  // Voice Profile Actions
  RESET_CALL_PROFILE: `${API_BASE}/reset-call-profile`,
  
  // Browsing Profile Actions
  RESET_APN: `${API_BASE}/reset-apn`,
  
  // VoLTE Actions
  ACTIVATE_VOLTE: `${API_BASE}/activate-volte`,
  DEACTIVATE_VOLTE: `${API_BASE}/deactivate-volte`,
  DELETE_VOLTE: `${API_BASE}/delete-volte`,
  
  // Service Management (Future)
  SET_SERVICE_CLASS: `${API_BASE}/set-service-class`,
  ADD_OFFER: `${API_BASE}/add-offer`,
  
  // Data Bundle (Future)
  GET_CIS_STATUS: `${API_BASE}/get-cis-status`,
  GET_SCAPV2_STATUS: `${API_BASE}/get-scapv2-status`,
  GET_SDP_PAM: `${API_BASE}/get-sdp-pam`,
  
  // Batch Jobs (POST with file upload)
  BATCH_JOB: `${API_BASE}/jobs/execute`
};