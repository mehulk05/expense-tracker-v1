import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../constants';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Select date',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDate(selectedDate));
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const isSelected = value === formatDate(new Date(year, month, i));
      const isToday = formatDate(new Date()) === formatDate(new Date(year, month, i));
      
      days.push(
        <button
          key={i}
          onClick={() => handleDateSelect(i)}
          className={`h-8 w-8 rounded-full text-[11px] font-bold transition-all flex items-center justify-center
            ${isSelected 
              ? 'bg-blue-600 text-white shadow-md' 
              : isToday 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 pl-4 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-2">
            <ICONS.Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span>{value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : placeholder}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 w-64">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <ICONS.ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
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
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <button 
                onClick={() => {
                    const today = formatDate(new Date());
                    onChange(today);
                    setIsOpen(false);
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
            >
                Today
            </button>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
            >
                Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
