import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../constants';

interface CustomDateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  className?: string;
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({ 
  startDate, 
  endDate, 
  onRangeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(startDate ? new Date(startDate) : new Date());
  const [tempStart, setTempStart] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset selection state when opening
  useEffect(() => {
    if (isOpen) {
      setTempStart(null);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const selectedDateStr = formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    
    if (!tempStart) {
      // 1. Initial selection: start a new range
      setTempStart(selectedDateStr);
      onRangeChange(selectedDateStr, selectedDateStr);
    } else if (selectedDateStr < tempStart) {
      // 2. Selection before current start: reset start to this date
      setTempStart(selectedDateStr);
      onRangeChange(selectedDateStr, selectedDateStr);
    } else {
      // 3. Selection on/after current start: complete the range
      onRangeChange(tempStart, selectedDateStr);
      setTempStart(null); // Selection complete
      setIsOpen(false);
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = formatDate(new Date(year, month, i));
      const isStart = dateStr === startDate;
      const isEnd = dateStr === endDate;
      const isInRange = dateStr > startDate && dateStr < endDate;
      const isToday = formatDate(new Date()) === dateStr;
      
      days.push(
        <button
          key={i}
          onClick={() => handleDateClick(i)}
          className={`h-9 w-9 text-[11px] font-bold transition-all flex items-center justify-center relative z-10
            ${isStart || isEnd 
              ? 'bg-blue-600 text-white rounded-lg shadow-md' 
              : isInRange
                ? 'bg-blue-50 text-blue-700'
                : isToday 
                  ? 'text-blue-600 border border-blue-200 rounded-lg' 
                  : 'text-slate-600 hover:bg-slate-100 rounded-lg'
            }
            ${isInRange && 'rounded-none'}
            ${isStart && endDate && startDate !== endDate && 'rounded-r-none'}
            ${isEnd && startDate && startDate !== endDate && 'rounded-l-none'}
          `}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const displayValue = startDate && endDate 
    ? `${new Date(startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${new Date(endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`
    : 'Select date range';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-2">
            <ICONS.Calendar className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="truncate">{displayValue}</span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 w-72">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <ICONS.ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <ICONS.ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] font-black text-slate-300 uppercase text-center py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Current Selection</span>
                <span className="text-[10px] font-bold text-blue-600">{tempStart ? 'Selecting end date...' : 'Range set'}</span>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition-all"
            >
                Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
