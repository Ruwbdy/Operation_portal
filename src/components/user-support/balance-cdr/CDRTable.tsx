import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCDRDateTime } from '../../../utils/dateFormatter';
import { formatBytes } from '../../../services/cdrParser';
import { getDADescription, formatDAAmount } from '../../../services/daMapping';
import type { CDRRecord, CDRTabType } from '../../../services/data_interface';

interface CDRTableProps {
  records: CDRRecord[];
  type: CDRTabType;
}

type SortDirection = 'asc' | 'desc' | null;

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  accessor?: (record: T) => any;
  minWidth?: string; // Add minimum width for columns
};

export default function CDRTable({ records, type }: CDRTableProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records.filter(record => {
      return Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        const value = String(record[key as keyof CDRRecord] || '').toLowerCase();
        return value.includes(filters[key].toLowerCase());
      });
    });

    // Sort if column is selected
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn as keyof CDRRecord];
        const bVal = b[sortColumn as keyof CDRRecord];
        
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [records, filters, sortColumn, sortDirection]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (amount: string) => `₦${parseFloat(amount || '0').toFixed(2)}`;

  // Define columns based on type
  const getColumns = (): Column<CDRRecord>[] => {
    const baseColumns: Column<CDRRecord>[] = [
      { key: 'event_dt', label: 'Date/Time', sortable: true, filterable: true, minWidth: '160px' },
      { key: 'number_called', label: 'Number Called', sortable: true, filterable: true, minWidth: '140px' },
      { key: 'charged_amount', label: 'Charged', sortable: true, filterable: true, minWidth: '120px' },
      { key: 'balance_before_amt', label: 'MA Bal Before', sortable: true, filterable: true, minWidth: '130px' },
      { key: 'balance_after_amt', label: 'MA Bal After', sortable: true, filterable: true, minWidth: '130px' }
    ];

    if (type === 'voice') {
      return [
        ...baseColumns.slice(0, 2),
        { key: 'call_duration_qty', label: 'Duration (s)', sortable: true, filterable: true, minWidth: '110px' },
        ...baseColumns.slice(2),
        { key: 'discount_amt', label: 'Discount Amt', sortable: false, filterable: false, minWidth: '120px' },
        { key: 'country', label: 'Country', sortable: true, filterable: true, minWidth: '100px' },
        { key: 'operator', label: 'Operator', sortable: true, filterable: true, minWidth: '120px' }
      ];
    }

    if (type === 'data') {
      return [
        ...baseColumns.slice(0, 1),
        { 
          key: 'da_account_id', 
          label: 'DA ID', 
          sortable: true, 
          filterable: true, 
          minWidth: '90px',
          accessor: (r) => r.da_details?.[0]?.account_id ?? '-'
        },
        { 
          key: 'da_description', 
          label: 'DA Description', 
          sortable: false, 
          filterable: true, 
          minWidth: '180px',
          accessor: (r) => {
            const daId = r.da_details?.[0]?.account_id;
            return daId ? getDADescription(daId) : '-';
          }
        },
        { 
          key: 'da_amount_before', 
          label: 'DA Amt Before', 
          sortable: true, 
          filterable: true, 
          minWidth: '130px',
          accessor: (r) => r.da_details?.[0]?.amount_before ?? 0
        },
        { 
          key: 'da_amount_after', 
          label: 'DA Amt After', 
          sortable: true, 
          filterable: true, 
          minWidth: '130px',
          accessor: (r) => r.da_details?.[0]?.amount_after ?? 0
        },
        { 
          key: 'da_amount_charged', 
          label: 'DA Amt Chg', 
          sortable: true, 
          filterable: true, 
          minWidth: '120px',
          accessor: (r) => r.da_details?.[0]?.amount_charged ?? 0
        },
        ...baseColumns.slice(3, 5),
        { key: 'charged_amount', label: 'Total Chrg', sortable: true, filterable: true, minWidth: '120px' },
        { key: 'bytes_received_qty', label: 'Bytes RX', sortable: true, filterable: false, minWidth: '110px' },
        { key: 'bytes_sent_qty', label: 'Bytes TX', sortable: true, filterable: false, minWidth: '110px' },
        { key: 'country', label: 'Country', sortable: true, filterable: true, minWidth: '100px' },
        //{ key: 'operator', label: 'Operator', sortable: true, filterable: true, minWidth: '120px' }
      ];
    }

    if (type === 'sms') {
      return [
        ...baseColumns,
        { key: 'country', label: 'Country', sortable: true, filterable: true, minWidth: '100px' },
        { key: 'operator', label: 'Operator', sortable: true, filterable: true, minWidth: '120px' }
      ];
    }

    // Default columns for credit, daAdjustment, other
    return [...baseColumns.slice(0, 2),
        { key: 'record_type', label: 'Type', sortable: true, filterable: true, minWidth: '110px' },
        ...baseColumns.slice(2),
      ];
  };

  const columns = getColumns();

  const renderCellValue = (record: CDRRecord, column: Column<CDRRecord>) => {
    const value = column.accessor
      ? column.accessor(record)
      : record[column.key as keyof CDRRecord];

    if (column.key === 'event_dt') {
      return formatCDRDateTime(Number(value));
    }

    // Handle DA amount columns with data conversion
    if (column.key === 'da_amount_before' || 
        column.key === 'da_amount_after' || 
        column.key === 'da_amount_charged') {
      const daId = record.da_details?.[0]?.account_id;
      if (daId) {
        return formatDAAmount(daId, Number(value));
      }
      return formatCurrency(String(value));
    }

    if (
      column.key.includes('amount') ||
      column.key.includes('balance')
    ) {
      return formatCurrency(String(value));
    }

    if (
      column.key === 'bytes_received_qty' ||
      column.key === 'bytes_sent_qty'
    ) {
      return formatBytes(Number(value));
    }

    if (column.key === 'call_duration_qty') {
      const seconds = parseInt(String(value) || '0');
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }

    return String(value ?? '-');
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wide">
            Transaction Records
          </h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
            {filteredRecords.length} of {records.length} records shown
          </p>
        </div>
        {Object.values(filters).some(f => f) && (
          <button
            onClick={() => setFilters({})}
            className="text-xs font-black text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className="px-6 py-4 text-left"
                  style={{ minWidth: col.minWidth || 'auto' }}
                >
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`flex items-center space-x-2 ${
                        col.sortable ? 'cursor-pointer hover:text-[#FFCC00]' : ''
                      } transition-colors`}
                    >
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {col.label}
                      </span>
                      {col.sortable && sortColumn === col.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp size={12} className="text-[#FFCC00] flex-shrink-0" />
                        ) : sortDirection === 'desc' ? (
                          <ChevronDown size={12} className="text-[#FFCC00] flex-shrink-0" />
                        ) : null
                      )}
                    </button>
                    {col.filterable && (
                      <div className="relative">
                        <input
                          type="text"
                          value={filters[col.key] || ''}
                          onChange={(e) => handleFilterChange(col.key, e.target.value)}
                          placeholder="Filter..."
                          className="w-full min-w-[100px] px-2 py-1 text-[10px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFCC00] placeholder:text-gray-300"
                        />
                        <Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    <span className={`text-xs font-bold ${
                      col.key === 'charged_amount' ? 'text-red-600' :
                      col.key === 'balance_after_amt' ? 'text-green-600' :
                      col.key === 'event_dt' ? 'text-blue-600' :
                      col.key === 'da_description' ? 'text-purple-600' :
                      'text-gray-700'
                    }`}>
                      {renderCellValue(record, col)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="text-center py-16">
            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-wider">
              No Records Match Filters
            </p>
            <button
              onClick={() => setFilters({})}
              className="mt-4 text-xs font-black text-blue-600 uppercase tracking-wider hover:text-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}