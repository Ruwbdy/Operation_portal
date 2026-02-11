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
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── PlaceholderPage.tsx
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
│   │   └── ui/
│   │       ├── ProfileCard.tsx
│   │       ├── DataRow.tsx
│   ├── services/
│   │   ├── endpoints.ts          # Centralized API endpoint definitions
            api.ts
            apiTransformer.ts
            geminiService.ts          # AI analysis integration
            cdrParser.ts          # CDR JSON parser
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
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

# Quick Reference: File Changes

## 📁 File Structure

```
src/
├── services/
│   ├── api.ts                    ✅ UPDATED - API functions with transformers
│   ├── apiTransformers.ts        ⭐ NEW - Data transformation utilities
│   └── endpoints.ts              ✅ UPDATED - API endpoints configuration
│
├── pages/user-support/
│   ├── ChargingProfile.tsx       ✅ UPDATED - Uses fetchChargingProfile()
│   └── BalanceAndCDR.tsx         ✅ UPDATED - Uses fetchDataProfile()
│
└── components/user-support/
    ├── charging-profile/
    │   ├── VoiceProfileTab.tsx   ✅ UPDATED - Uses resetCallProfile()
    │   ├── BrowsingProfileTab.tsx ✅ UPDATED - Uses resetAPN()
    │   └── VoLTEProfileTab.tsx   ✅ UPDATED - Uses VoLTE actions
    │
    └── balance-cdr/
        ├── BalanceTab.tsx         ✓ No changes needed
        ├── CDRTable.tsx           ✓ No changes needed
        └── CDRSummary.tsx         ✓ No changes needed
```

## 🔄 What Changed

### Before (Mock Data)
```typescript
// ChargingProfile.tsx
import { MOCK_VOICE_PROFILE, MOCK_BROWSING_PROFILE, ... } from '../../data/mockData';

const handleSearch = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  setVoiceProfile(MOCK_VOICE_PROFILE);
  setBrowsingProfile(MOCK_BROWSING_PROFILE);
  ...
};
```

### After (Real API)
```typescript
// ChargingProfile.tsx
import { fetchChargingProfile } from '../../services/api';

const handleSearch = async () => {
  const response = await fetchChargingProfile(msisdn);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message);
  }
  setVoiceProfile(response.data.voice || null);
  setBrowsingProfile(response.data.browsing || null);
  ...
};
```

## 🔗 API Call Flow

### Charging Profile
```
User enters MSISDN → ChargingProfile.handleSearch()
    ↓
api.fetchChargingProfile(msisdn)
    ↓
fetch("http://localhost:9041/get-charging-profile?...")
    ↓
Raw Backend Response (deeply nested)
    ↓
apiTransformers.transformHLRToVoiceProfile()
apiTransformers.transformHSSToBrowsingProfile()
apiTransformers.transformToVoLTEProfile()
apiTransformers.transformOffers()
    ↓
Clean TypeScript Objects
    ↓
Component setState()
    ↓
Tabs render with data
```

### Balance & CDR
```
User enters MSISDN + Dates → BalanceAndCDR.handleSearch()
    ↓
Date format conversion (YYYY-MM-DD → YYYYMMDD)
    ↓
api.fetchDataProfile(msisdn, startDate, endDate)
    ↓
fetch("http://localhost:9041/get-data-profile?...")
    ↓
Raw Backend Response
    ↓
apiTransformers.transformBalances()
Extract cdrRecords.records array
    ↓
parseCDRRecords() - categorize by type
    ↓
Component setState()
    ↓
Balance tab + CDR tabs render
```

## 🎯 Key Transformer Functions

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `transformHLRToVoiceProfile()` | `hlrProfile.moAttributes.getResponseSubscription` | `VoiceProfile` | Extract voice data |
| `transformHSSToBrowsingProfile()` | `hssProfile` + `hlrProfile.gprs` | `BrowsingProfile` | Combine browsing data |
| `transformToVoLTEProfile()` | `volteProfile.moAttributes.getResponseSubscription` | `VoLTEProfile` | Simplify VoLTE structure |
| `transformOffers()` | `accountDetails.offerInformation` | `Offer[]` | Extract offer array |
| `transformBalances()` | `accountDetails` | `Balances` | Extract balances + DAs |
| `extractDiagnostics()` | `diagnostics` object | Diagnostic array | Flatten diagnostics |

## 📊 Response Structure Mapping

### Backend → Frontend

```typescript
// Backend returns this:
{
  hlrProfile: { moAttributes: { getResponseSubscription: {...} } },
  hssProfile: { moAttributes: { getResponseEPSMultiSC: {...} } },
  volteProfile: { moAttributes: { getResponseSubscription: {...} } },
  accountDetails: { moAttributes: { getAccountDetailResponse: {...} } },
  diagnostics: { browsingDiagnostics: {...}, ... }
}

// Transformers convert to this:
{
  voice: VoiceProfile,      // from hlrProfile
  browsing: BrowsingProfile, // from hssProfile + hlrProfile.gprs
  volte: VoLTEProfile,       // from volteProfile
  offers: Offer[],           // from accountDetails.offerInformation
  diagnostics: any[]         // from diagnostics (flattened)
}
```

## 🧪 Testing Commands

```bash
# 1. Charging Profile
curl "http://localhost:9041/get-charging-profile?username=Osazuwa&password=Osazuwa@123456&msisdn=2348035890445"

# 2. Data Profile
curl "http://localhost:9041/get-data-profile?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026931&startDate=20260210&endDate=20260210"

# 3. Reset Call Profile
curl "http://localhost:9041/reset-call-profile?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026930"

# 4. Reset APN (Phone)
curl "http://localhost:9041/reset-apn?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026930&isIOT=false"

# 5. Activate VoLTE
curl "http://localhost:9041/activate-volte?username=Osazuwa&password=Osazuwa@123456&msisdn=2348035890445"
```

## ⚠️ Important Notes

1. **All mock data removed** - No fallback to mock data anymore
2. **CORS must be enabled** on backend for `http://localhost:5173`
3. **Date format conversion** happens automatically in BalanceAndCDR
4. **Error handling** shows user-friendly messages via toasts
5. **Loading states** prevent multiple simultaneous requests
6. **Null safety** - Transformers handle missing/null data gracefully

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS error | Configure backend to allow localhost:5173 |
| Data not showing | Check browser console & Network tab |
| Wrong data format | Verify transformer paths match actual response |
| Action buttons fail | Check msisdn prop passed to child components |
| CDR not loading | Verify date format is YYYYMMDD in request |

## 📦 Files to Deploy

When deploying, ensure these files are included:
- ✅ `api.ts`
- ✅ `apiTransformers.ts`
- ✅ `endpoints.ts`
- ✅ `ChargingProfile.tsx`
- ✅ `BalanceAndCDR.tsx`
- ✅ `VoiceProfileTab.tsx`
- ✅ `BrowsingProfileTab.tsx`
- ✅ `VoLTEProfileTab.tsx`

## 🚀 Running the App

```bash
# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Open browser to
http://localhost:5173
```


# API Integration Complete Guide

## ✅ Implementation Status: COMPLETE

All mock data has been removed and the application now fully integrates with your backend API using proper data transformers.

## 📁 Updated Files

### Core Files
1. **`endpoints.ts`** - Updated API base URL and endpoints
2. **`api.ts`** - Main API functions with transformer integration
3. **`apiTransformers.ts`** - NEW! Data transformation utilities
4. **`ChargingProfile.tsx`** - Integrated charging profile API
5. **`BalanceAndCDR.tsx`** - Integrated data profile API
6. **`VoiceProfileTab.tsx`** - Integrated reset call profile action
7. **`BrowsingProfileTab.tsx`** - Integrated reset APN actions
8. **`VoLTEProfileTab.tsx`** - Integrated VoLTE actions

---

## 🔄 API Response Structure & Transformers

Your backend returns deeply nested structures that differ from the frontend TypeScript interfaces. We've created transformer functions to bridge this gap.

### GET /get-charging-profile

**Backend Response Structure:**
```json
{
  "hlrProfile": {
    "moAttributes": {
      "getResponseSubscription": {
        "msisdn": "234...",
        "imsi": "621...",
        "csp": 44,
        "baic": { "provisionState": 1, "ts20": {...} },
        "gprs": { "pdpid": 1, "apnid": 25, ... },
        ...
      }
    }
  },
  "hssProfile": {
    "moAttributes": {
      "getResponseEPSMultiSC": {
        "epsProfileId": 10,
        "epsRoamingAllowed": true,
        "mmeAddress": "...",
        ...
      }
    }
  },
  "volteProfile": {
    "moAttributes": {
      "getResponseSubscription": {
        "publicId": "sip:+234...",
        "services": {
          "communicationDiversion": {...},
          ...
        }
      }
    }
  },
  "accountDetails": {
    "moAttributes": {
      "getAccountDetailResponse": {
        "accountDetails": {
          "offerInformation": [...]
        },
        "balanceAndDate": {...}
      }
    }
  },
  "diagnostics": {
    "browsingDiagnostics": {...},
    "voiceDiagnostics": {...},
    "offerDiagnostics": {...}
  }
}
```

**Transformers Applied:**
1. `transformHLRToVoiceProfile()` - Extracts voice profile from hlrProfile
2. `transformHSSToBrowsingProfile()` - Combines HSS and HLR GPRS data
3. `transformToVoLTEProfile()` - Simplifies complex VoLTE nested structure
4. `transformOffers()` - Extracts offer array from account details
5. `extractDiagnostics()` - Flattens diagnostic categories

**Frontend Receives:**
```typescript
{
  voice: VoiceProfile,
  browsing: BrowsingProfile,
  volte: VoLTEProfile,
  offers: Offer[],
  diagnostics: any[]
}
```

---

### GET /get-data-profile

**Backend Response Structure:**
```json
{
  "accountDetails": {
    "moAttributes": {
      "getAccountDetailResponse": {
        "subscriberNumber": "234...",
        "balanceAndDate": {
          "serviceClassCurrent": 98,
          "currency1": "NGN",
          "accountValue1": 4840
        },
        "dedicatedAccountInformation": [...]
      }
    }
  },
  "cdrRecords": {
    "msisdn": "234...",
    "startDate": "20260210",
    "endDate": "20260210",
    "totalRecords": 122,
    "records": [
      {
        "record_type": "DATA",
        "number_called": "INTERNET",
        "event_dt": 20260210204927,
        "charged_amount": "27.963000",
        "da_details": [...],
        ...
      }
    ]
  }
}
```

**Transformers Applied:**
1. `transformBalances()` - Extracts balances and DA accounts
2. Direct extraction of `cdrRecords.records` array

**Frontend Receives:**
```typescript
{
  balances: Balances,
  cdrRecords: CDRRecord[]
}
```

---

### Action Endpoint Responses

**GET /reset-call-profile**
Returns diagnostic object with action results:
```json
{
  "csp": { "action": "No action needed", "passed": true },
  "dcf": { "action": "No action needed", "passed": true },
  "ts21": { "action": "No action needed", "passed": true },
  ...
}
```

The API function checks for any failed actions and throws an error if found.

---

## 📦 Transformer Functions Detail

### 1. transformHLRToVoiceProfile()
**Purpose:** Converts HLR response to VoiceProfile interface

**Key Mappings:**
- `hlrProfile.moAttributes.getResponseSubscription` → Root data
- `msisdnstate` → `msisdnState` (capitalization fix)
- Numeric fields converted to strings (oick, csp)
- Call blocking/forwarding services mapped directly
- Location data nested structure preserved

**Edge Cases Handled:**
- Missing optional fields get defaults
- Null values for ts20 in call forwarding
- Missing dcf service

---

### 2. transformHSSToBrowsingProfile()
**Purpose:** Combines HSS and HLR data for complete browsing profile

**Data Sources:**
- **GPRS config:** From `hlrProfile.moAttributes.getResponseSubscription.gprs`
- **HSS config:** From `hssProfile.moAttributes.getResponseEPSMultiSC`

**Key Mappings:**
- Numeric IDs converted to strings
- IP address and MME address preserved
- Roaming flags extracted

---

### 3. transformToVoLTEProfile()
**Purpose:** Simplifies complex nested VoLTE service structure

**Complexity Handled:**
- Extracts from `volteProfile.moAttributes.getResponseSubscription.services`
- Maps communication diversion rules to condition states
- Converts ruleDeactivated flags to activated/deactivated strings
- Handles missing rules gracefully

**Rule Mappings:**
- `cfb` → busyCondition
- `cfnr` → noAnswerCondition
- `cfnrc` → notReachableCondition
- `cfnl` → notRegisteredCondition
- `cfu2` → unconditionalCondition

---

### 4. transformOffers()
**Purpose:** Extract and normalize offer array

**Path:** `accountDetails.moAttributes.getAccountDetailResponse.accountDetails.offerInformation`

**Transformations:**
- String offerID → Number
- Date strings preserved
- Invalid data filtered out

---

### 5. transformBalances()
**Purpose:** Extract balance and DA information

**Paths:**
- Main balance: `balanceAndDate` or `accountDetails.balanceAndDate`
- DAs: `dedicatedAccountInformation` array

**Transformations:**
- Numeric DA IDs → Strings
- Missing DA fields get undefined
- Currency defaults to NGN if missing

---

### 6. extractDiagnostics()
**Purpose:** Flatten diagnostic categories into array

**Categories:**
- browsingDiagnostics
- voiceDiagnostics
- offerDiagnostics

**Output Format:**
```typescript
[
  { category: 'browsing', key: 'apn', message: 'Customer is on commercial APN 25' },
  { category: 'voice', key: 'volteCustomer', message: 'VoLTE service activated' }
]
```

---

## 🔧 Error Handling

### API Level
All API functions wrap fetch in try-catch and return standardized response:
```typescript
{
  success: boolean,
  data?: T,
  error?: { message: string, code: number }
}
```

### Transform Level
Transformers handle missing data gracefully:
- Return `null` if critical data missing
- Provide defaults for optional fields
- Filter out invalid array items

### Component Level
Components check response.success before using data:
```typescript
if (!response.success || !response.data) {
  throw new Error(response.error?.message || 'Failed to fetch');
}
```

---

## 🚀 Testing Guide

### 1. Test Charging Profile
```bash
curl "http://localhost:9041/get-charging-profile?username=Osazuwa&password=Osazuwa@123456&msisdn=2348035890445"
```

**Expected Frontend Behavior:**
- Voice tab shows MSISDN, IMSI, CSP, call blocking/forwarding states
- Browsing tab shows GPRS config and HSS location
- VoLTE tab shows public ID and call diversion conditions
- Offers tab displays all active offers with dates

### 2. Test Data Profile
```bash
curl "http://localhost:9041/get-data-profile?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026931&startDate=20260210&endDate=20260210"
```

**Expected Frontend Behavior:**
- Balance tab shows MA balance and DA accounts table
- CDR tabs categorize records by type (Voice, Data, SMS, etc.)
- Each tab shows summary stats and detailed table
- Data records show bytes transferred

### 3. Test Reset Call Profile
```bash
curl "http://localhost:9041/reset-call-profile?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026930"
```

**Expected Frontend Behavior:**
- Success toast if all diagnostics passed
- Error toast with details if any action failed
- Loading state during API call

### 4. Test Reset APN
```bash
# Phone APN
curl "http://localhost:9041/reset-apn?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026930&isIOT=false"

# IoT APN
curl "http://localhost:9041/reset-apn?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026930&isIOT=true"
```

### 5. Test VoLTE Actions
```bash
# Activate
curl "http://localhost:9041/activate-volte?username=Osazuwa&password=Osazuwa@123456&msisdn=2348035890445"

# Deactivate
curl "http://localhost:9041/deactivate-volte?username=Osazuwa&password=Osazuwa@123456&msisdn=2347062026931"

# Delete
curl "http://localhost:9041/delete-volte?username=Osazuwa&password=Osazuwa@123456&msisdn=2348035890445"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Symptom:** Browser console shows CORS policy errors

**Solution:** Ensure backend allows origin `http://localhost:5173` (or your dev server port)
```java
// Spring Boot example
@CrossOrigin(origins = "http://localhost:5173")
```

### Issue 2: Null/Undefined Data in UI
**Symptom:** Components show "undefined" or blank fields

**Root Cause:** Backend response structure doesn't match expected paths

**Debug Steps:**
1. Check browser Network tab for actual response
2. Add console.log in transformers to see raw data
3. Verify path in transformer matches actual structure

### Issue 3: Date Format Mismatch
**Symptom:** CDR search fails or returns no data

**Root Cause:** Frontend sends YYYY-MM-DD but backend expects YYYYMMDD

**Solution:** Already handled in `BalanceAndCDR.tsx` line 42-43
```typescript
const formattedStartDate = startDate.replace(/-/g, '');
const formattedEndDate = endDate.replace(/-/g, '');
```

### Issue 4: Action Buttons Don't Work
**Symptom:** Clicking reset/activate buttons shows error

**Possible Causes:**
1. msisdn prop not passed to child component
2. Backend endpoint returning unexpected format
3. Network error

**Debug Steps:**
1. Check console for error messages
2. Verify msisdn prop in React DevTools
3. Test endpoint directly with curl

---

## 📊 Data Flow Diagram

```
User Action (Search/Reset/Activate)
        ↓
Component Event Handler
        ↓
API Function (api.ts)
        ↓
HTTP GET Request → Backend
        ↓
Raw JSON Response
        ↓
Transformer Functions (apiTransformers.ts)
        ↓
TypeScript Interface Objects
        ↓
Component State Update
        ↓
UI Re-render with Data
```

---

## 🔐 Security Notes

1. **Credentials:** Currently hardcoded in `AUTH_CREDENTIALS`. For production:
   - Move to environment variables
   - Implement proper authentication flow
   - Use token-based auth instead of username/password in URL

2. **HTTPS:** Use HTTPS in production for API calls

3. **Input Validation:** MSISDN validation happens before API calls

---

## 📝 Environment Configuration

Create `.env` file to override defaults:
```env
VITE_API_BASE_URL=http://localhost:9041
VITE_API_USERNAME=Osazuwa
VITE_API_PASSWORD=Osazuwa@123456
```

Update `api.ts` to read from env:
```typescript
export const AUTH_CREDENTIALS = {
  username: import.meta.env.VITE_API_USERNAME || 'Osazuwa',
  password: import.meta.env.VITE_API_PASSWORD || 'Osazuwa@123456'
};
```

---

## ✅ Checklist

- [x] Mock data removed from all components
- [x] API endpoints configured
- [x] Data transformers created
- [x] Charging profile API integrated
- [x] Data profile API integrated
- [x] Action APIs integrated (reset, activate, deactivate, delete)
- [x] Error handling implemented
- [x] Loading states maintained
- [x] Toast notifications working
- [ ] **Backend CORS configured** (your responsibility)
- [ ] **API endpoints tested** (your responsibility)
- [ ] **Production environment variables** (future task)

---

## 🎯 Next Steps

1. **Start your backend server** on port 9041
2. **Test each endpoint** using the curl commands above
3. **Start frontend dev server**: `npm run dev`
4. **Test in browser**:
   - Search for a subscriber in Charging Profile
   - Search for CDR records in Balance & CDR
   - Try action buttons (Reset, Activate, etc.)
5. **Monitor browser console** for any errors
6. **Check Network tab** to see actual API requests/responses

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Network tab for failed requests
3. Compare actual API response with expected structure in this document
4. Verify transformer paths match your actual response structure

The transformers are designed to be flexible and handle missing data, but if your API structure differs significantly, you may need to adjust the paths in `apiTransformers.ts`.



