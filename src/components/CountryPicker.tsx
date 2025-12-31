import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { countries } from '@/data/countries';
import { Country } from '@/types';

interface CountryPickerProps {
  selected: Country;
  onSelect: (country: Country) => void;
}

export function CountryPicker({ selected, onSelect }: CountryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-12 px-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
      >
        <span className="text-2xl">{selected.flag}</span>
        <span className="text-foreground font-medium">{selected.dialCode}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-2 w-72 max-h-80 overflow-hidden rounded-xl bg-card border border-border shadow-xl"
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                  variant="glow"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-56">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onSelect(country);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-card-hover transition-colors ${
                    selected.code === country.code ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="flex-1 text-left text-sm">{country.name}</span>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
