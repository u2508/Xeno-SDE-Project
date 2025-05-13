
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import CampaignCard from '@/components/campaigns/CampaignCard';
import CampaignHistoryTable from '@/components/campaigns/CampaignHistoryTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, List, Table as TableIcon } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Define campaign data structure
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'draft' | 'completed' | 'failed';
  audience: number;
  delivered: number;
  opened: number;
  createdAt: string;
}

const CampaignHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('grid');
  
  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('createdat', { ascending: false });
      
      if (error) {
        throw error;
      }

      // Transform data to match our Campaign interface
      const transformedCampaigns: Campaign[] = (data || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status as 'active' | 'scheduled' | 'draft' | 'completed' | 'failed',
        audience: campaign.audience,
        delivered: campaign.delivered,
        opened: campaign.opened,
        createdAt: campaign.createdat
      }));
      
      return transformedCampaigns;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error fetching campaigns',
        description: 'There was a problem loading your campaigns.',
        variant: 'destructive'
      });
      return [];
    }
  };
  
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns
  });

  // Refresh data when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'audience-desc':
        return b.audience - a.audience;
      case 'audience-asc':
        return a.audience - b.audience;
      default:
        return 0;
    }
  });

  const handleViewDetails = (campaignId: string) => {
    // Navigate to campaign detail page (to be implemented)
    console.log(`View details for campaign ${campaignId}`);
    // navigate(`/campaigns/${campaignId}`);
  };

  return (
    <div className="flex-1 h-screen overflow-auto">
      <Header title="Campaign History" />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Campaign History</h1>
          <Button onClick={() => navigate('/campaigns/new')}>Create Campaign</Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs defaultValue={viewMode} onValueChange={setViewMode}>
              <TabsList className="grid grid-cols-2 h-9">
                <TabsTrigger value="grid" className="px-3 data-[state=active]:bg-muted">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="table" className="px-3 data-[state=active]:bg-muted">
                  <TableIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Filter className="h-4 w-4" />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="audience-desc">Audience (Highest)</SelectItem>
                <SelectItem value="audience-asc">Audience (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {sortedCampaigns.length > 0 ? (
              sortedCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium">No campaigns found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new campaign</p>
              </div>
            )}
          </div>
        ) : (
          sortedCampaigns.length > 0 ? (
            <CampaignHistoryTable 
              campaigns={sortedCampaigns}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <div className="text-center py-12 border rounded-md">
              <h3 className="text-lg font-medium">No campaigns found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new campaign</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default CampaignHistoryPage;
