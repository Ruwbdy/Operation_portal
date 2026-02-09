// Centralized API Endpoint Definitions

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Subscriber Data Retrieval
  GET_HLR: `${API_BASE}/soap/get-hlr`,
  GET_HSS: `${API_BASE}/soap/get-hss`,
  GET_ACCOUNT_DETAILS: `${API_BASE}/soap/get-account-details`,
  GET_OFFERS: `${API_BASE}/soap/get-offers`,
  GET_CDR_RECORDS: `${API_BASE}/api/get-cdr-records`,
  GET_VOLTE: `${API_BASE}/soap/get-volte`,
  
  // Voice Profile Actions
  RESET_CALL_PROFILE: `${API_BASE}/soap/reset-call-profile`,
  
  // Browsing Profile Actions
  RESET_APN_PHONE: `${API_BASE}/soap/reset-apn-phone`,
  RESET_APN_IOT: `${API_BASE}/soap/reset-apn-iot`,
  
  // VoLTE Actions
  ACTIVATE_VOLTE: `${API_BASE}/soap/activate-volte`,
  DEACTIVATE_VOLTE: `${API_BASE}/soap/deactivate-volte`,
  DELETE_VOLTE: `${API_BASE}/soap/delete-volte`,
  
  // Service Management
  SET_SERVICE_CLASS: `${API_BASE}/soap/set-service-class`,
  ADD_OFFER: `${API_BASE}/soap/add-offer`,
  
  // Data Bundle (Future)
  GET_CIS_STATUS: `${API_BASE}/api/get-cis-status`,
  GET_SCAPV2_STATUS: `${API_BASE}/api/get-scapv2-status`,
  GET_SDP_PAM: `${API_BASE}/api/get-sdp-pam`,
  
  // SOAP Transactions
  SEND_FAILURE_RESPONSE: `${API_BASE}/soap/send-failure-response`,
  SEND_SUCCESS_RESPONSE: `${API_BASE}/soap/send-success-response`,
  SEND_DSA_RESPONSE: `${API_BASE}/soap/send-dsa-response`,
  ACTIVATE_SPKA: `${API_BASE}/soap/activate-spka`,
  CREATE_AF_AIR: `${API_BASE}/soap/create-af-air`,
  
  // Batch Jobs (POST with file upload)
  BATCH_JOB: `${API_BASE}/jobs/execute`
};