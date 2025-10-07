import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string | number;
  options: DropdownOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
  onChange(optionValue);
  setIsOpen(false);
};

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-left transition-all duration-200 flex items-center justify-between ${
          isOpen
            ? 'border-rose-500 ring-2 ring-rose-100 shadow-lg'
            : 'border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <div className="flex-1 min-w-0">
            <span
              className={`block truncate font-medium ${
                selectedOption ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {selectedOption?.label || placeholder}
            </span>
            {selectedOption?.description && (
              <span className="block text-xs text-gray-500 truncate mt-0.5">
                {selectedOption.description}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'transform rotate-180 text-rose-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left transition-all duration-150 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {option.icon && (
                    <span className="flex-shrink-0">{option.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block truncate font-medium ${
                        isSelected ? 'text-rose-600' : 'text-gray-900'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block text-xs text-gray-500 truncate mt-0.5">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}