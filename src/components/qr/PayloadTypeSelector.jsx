import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PAYLOAD_TYPES, 
  PAYLOAD_CATEGORIES, 
  getPayloadsByCategory, 
  searchPayloadTypes 
} from './config/PayloadTypesCatalog';
import { GlyphCard, GlyphInput, GlyphTypography } from './design/GlyphQrDesignSystem';

export default function PayloadTypeSelector({ value, onChange, onTypeSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTypes = useMemo(() => {
    if (searchQuery.trim()) {
      return searchPayloadTypes(searchQuery);
    }

    if (selectedCategory === 'all') {
      return PAYLOAD_TYPES;
    }

    return PAYLOAD_TYPES.filter(type => type.category === selectedCategory);
  }, [searchQuery, selectedCategory]);

  const selectedType = PAYLOAD_TYPES.find(t => t.id === value);

  const handleTypeSelect = (type) => {
    onChange(type.id);
    if (onTypeSelect) {
      onTypeSelect(type);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search payload types..."
          className={`${GlyphInput.glow} pl-11`}
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all min-h-[44px] ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
          }`}
        >
          All Types
        </button>
        {Object.values(PAYLOAD_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all min-h-[44px] ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Selected Type Display */}
      {selectedType && (
        <div className={`${GlyphCard.glow} p-4`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <selectedType.icon className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`${GlyphTypography.heading.sm} text-white`}>{selectedType.label}</h3>
                {selectedType.premium && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 gap-1">
                    <Sparkles className="w-3 h-3" />
                    Advanced
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400">{selectedType.description}</p>
              <p className="text-xs text-gray-500 mt-2">Category: {selectedType.category}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payload Types Grid */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = value === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className={`p-4 rounded-xl border-2 transition-all text-left min-h-[100px] ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/20'
                    : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20' : 'bg-gray-700/50'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {type.label}
                      </h4>
                      {type.premium && (
                        <Lock className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payload types found matching "{searchQuery}"</p>
          </div>
        )}
      </ScrollArea>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
        <span>{filteredTypes.length} payload types available</span>
        <span>Full access — all features included</span>
      </div>
    </div>
  );
}