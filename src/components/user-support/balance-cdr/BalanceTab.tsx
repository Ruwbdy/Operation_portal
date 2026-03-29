import React from 'react';
import { Wallet } from 'lucide-react';
import { formatTelecomDate } from '../../../utils/dateFormatter';
import type { Balance, DedicatedAccount } from '../../../types';
import { formatDAAmount, getDADescription } from '../../../services/da/da.mapping';

interface BalanceTabProps { balance: Balance; dabalances: DedicatedAccount[] }

export default function BalanceTab({ balance, dabalances }: BalanceTabProps) {
  const totalMA = balance.accountValue1 / 100;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
        <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
          <div className="bg-green-500 p-3 rounded-xl"><Wallet size={20} className="text-white" /></div>
          <div>
            <h3 className="text-sm font-black text-black uppercase tracking-wide">Main Account Balance</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">MSISDN: {balance.subscriberNumber}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-2">Account Value</p>
            <p className="text-2xl font-black text-black italic">₦{totalMA.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-2">Service Class</p>
            <p className="text-2xl font-black text-[#FFCC00] italic">{balance.serviceClassCurrent}</p>
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-2">Currency</p>
            <p className="text-2xl font-black text-gray-600 italic">{balance.currency1}</p>
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-2">Expiry Date</p>
            <p className="text-sm font-black text-gray-600">{formatTelecomDate(balance.expiryDate)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100"><h3 className="text-sm font-black text-black uppercase tracking-wide">Dedicated Accounts (DA)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              {['DA ID', 'Description', 'DA Balance', 'Active Value', 'Unit Type', 'Start Date', 'Expiry Date'].map(h => (
                <th key={h} className="px-8 py-4 text-left"><span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{h}</span></th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {dabalances.map((da, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5"><span className="text-sm font-black text-[#FFCC00]">{da.dedicatedAccountID}</span></td>
                  <td className="px-8 py-5"><span className="text-sm font-bold text-gray-700">{da.description || getDADescription(da.dedicatedAccountID)}</span></td>
                  <td className="px-8 py-5"><span className="text-sm font-bold text-black">{formatDAAmount(da.dedicatedAccountID, da.dedicatedAccountValue1 / 100)}</span></td>
                  <td className="px-8 py-5"><span className="text-sm font-bold text-gray-600">{formatDAAmount(da.dedicatedAccountID, (da.dedicatedAccountActiveValue1 ?? 0) / 100)}</span></td>
                  <td className="px-8 py-5"><span className="text-xs font-bold text-gray-600">{da.dedicatedAccountUnitType === 1 ? 'Currency' : `Type ${da.dedicatedAccountUnitType}`}</span></td>
                  <td className="px-8 py-5"><span className="text-xs font-bold text-gray-600">{formatTelecomDate(da.startDate || 'N/A')}</span></td>
                  <td className="px-8 py-5"><span className="text-xs font-bold text-gray-600">{formatTelecomDate(da.expiryDate)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}