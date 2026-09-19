import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

export const STANDARD_TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, '0');
  for (const m of [0, 15, 30, 45]) {
    const mm = m.toString().padStart(2, '0');
    STANDARD_TIME_OPTIONS.push(`${hh}.${mm}`);
  }
}

interface TimeDropdownProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isEndTime?: boolean;
  className?: string;
}

export const TimeDropdown: React.FC<TimeDropdownProps> = ({
  value,
  onChange,
  placeholder = '00.00',
  isEndTime = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto scroll into selected view when opened
  useEffect(() => {
    if (isOpen && selectedItemRef.current && listRef.current) {
      const topPos = selectedItemRef.current.offsetTop;
      listRef.current.scrollTop = Math.max(0, topPos - 70);
    }
  }, [isOpen]);

  const handleSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  const options = isEndTime ? ['selesai', ...STANDARD_TIME_OPTIONS] : STANDARD_TIME_OPTIONS;

  // Check if current custom value exists in options
  const isCustomValue = value && !options.includes(value);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Box: White background, black numbers, no clock/arrow icons, matches form inputs */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-[#275d1d]/40 hover:border-[#275d1d] focus:border-[#275d1d] rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-mono font-bold text-center tracking-wider shadow-2xs transition-colors cursor-pointer"
        title="Klik untuk memilih jam kegiatan"
      >
        <span>{value || placeholder}</span>
      </button>

      {/* Dropdown Menu: White background, black numbers, subtle clean borders */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-36 sm:w-40 z-50 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Custom / direct type bar */}
          <div className="p-1.5 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ketik jam..."
              className="w-full bg-white text-gray-900 placeholder-gray-400 text-xs font-mono font-semibold px-2 py-1 rounded border border-gray-300 focus:outline-none focus:border-[#275d1d]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Scrollable List */}
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto py-1 divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-300"
          >
            {isCustomValue && (
              <button
                type="button"
                onClick={() => handleSelect(value)}
                className="w-full text-left px-3 py-1.5 text-xs font-mono text-amber-700 bg-amber-50 flex items-center justify-between hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>{value} (Kustom)</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            )}

            {options.map((time) => {
              const isSelected = value === time;
              return (
                <button
                  key={time}
                  type="button"
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => handleSelect(time)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#275d1d] text-white font-bold'
                      : 'text-gray-900 hover:bg-emerald-50 hover:text-[#275d1d]'
                  }`}
                >
                  <span>{time}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
