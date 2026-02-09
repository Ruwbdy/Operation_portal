# Architecture Document - MTN IN Operational Portal

## System Overview
A comprehensive operational portal for MTN Intelligent Network management, combining subscriber diagnostics, profile management, and batch automation capabilities.

## Tech Stack
- **Framework**: Vite + React 19 + TypeScript
- **Routing**: React Router v7
- **UI Library**: Tailwind CSS (custom design system)
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI Integration**: Google Gemini API
- **State Management**: React useState/useCallback
- **HTTP Client**: Native Fetch API

---

## Directory Structure

```
mtn-in-operational-portal/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   ├── AIAnalysisPanel.tsx
│   │   │   └── OperationsChart.tsx
│   │   ├── user-support/
│   │   │   ├── charging-profile/
│   │   │   │   ├── VoiceProfileTab.tsx
│   │   │   │   ├── BrowsingProfileTab.tsx
│   │   │   │   ├── VoLTEProfileTab.tsx
│   │   │   │   └── OffersTab.tsx
│   │   │   ├── balance-cdr/
│   │   │   │   ├── BalanceTab.tsx
│   │   │   │   ├── CDRTable.tsx
│   │   │   │   ├── CDRSummary.tsx
│   │   │   │   └── ColumnFilter.tsx
│   │   │   └── data-bundle/
│   │   │       └── ComingSoon.tsx
│   │   ├── in-support/
│   │   │   ├── dclm/
│   │   │   │   ├── BatchJobUpload.tsx
│   │   │   │   └── JobExecutor.tsx
│   │   │   ├── service-desk/
│   │   │   │   └── ProfileResetJobs.tsx
│   │   │   ├── dsa/
│   │   │   │   └── FinalResponseJobs.tsx
│   │   │   └── enterprise/
│   │   │       ├── CUGAttachmentJobs.tsx
│   │   │       └── OfferAttachmentJobs.tsx
│   │   ├── replay/
│   │   │   ├── XMLInput.tsx
│   │   │   ├── XMLOutput.tsx
│   │   │   └── XMLFormatter.tsx
│   │   └── ui/
│   │       ├── ProfileCard.tsx
│   │       ├── DataRow.tsx
│   │       ├── DiagnosticGridItem.tsx
│   │       ├── AutomationMatrixBlock.tsx
│   │       └── SidebarTab.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── endpoints.ts          # Centralized API endpoint definitions
│   │   │   ├── soapClient.ts         # SOAP request handlers
│   │   │   └── restClient.ts         # REST request handlers
│   │   ├── geminiService.ts          # AI analysis integration
│   │   └── parsers/
│   │       ├── hlrParser.ts          # HLR XML response parser
│   │       ├── hssParser.ts          # HSS XML response parser
│   │       ├── accountParser.ts      # Account details parser
│   │       └── cdrParser.ts          # CDR JSON parser
│   ├── utils/
│   │   ├── xmlFormatter.ts           # Pretty print XML
│   │   ├── dateFormatter.ts          # SDP timestamp parser
│   │   ├── normalizeArray.ts         # SOAP array normalization
│   │   └── validators.ts             # Input validation
│   ├── types/
│   │   ├── index.ts                  # Main type definitions
│   │   ├── api.ts                    # API request/response types
│   │   ├── subscriber.ts             # Subscriber profile types
│   │   └── cdr.ts                    # CDR record types
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── UserSupport/
│   │   │   ├── ChargingProfile.tsx
│   │   │   ├── BalanceAndCDR.tsx
│   │   │   └── DataBundle.tsx
│   │   ├── INSupport/
│   │   │   ├── DCLM.tsx
│   │   │   ├── ServiceDesk.tsx
│   │   │   ├── DSA.tsx
│   │   │   └── EnterpriseBusiness.tsx
│   ├── hooks/
│   │   ├── useApiCall.ts             # Generic API hook with loading/error
│   │   ├── useSubscriberData.ts      # Fetch HLR+HSS+Account data
│   │   ├── useCDRRecords.ts          # Fetch and filter CDR
│   │   └── useJobExecution.ts        # Batch job processing
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Navigation Architecture

### Main Menu Structure

```
Dashboard (/)
├─ Stats Overview, Recent Activity Log
User Support (/user-support)
├─ Charging Profile (/user-support/charging-profile)
│  ├─ Voice Profile Tab (AI analysis and resolution panel)
│  ├─ Browsing Profile Tab (AI analysis and resolution panel)
│  ├─ VoLTE Profile Tab (AI analysis and resolution panel)
│  └─ Offers Tab (AI analysis and resolution panel)
├─ Acc Balance and CDR Records (/user-support/balance-cdr)
│  ├─ MA and DA Balances Tab
│  ├─ Voice Record Tab
│  ├─ Data & DA Record Tab
│  ├─ SMS Record Tab
│  ├─ Credit & Recharge Record Tab
│  ├─ DA Adjustment Record Tab
│  └─ Other Record Tab
└─ Data Bundle Fulfilment (/user-support/data-bundle)
   └─ Coming Soon

IN Support (/in-support)
├─ IN-DCLM (/in-support/dclm)
│  └─ Batch Jobs (Resolve call Issues, Resolve credit limit issue)
├─ IN-Service Desk (/in-support/service-desk)
│  └─ Batch Profile Reset Jobs (Resolve call Issues, Resolve credit limit issue)
├─ IN-DSA (/in-support/dsa)
│  └─ Batch Final Response Jobs (Initiate sim reg, Get Sim Reg imsi, Automation Air Delete, Deact PostPaid Hub, Sim Reg Replayer, Bulk Sim Reg End, Swap Initialization, Swap IMSI Grabber, Swap Finalization)
└─ IN-Enterprise Business (/in-support/enterprise)
   ├─ Batch CUG ID Attachment Jobs (mapped from current system)
   └─ Batch Offer Attachment Jobs (mapped from current system)
```

---

## API Integration Strategy

### Standardized Endpoint Naming

```typescript
// services/api/endpoints.ts

export const API_ENDPOINTS = {
  // Subscriber Data Retrieval
  GET_HLR: '/soap/get-hlr',
  GET_HSS: '/soap/get-hss',
  GET_ACCOUNT_DETAILS: '/soap/get-account-details',
  GET_OFFERS: '/soap/get-offers',
  GET_CDR_RECORDS: '/api/get-cdr-records',
  
  // Voice Profile Actions
  RESET_CALL_PROFILE: '/soap/reset_call_profile',
  
  // Browsing Profile Actions
  RESET_APN_PHONE: '/soap/reset-apn-phone',
  RESET_APN_IOT: '/soap/reset-apn-iot',
  
  // VoLTE Actions
  ACTIVATE_VOLTE: '/soap/activate-volte',
  DEACTIVATE_VOLTE: '/soap/deactivate-volte',
  DELETE_VOLTE: '/soap/delete-volte',
  
  // Service Management
  SET_SERVICE_CLASS: '/soap/set-service-class',
  ADD_OFFER: '/soap/add-offer',
  
  // Data Bundle (Future)
  GET_CIS_STATUS: '/api/get-cis-status',
  GET_SCAPV2_STATUS: '/api/get-scapv2-status',
  GET_SDP_PAM: '/api/get-sdp-pam',
  
  // SOAP Transactions
  SEND_FAILURE_RESPONSE: '/soap/send-failure-response',
  SEND_SUCCESS_RESPONSE: '/soap/send-success-response',
  SEND_DSA_RESPONSE: '/soap/send-dsa-response',
  ACTIVATE_SPKA: '/soap/activate-spka',
  CREATE_AF_AIR: '/soap/create-af-air',
  
  // Batch Jobs (POST with file upload)
  BATCH_JOB: '/jobs/execute'
};
```

### Authentication Pattern

```typescript
const AUTH_CREDENTIALS = {
  username: 'Osazuwa',
  password: 'Osazuwa@123456'
};

// All authenticated requests include:
// ?username=${username}&password=${password}
```

---

## Data Flow Architecture

### 1. Charging Profile Page Flow

```
User Input (MSISDN)
    ↓
Parallel API Calls:
    ├─ GET_HLR        → Voice + Browsing (partial)
    ├─ GET_HSS        → Browsing (complete)
    ├─ GET_ACCOUNT_DETAILS → Offers
    └─ GET_VOLTE (conditional)
    ↓
Data Parsers:
    ├─ hlrParser.ts   → Voice profile data
    ├─ hssParser.ts   → Browsing EPS data
    ├─ accountParser.ts → Offers list
    └─ Merge HLR + HSS for Browsing tab
    ↓
Component State Update:
    ├─ VoiceProfileTab (renders)
    ├─ BrowsingProfileTab (renders)
    ├─ VoLTEProfileTab (renders)
    └─ OffersTab (renders)
    ↓
Action Buttons (enabled based on diagnostics):
    ├─ Voice: "Reset Call Profile"
    ├─ Browsing: "Reset Browsing - Phone", "Reset Browsing - IOT"
    └─ VoLTE: "Activate", "Deactivate", "Delete"
```

### 2. Balance and CDR Page Flow

```
User Input (MSISDN + Date Range)
    ↓
Parallel API Calls:
    ├─ GET_ACCOUNT_DETAILS → MA/DA Balances
    └─ GET_CDR_RECORDS → All CDR types
    ↓
Data Processing:
    ├─ accountParser.ts → Extract MA + DA array
    └─ cdrParser.ts → Categorize records by type
    ↓
Tab Rendering:
    ├─ MA/DA Balances Tab
    │   ├─ MA Balance (single row)
    │   └─ DA Balances Table (multiple rows)
    │
    ├─ Voice Record Tab
    │   ├─ Summary (total calls, duration, charged)
    │   └─ Filtered Table (column filters active)
    │
    ├─ Data & DA Record Tab
    │   ├─ Summary (total, per DA, filtered results)
    │   └─ Enhanced Table (bytes, DA details)
    │
    └─ SMS/Credit/DA Adj/Other Tabs
        ├─ Summary (aggregated stats)
        └─ Filtered Tables
```

### 3. Batch Job Flow (IN Support Pages)

```
User Selects Job Type
    ↓
File Upload Component
    ├─ CSV validation
    ├─ Preview first 10 rows
    └─ File size check
    ↓
API Call: POST /jobs/execute
    ├─ FormData with CSV file(s)
    └─ Job type identifier
    ↓
Backend Processing
    ↓
Progress Polling (optional)
    ↓
Result Download
    ├─ ZIP file with results
    └─ Summary statistics
```

---

## Component Architecture

### Core Reusable Components

#### 1. ProfileCard
```tsx
// Displays categorized subscriber data
<ProfileCard 
  label="Identity & Auth"
  icon={<User />}
  color="bg-blue-50 text-blue-600"
>
  <DataRow label="MSISDN" value={msisdn} />
  <DataRow label="IMSI" value={imsi} highlight />
</ProfileCard>
```

#### 2. CDRTable
```tsx
// Advanced table with column filtering
<CDRTable 
  data={records}
  columns={[
    { key: 'event_dt', label: 'Date/Time', filterable: true },
    { key: 'charged_amount', label: 'Charged', filterable: true }
  ]}
  onFilter={(filtered) => setFilteredData(filtered)}
/>
```

#### 3. DiagnosticGridItem
```tsx
// Action tiles for profile operations
<DiagnosticGridItem
  label="Reset Call Profile"
  icon={<Phone />}
  onClick={() => handleResetCallProfile(msisdn)}
  disabled={isProcessing}
/>
```

#### 4. AutomationMatrixBlock
```tsx
// Batch job selection cards
<AutomationMatrixBlock
  label="Reset Call Profile"
  filesNeeded={1}
  onClick={() => openJobModal('CALL_PROFILE')}
/>
```

---

## Batch Jobs Distribution (Current → New)

### IN-DCLM Page
```typescript
const DCLM_JOBS: JobType[] = [
  'JOB_INIT_SIM_REG',      // Initiate sim reg
  'JOB_GET_SIM_REG_IMSI',  // Get Sim Reg imsi
  'JOB_COMPLETE_SIM_REG'   // Bulk Sim Reg End
];
```

### IN-Service Desk Page
```typescript
const SERVICE_DESK_JOBS: JobType[] = [
  'JOB_CALL_PROFILE',       // Reset call Profile
  'JOB_CREDIT_LIMIT',      // Resolve credit limit issue
  'JOB_DELETE_AIR',        // Automation Air Delete
  'JOB_DEACT_POSTPAID'     // Deact PostPaid Hub
];
```

### IN-DSA Page
```typescript
const DSA_JOBS: JobType[] = [
  'JOB_REPLAY_SIM_REG'     // Sim Reg Replayer
];
```

### IN-Enterprise Business Page
```typescript
const ENTERPRISE_JOBS: JobType[] = [
  'JOB_INIT_SIM_SWAP',     // Swap Initialization
  'JOB_GET_SWAP_IMSI',     // Swap IMSI Grabber
  'JOB_COMPLETE_SIM_SWAP'  // Swap Finalization
];
```

---

## Type Definitions

### Core Types

```typescript
// types/subscriber.ts
export interface VoiceProfile {
  msisdn: string;
  imsi: string;
  msisdnState: string;
  authd: string;
  oick: string;
  csp: string;
  callBlocking: {
    baic: ServiceStatus;
    baoc: ServiceStatus;
    boic: ServiceStatus;
    bicro: ServiceStatus;
    boiexh: ServiceStatus;
  };
  callForwarding: {
    cfu: ServiceStatus;
    cfb: ServiceStatus;
    cfnrc: ServiceStatus;
    cfnry: ServiceStatus;
  };
  callWaiting: ServiceStatus;
  locationData: {
    vlrAddress: string;
    mscNumber: string;
    sgsnNumber: string;
  };
  smsSpam: string;
}

export interface BrowsingProfile {
  gprs: {
    pdpid: string;
    apnid: string;
    pdpty: string;
  };
  hss: {
    epsProfileId: string;
    epsRoamingAllowed: boolean;
    epsIndividualDefaultContextId: string;
    epsUserIpV4Address: string;
  };
}

export interface ServiceStatus {
  provisionState: number;
  ts10?: { activationState: number };
  ts20?: { activationState: number };
  ts60?: { activationState: number };
  bs20?: { activationState: number };
  bs30?: { activationState: number };
}
```

```typescript
// types/cdr.ts
export interface CDRRecord {
  record_type: string;
  number_called: string;
  event_dt: number;  // YYYYMMDDHHMMSS
  call_duration_qty: string;
  charged_amount: string;
  balance_after_amt: string;
  balance_before_amt: string;
  da_amount: string;
  da_details: DADetail[];
  country: string;
  operator: string;
  bytes_received_qty: number;
  bytes_sent_qty: number;
}

export interface DADetail {
  account_id: string;
  amount_before: number;
  amount_after: number;
  amount_charged: number;
}

export interface CDRSummary {
  totalTransactions: number;
  startingBalance: number;
  endingBalance: number;
  totalCharged: number;
  totalDuration?: number;
  totalData?: number;
}
```

---

## Parser Implementation Strategy

### HLR Parser
```typescript
// services/parsers/hlrParser.ts
export function parseHLRResponse(xml: string): VoiceProfile {
  // Extract from <getResponseSubscription> node
  // Handle call blocking: baic, baoc, boic, bicro, boiexh
  // Handle call forwarding: cfu, cfb, cfnrc, cfnry, dcf
  // Handle call waiting: caw
  // Extract location data
  return voiceProfile;
}
```

### HSS Parser
```typescript
// services/parsers/hssParser.ts
export function parseHSSResponse(xml: string): HSSData {
  // Extract from <GetResponseEPSMultiSC> node
  // Get epsProfileId, epsRoamingAllowed, etc.
  return hssData;
}
```

### CDR Parser
```typescript
// services/parsers/cdrParser.ts
export function parseCDRRecords(json: string): {
  records: CDRRecord[];
  categorized: {
    voice: CDRRecord[];
    data: CDRRecord[];
    sms: CDRRecord[];
    credit: CDRRecord[];
    daAdjustment: CDRRecord[];
    other: CDRRecord[];
  };
  summary: CDRSummary;
} {
  // Parse JSON response
  // Categorize by record_type
  // Calculate summaries per category
  return { records, categorized, summary };
}
```

---

## Page-Specific Features

### Charging Profile Page

**Input Requirements:**
- MSISDN (mandatory)

**API Calls:**
1. `GET_HLR` → Voice + partial Browsing
2. `GET_HSS` → Complete Browsing EPS data
3. `GET_ACCOUNT_DETAILS` → Offers
4. `GET_VOLTE` (if VoLTE tab selected)

**Tabs:**
1. **Voice Profile**
   - Display: MSISDN, IMSI, State, Auth, CSP, Call Blocking, Call Forwarding, Call Waiting, Location
   - Actions: "Resolve Call Issues", "Reset CSP"
   - Resolution Notes: Auto-generated based on service states

2. **Browsing Profile**
   - Display: GPRS (PDP ID, APN ID, PDP Type), HSS EPS Profile, Roaming Status, IP Address
   - Actions: "Reset Browsing - Phone", "Reset Browsing - IOT"
   - Resolution Notes: APN configuration status

3. **VoLTE Profile**
   - Display: Activation Status, Anonymous Condition, Unconditional Condition
   - Actions: "Activate VoLTE", "Deactivate VoLTE", "Delete VoLTE"
   - Resolution Notes: Service readiness

4. **Offers**
   - Display: Table (Offer ID, Type, Start Date, Expiry Date)
   - Resolution Notes: Active vs expired offers
   - No actions (read-only)

### Balance and CDR Page

**Input Requirements:**
- MSISDN (mandatory)
- Date Range (start date, end date)

**API Calls:**
1. `GET_ACCOUNT_DETAILS` → MA/DA balances
2. `GET_CDR_RECORDS` → All record types

**Tabs:**
1. **MA and DA Balances**
   - Summary: Total MA, Total DA count, Combined balance
   - MA Balance: Single row (Account Value, Service Class)
   - DA Balances Table: Columns (DA ID, DA Balance, DA Name, Expiry Date)

2. **Voice Record**
   - Summary: Total Calls, Total Duration, Total Charged, Avg Call Length
   - Table: Date/Time, Number Called, Duration, Charged Amount, Balance Before, Balance After, Country, Operator
   - Column Filters: Under each header

3. **Data & DA Record**
   - Summary: Total Transactions, Starting Balance, Ending Balance, Total Used (GB), Total Charged
   - Summary Per DA: Breakdown by DA ID
   - Summary Based on Filtered Results: Updates dynamically
   - Table: Date/Time, Number Called, Charged Amount, Balance Before/After, DA ID, DA Description, DA Before (GB), DA After (GB), DA Charged (GB), Bytes RX, Bytes TX, Country, Operator

4. **SMS Record**
   - Summary: Total SMS, Total Charged
   - Table: Date/Time, Number Called, Charged Amount, Balance Before, Balance After, Country, Operator

5. **Credit & Recharge Record**
   - Summary: Total Recharges, Total Amount
   - Table: Date/Time, Number Called, Charged Amount, Balance Before, Balance After, Country, Operator

6. **DA Adjustment Record**
   - Summary: Total Adjustments, Net Change
   - Table: Date/Time, Number Called, Charged Amount, Balance Before, Balance After, Country, Operator

7. **Other Record**
   - Summary: Total Transactions, Total Charged
   - Table: Date/Time, Number Called, Charged Amount, Balance Before, Balance After, Country, Operator

---

## State Management Strategy

### Dashboard State
```typescript
const [operationalHistory, setOperationalHistory] = useState<ResolvedIssue[]>([]);
const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);
```

### Charging Profile State
```typescript
const [msisdn, setMsisdn] = useState('');
const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
const [browsingProfile, setBrowsingProfile] = useState<BrowsingProfile | null>(null);
const [volteProfile, setVolteProfile] = useState<VoLTEProfile | null>(null);
const [offers, setOffers] = useState<Offer[]>([]);
const [activeTab, setActiveTab] = useState<'voice' | 'browsing' | 'volte' | 'offers'>('voice');
const [isLoading, setIsLoading] = useState(false);
```

### Balance/CDR State
```typescript
const [msisdn, setMsisdn] = useState('');
const [dateRange, setDateRange] = useState({ start: '', end: '' });
const [balances, setBalances] = useState<Balances | null>(null);
const [cdrRecords, setCdrRecords] = useState<CategorizedCDR | null>(null);
const [activeTab, setActiveTab] = useState<CDRTabType>('balance');
const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
```

---

## Error Handling & UX

### Toast Notifications
```typescript
// Success: Green toast, auto-dismiss in 6s
setSuccessToast("VoLTE activated successfully");

// Error: Red toast, auto-dismiss in 6s
setErrorToast("Failed to resolve call issue: Network timeout");

// Processing: Yellow toast with loader
setProcessingToast("Executing batch job...");
```

### Loading States
- Spinner overlay during API calls
- Skeleton loaders for table rows
- Disabled buttons during processing

### Validation
- MSISDN: 13 digits starting with 234
- Date Range: Start date < End date
- CSV Files: Max 10MB, valid headers

---

## AI Integration (Gemini)

### Location
Dashboard page - right sidebar panel

### Function
```typescript
// services/geminiService.ts
export async function analyzeOperationalHistory(
  history: ResolvedIssue[]
): Promise<{
  summary: string;
  suggestions: string[];
}> {
  // Send last 10 operations to Gemini
  // Request JSON response with summary + 3 suggestions
  // Fallback to manual analysis if API fails
}
```

### Trigger
- Auto-run on dashboard load
- Manual refresh button
- Re-run every 10 new operations

---

---

## Performance Optimization

### API Call Optimization
- **Parallel Requests**: HLR + HSS + Account Details called simultaneously
- **Request Caching**: Cache subscriber data for 2 minutes (Do not cache CDR record details)
- **Debounced Search**: MSISDN input debounced by 500ms

### Rendering Optimization
- **Virtual Scrolling**: For CDR tables with 1000+ rows
- **Lazy Tab Loading**: Only fetch VoLTE data when tab is clicked
- **Memoization**: `useMemo` for CDR summary calculations

### Bundle Size
- Code splitting by route
- Lazy load batch job components
- Tree-shake unused Lucide icons

---

## Security Considerations

### Authentication
- Hardcoded credentials for MVP
- Future: JWT token-based auth
- Session timeout: 30 minutes

### API Security
- HTTPS only in production
- CORS whitelist backend domain
- Sanitize XML input before replay

### Data Privacy
- No MSISDN logging in browser console
- Clear sensitive data on logout
- Mask partial IMSI in logs

---

## Testing Strategy

### Mockup Data
- Preload mockup data to populate pages for viewing

---

## Deployment Architecture

### Development
```
# Rebuild the app
npm run build
# Transfer new dist folder to server
scp -r dist/ user@server:/path/to/app/
# Serve with Python
python3 serve_py36.py
```


### Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_GEMINI_API_KEY=AIzaSy...
```