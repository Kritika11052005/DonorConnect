// DatePicker.tsx - A reusable date picker component using date-fns
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  parseISO, 
  isAfter, 
  isBefore, 
  startOfDay 
} from 'date-fns';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export default function DatePicker({ 
  value, 
  onChange, 
  minDate,
  maxDate,
  label,
  required = false,
  placeholder = "Select date"
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get days to show (including padding for calendar grid)
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    const dayStart = startOfDay(date);
    if (minDate && isBefore(dayStart, startOfDay(minDate))) return true;
    if (maxDate && isAfter(dayStart, startOfDay(maxDate))) return true;
    return false;
  };

  const selectedDate = value ? parseISO(value) : null;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value ? format(parseISO(value), 'MMM dd, yyyy') : ''}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        />
        <Calendar 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
        />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
              aria-label="previous month"
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
              aria-label='button'
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="aspect-square" />
              ))}
              {daysInMonth.map((date) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);
                const isDisabled = isDateDisabled(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition
                      ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      ${isCurrentDay && !isSelected ? 'bg-blue-50 text-blue-600 font-bold' : ''}
                      ${!isSelected && !isCurrentDay && isCurrentMonth ? 'hover:bg-gray-100 text-gray-900' : ''}
                      ${!isCurrentMonth ? 'text-gray-400' : ''}
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                disabled={minDate && isBefore(new Date(), minDate)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


export const DateHelpers = {
  // Format for display
  formatDisplay: (date: number | string) => {
    return format(typeof date === 'number' ? date : parseISO(date), 'MMM dd, yyyy');
  },
  
  // Format with time
  formatWithTime: (date: number | string) => {
    return format(typeof date === 'number' ? date : parseISO(date), 'MMM dd, yyyy HH:mm');
  },
  
  // Format full
  formatFull: (date: number | string) => {
    return format(typeof date === 'number' ? date : parseISO(date), 'EEEE, MMMM dd, yyyy');
  },
  
  // Get tomorrow
  getTomorrow: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  },
  
  // Check if date is in past
  isInPast: (date: string | number) => {
    return isBefore(
      typeof date === 'number' ? date : parseISO(date).getTime(),
      Date.now()
    );
  },
  
  // Days from now
  daysFromNow: (date: string | number) => {
    const target = typeof date === 'number' ? date : parseISO(date).getTime();
    return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  }
};