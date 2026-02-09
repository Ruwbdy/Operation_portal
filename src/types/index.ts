// Main Type Definitions - MTN IN Operations Portal

export type OperationType = 
  | 'RESET_CALL_PROFILE'
  | 'RESET_BROWSING_PHONE'
  | 'RESET_BROWSING_IOT'
  | 'ACTIVATE_VOLTE'
  | 'DEACTIVATE_VOLTE'
  | 'DELETE_VOLTE'
  | 'SET_SERVICE_CLASS'
  | 'ADD_OFFER'
  | 'SEND_FAILURE'
  | 'SEND_SUCCESS'
  | 'SEND_DSA'
  | 'ACTIVATE_SPKA'
  | 'CREATE_AF_AIR';

export type JobType =
  | 'JOB_CALL_PROFILE'
  | 'JOB_CREDIT_LIMIT'
  | 'JOB_INIT_SIM_REG'
  | 'JOB_GET_SIM_REG_IMSI'
  | 'JOB_DELETE_AIR'
  | 'JOB_DEACT_POSTPAID'
  | 'JOB_REPLAY_SIM_REG'
  | 'JOB_COMPLETE_SIM_REG'
  | 'JOB_INIT_SIM_SWAP'
  | 'JOB_GET_SWAP_IMSI'
  | 'JOB_COMPLETE_SIM_SWAP';

export interface ResolvedIssue {
  id: string;
  type: OperationType | JobType;
  label: string;
  identifier: string; // MSISDN or Job ID
  details: string;
  status: 'Success' | 'Failure' | 'Processing';
  timestamp: string;
  engineer: string;
  isJob: boolean;
  resultUrl?: string; // Link to zipped response
}

export interface AIAnalysis {
  summary: string;
  suggestions: string[];
}