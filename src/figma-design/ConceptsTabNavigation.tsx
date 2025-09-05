import React from 'react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { TAB_CONFIG, TabType, calculateTabCounts } from '../utils/conceptsUtils';
import { Concept } from '../types/concepts';

interface ConceptsTabNavigationProps {
  activeTab: TabType;
  concepts: Concept[];
  onTabChange: (tab: TabType) => void;
}

export function ConceptsTabNavigation({ 
  activeTab, 
  concepts, 
  onTabChange 
}: ConceptsTabNavigationProps) {
  const counts = calculateTabCounts(concepts);
  
  const getTabCount = (tabValue: string) => {
    switch (tabValue) {
      case 'all': return counts.all;
      case 'pending': return counts.pending;
      case 'approved': return counts.approved;
      case 'rejected': return counts.rejected;
      case 'ai-suggested': return counts.aiSuggested;
      default: return 0;
    }
  };

  return (
    <div className="bg-white -mx-6 px-6">
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabType)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-gray-50 rounded-lg p-1">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="data-[state=active]:bg-white data-[state=active]:text-foreground text-muted-foreground"
            >
              {tab.label} ({getTabCount(tab.value)})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}