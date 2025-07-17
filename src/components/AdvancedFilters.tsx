import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Calendar, Filter, Search, Tag, X } from 'lucide-react';
import { FilterOptions } from '../types/premium';
import { PremiumGate } from './PremiumGate';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  onFiltersChange, 
  currentFilters 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const platforms = ['ChatGPT', 'Claude', 'Gemini', 'Grok'];
  const sentiments = ['positive', 'negative', 'neutral'];

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...currentFilters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <PremiumGate feature="Advanced Filtering">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </CardTitle>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {Object.keys(currentFilters).length} active
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Search Query */}
            <div className="space-y-2">
              <Label htmlFor="search">Search in conversations</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search messages, topics, keywords..."
                  value={currentFilters.searchQuery || ''}
                  onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={currentFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateFilters({
                    dateRange: {
                      ...currentFilters.dateRange,
                      start: new Date(e.target.value)
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={currentFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateFilters({
                    dateRange: {
                      ...currentFilters.dateRange,
                      end: new Date(e.target.value)
                    }
                  })}
                />
              </div>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={currentFilters.platforms?.includes(platform) || false}
                      onCheckedChange={(checked) => {
                        const current = currentFilters.platforms || [];
                        if (checked) {
                          updateFilters({ platforms: [...current, platform] });
                        } else {
                          updateFilters({ 
                            platforms: current.filter(p => p !== platform) 
                          });
                        }
                      }}
                    />
                    <Label htmlFor={platform} className="text-sm">{platform}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Count Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-messages">Min Messages</Label>
                <Input
                  id="min-messages"
                  type="number"
                  placeholder="0"
                  value={currentFilters.messageCount?.min || ''}
                  onChange={(e) => updateFilters({
                    messageCount: {
                      ...currentFilters.messageCount,
                      min: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-messages">Max Messages</Label>
                <Input
                  id="max-messages"
                  type="number"
                  placeholder="∞"
                  value={currentFilters.messageCount?.max || ''}
                  onChange={(e) => updateFilters({
                    messageCount: {
                      ...currentFilters.messageCount,
                      max: parseInt(e.target.value) || 999999
                    }
                  })}
                />
              </div>
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <Label>Conversation Sentiment</Label>
              <Select
                value={currentFilters.sentiment || ''}
                onValueChange={(value) => updateFilters({ 
                  sentiment: value as 'positive' | 'negative' | 'neutral' 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any sentiment</SelectItem>
                  {sentiments.map((sentiment) => (
                    <SelectItem key={sentiment} value={sentiment}>
                      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={() => setIsExpanded(false)}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </PremiumGate>
  );
};