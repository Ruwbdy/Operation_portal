// Centralized API Endpoint Definitions

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://10.1.79.43:9042';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE}/login`,

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

  // Service Management
  SET_SERVICE_CLASS: `${API_BASE}/set-service-class`,
  ADD_OFFER: `${API_BASE}/add-offer`,

  // Bundle Fulfilment — SSE stream
  FETCH_SUBSCRIBER_DATA: `${API_BASE}/fetch-subscriber-data`,

  // Batch Jobs (POST with file upload)
  BATCH_JOB: `${API_BASE}/jobs/execute`,
  
  ACTIVATE_SIM: `${API_BASE}/activate-sim`,

  // ── Sim Registration ────────────────────────────────────────────────────────
  INITIATE_SIM_REG: `${API_BASE}/initiate-sim-reg`,
  
  PROCESS_SIM_REG: `${API_BASE}/process-sim-reg`,
  REPLAY_SIM_REG: `${API_BASE}/replay-sim-reg`,

  // ── Sim Swap ────────────────────────────────────────────────────────────────
  INITIATE_SIM_SWAP: `${API_BASE}/initiate-sim-swap`,
  PROCESS_SIM_SWAP_IMSI: `${API_BASE}/process-sim-swap-imsi`,

  // ── Postpaid Activation ─────────────────────────────────────────────────────
  PROCESS_PRE_TO_POST: `${API_BASE}/process-pre-to-post`,
  PROCESS_CREDIT_LIMITS: `${API_BASE}/process-credit-limits`,
};