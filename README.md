# MTN IN Operations Portal - Redesigned

Complete redesign implementing modular architecture with React Router v7, TypeScript, and Tailwind CSS.

## Structure
```
src/
├── types/          # TypeScript definitions
├── services/       # API clients & mock data
├── components/     # Reusable UI components
├── pages/          # Route pages
└── hooks/          # Custom hooks (to be implemented)
```

## Installation
```bash
npm install
npm run dev
```

## Features Implemented
✅ Multi-page routing structure
✅ Sidebar navigation
✅ Dashboard overview
✅ Mock data support
✅ Type system foundation
✅ API service layer
✅ Tailwind styling

## Next Steps
1. Implement remaining page components
2. Add parsers for XML/JSON responses
3. Create custom hooks for data fetching
4. Add CDR table with filtering
5. Implement batch job uploads
6. Connect real API endpoints

## Routes
- `/` - Dashboard
- `/user-support/charging-profile` - Voice/Browsing/VoLTE/Offers
- `/user-support/balance-cdr` - Balances & CDR Records
- `/user-support/data-bundle` - Data bundle management
- `/in-support/dclm` - DCLM batch jobs
- `/in-support/service-desk` - Service desk operations
- `/in-support/dsa` - DSA operations
- `/in-support/enterprise` - Enterprise business

## Mock Data Available
- Voice Profile (HLR)
- Browsing Profile (HSS)
- Account Details
- CDR Records
- VoLTE Profile

See `src/services/api/mockData.ts`
