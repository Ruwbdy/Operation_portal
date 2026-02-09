# Step 1: Architecture & Directory Structure

## Tech Stack
- **Framework**: Vite + React 18
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API + useState
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Form Handling**: React Hook Form
- **Date Picker**: react-datepicker
- **XML Parsing**: fast-xml-parser

## Directory Structure

```
mtn-in-operational-center/
├── public/
├── src/
│   ├── api/
│   │   ├── client.js                 # Axios instance
│   │   └── endpoints.js              # API endpoint functions
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ComingSoon.jsx
│   │   ├── charging-profile/
│   │   │   ├── ChargingProfile.jsx
│   │   │   ├── VoiceProfile.jsx
│   │   │   ├── BrowsingProfile.jsx
│   │   │   ├── VolteProfile.jsx
│   │   │   └── Offers.jsx
│   │   ├── account-balance/
│   │   │   ├── AccountBalance.jsx
│   │   │   ├── BalanceTab.jsx
│   │   │   └── RecordTable.jsx
│   │   └── ui/                       # shadcn components
│   │       ├── button.jsx
│   │       ├── input.jsx
│   │       ├── tabs.jsx
│   │       ├── table.jsx
│   │       └── card.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   ├── hooks/
│   │   ├── useApiCall.js
│   │   └── useTableFilter.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ChargingSystem.jsx
│   │   ├── DataBundleFulfilment.jsx
│   │   └── InSupport.jsx
│   ├── utils/
│   │   ├── xmlParser.js              # XML response parsers
│   │   ├── dataMappers.js            # Map API data to UI format
│   │   └── validators.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## Component Architecture

### Data Flow
```
User Input (MSISDN) 
  → API Call (via hooks)
  → XML/JSON Parser
  → Data Mapper
  → Component State
  → UI Render (Tabs/Tables)
```

### Key Patterns
1. **Custom Hooks**: `useApiCall` for API requests with loading/error states
2. **Data Mappers**: Separate functions to extract data from XML/JSON responses
3. **Reusable Components**: Table with built-in filtering, action buttons
4. **Context**: Global state for user session (future auth)

## API Integration Strategy

### Parsers (utils/xmlParser.js)
```javascript
parseAccountDetails(xmlString)    → { ma, das, offers }
parseHlrResponse(xmlString)       → { voice, browsing, callServices }
parseHssResponse(xmlString)       → { browsing, location }
parseVolteResponse(xmlString)     → { activated, conditions }
parseCdrRecords(jsonString)       → { records, summary }
```

### Mappers (utils/dataMappers.js)
```javascript
mapVoiceProfile(hlrData)          → Voice tab data
mapBrowsingProfile(hlr, hss)      → Browsing tab data
mapVolteProfile(volteData)        → VoLTE tab data
mapOffers(accountData)            → Offers tab data
mapBalances(accountData)          → MA/DA balances
mapCdrRecords(cdrData, type)      → Filtered CDR records
```

## Route Structure
```
/ → Login (placeholder)
/dashboard → Main dashboard
/charging-system
  ├── /profile → Charging Profile
  ├── /balance → Account Balance & CDR
  └── /bundle → Data Bundle (Coming Soon)
/in-support
  ├── /dclm → DCLM (Coming Soon)
  ├── /service-desk → Service Desk (Coming Soon)
  ├── /dsa → DSA (Coming Soon)
  └── /enterprise → Enterprise Business (Coming Soon)
```