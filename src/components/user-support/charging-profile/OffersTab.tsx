import React from 'react';
import { Gift, Calendar, Clock } from 'lucide-react';
import { formatTelecomDate } from '../../../utils/dateFormatter';
import type { Offer } from '../../../services/data_interface';

interface OffersTabProps {
  offers: Offer[];
}

export default function OffersTab({ offers }: OffersTabProps) {
  const activeOffers = offers.filter(o => !o.expiryDate.startsWith('9999'));
  const permanentOffers = offers.filter(o => o.expiryDate.startsWith('9999'));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-[2rem] border-2 border-blue-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-500 p-2.5 rounded-xl">
              <Gift size={20} className="text-white" />
            </div>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
              Total Offers
            </span>
          </div>
          <p className="text-4xl font-black text-black italic">{offers.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-[2rem] border-2 border-green-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500 p-2.5 rounded-xl">
              <Clock size={20} className="text-white" />
            </div>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
              Active Offers
            </span>
          </div>
          <p className="text-4xl font-black text-black italic">{activeOffers.length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-[2rem] border-2 border-purple-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-500 p-2.5 rounded-xl">
              <Calendar size={20} className="text-white" />
            </div>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
              Permanent
            </span>
          </div>
          <p className="text-4xl font-black text-black italic">{permanentOffers.length}</p>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-sm font-black text-black uppercase tracking-wide">
            Active Offers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-8 py-4 text-left">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Offer ID
                  </span>
                </th>
                <th className="px-8 py-4 text-left">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Type
                  </span>
                </th>
                <th className="px-8 py-4 text-left">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Start Date
                  </span>
                </th>
                <th className="px-8 py-4 text-left">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Expiry Date
                  </span>
                </th>
                <th className="px-8 py-4 text-left">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Status
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer, index) => {
                const isPermanent = offer.expiryDate.startsWith('9999');
                const isExpired = !isPermanent && new Date(offer.expiryDate) < new Date();
                
                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-[#FFCC00]">
                        {offer.offerID}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-gray-600">
                        {offer.offerType === 0 ? 'Standard' : `Type ${offer.offerType}`}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-gray-600">
                        {formatTelecomDate(offer.startDate)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-gray-600">
                        {formatTelecomDate(offer.expiryDate)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${
                        isPermanent 
                          ? 'bg-purple-50 text-purple-600 border border-purple-200'
                          : isExpired
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>
                        {isPermanent ? 'Permanent' : isExpired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Notes */}
      <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-[2rem]">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-3 rounded-xl shrink-0">
            <Gift size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black uppercase tracking-wide mb-3">
              Offers Analysis
            </h3>
            <ul className="space-y-2 text-xs font-bold text-gray-600">
              <li>• Total of {offers.length} offers configured for this subscriber</li>
              <li>• {permanentOffers.length} permanent offers (no expiry)</li>
              <li>• {activeOffers.length} time-bound offers with specific expiry dates</li>
              {activeOffers.some(o => new Date(o.expiryDate) < new Date()) && (
                <li className="text-red-600">• Some offers have expired and may need renewal</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}