
export type ManualOperationType = 
  | 'RESOLVE_CALL' 
  | 'RESOLVE_BROWSE' 
  | 'RESOLVE_SMS' 
  | 'SEND_FAILURE' 
  | 'SEND_SUCCESS' 
  | 'SEND_DSA' 
  | 'ACTIVATE_SPKA'
  | 'CREATE_AF_AIR'
  | 'GET_HLR'
  | 'GET_ACCOUNT_DETAILS'
  | 'GET_OFFERS'
  | 'SET_SERVICE_CLASS'
  | 'ADD_OFFER';

export type JobOperationType = 
  | 'JOB_CALL_ISSUES'
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

export type OperationType = ManualOperationType | JobOperationType;

export interface ResolvedIssue {
  id: string;
  type: OperationType;
  label: string;
  identifier: string; // MSISDN or Job ID
  details: string;
  status: 'Success' | 'Failure' | 'Processing';
  timestamp: string;
  engineer: string;
  isJob: boolean;
  resultUrl?: string; // Link to zipped response
}

export interface CallResolutionItem {
  action: string;
  passed: boolean;
  'action-taken'?: boolean;
}

export interface CallIssueResult {
  msisdn: string;
  resolutions: Record<string, CallResolutionItem>;
}
