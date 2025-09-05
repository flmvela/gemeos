import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Concept {
  id: string;
  name: string;
  description?: string;
  parent_concept_id?: string;
  domain_id: string;
  status: 'suggested' | 'approved' | 'rejected' | 'pending';
  difficulty_level: number;
  generation_source: 'ai' | 'human' | 'import';
  source: 'ai' | 'human' | 'import';
  source_file_id?: string;
  display_order?: number;
  metadata: any;
  created_by?: string;
  updated_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useConcepts = (domainId: string) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // New smart comparator for natural sorting
  const smartComparator = (a: Concept, b: Concept) => {
    // 1. Prioritize display_order if it exists
    const ao = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.display_order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;

    // 2. Extract numeric prefix from name for natural sorting
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] || '0', 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] || '0', 10);

    if (numA !== numB) {
      return numA - numB;
    }

    // 3. Fallback to full name comparison
    return a.name.localeCompare(b.name);
  };

  const fetchConcepts = async () => {
    if (!domainId) return;

    console.log('🔍 fetchConcepts called for domain:', domainId);
    setLoading(true);
    setError(null);
    
    // Clear existing concepts first
    setConcepts([]);

    try {
      console.log('🔍 Fetching concepts for domain:', domainId);
      console.log('🔍 Current user auth info:', await supabase.auth.getUser());
      
      // Direct database query with wildcard to see all available fields
      const { data, error: fetchError } = await supabase
        .from('concepts')
        .select('*')
        .eq('domain_id', domainId)
        .order('parent_concept_id', { ascending: true, nullsFirst: true })
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      console.log('🔍 Raw Supabase response - data:', data);
      console.log('🔍 Raw Supabase response - error:', fetchError);
      console.log('🔍 Data count:', data?.length || 0);

      if (fetchError) {
        console.error('🔍 Database fetch error:', fetchError);
        throw fetchError;
      }
      
      console.log('🔍 === COMPLETE DATABASE RESPONSE ===');
      console.log('🔍 Total concepts returned:', data?.length);
      console.log('🔍 Suggested concepts returned:', data?.filter(c => c.status === 'suggested').length);
      console.log('🔍 All unique statuses:', [...new Set(data?.map(c => c.status) || [])]);
      console.log('🔍 ALL suggested concepts details:', data?.filter(c => c.status === 'suggested').map(c => ({
        id: c.id.slice(0, 8),
        name: c.name,
        status: c.status,
        teacher_id: c.teacher_id
      })));
      
      setConcepts(data || []);
      console.log('🔍 React state updated with', data?.length, 'concepts');
      
    } catch (err) {
      console.error('Error fetching concepts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch concepts');
      toast({
        title: "Error",
        description: "Failed to fetch concepts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConceptStatus = async (conceptId: string, status: 'approved' | 'rejected', reviewerId?: string) => {
    try {
      // Get current user ID if reviewerId not provided
      let actualReviewerId = reviewerId;
      if (!actualReviewerId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No authenticated user found');
        actualReviewerId = user.id;
      }

      const { error: updateError } = await supabase
        .from('concepts')
        .update({
          status,
          reviewed_by: actualReviewerId,
          reviewed_at: new Date().toISOString(),
          updated_by: actualReviewerId,
        })
        .eq('id', conceptId);

      if (updateError) throw updateError;

      setConcepts(prev => 
        prev.map(concept => 
          concept.id === conceptId 
            ? { 
                ...concept, 
                status, 
                reviewed_by: actualReviewerId,
                reviewed_at: new Date().toISOString(),
                updated_by: actualReviewerId,
                updated_at: new Date().toISOString() 
              }
            : concept
        )
      );

      toast({
        title: "Success",
        description: `Concept ${status === 'approved' ? 'approved' : 'rejected'}`,
      });

      return true;
    } catch (err) {
      console.error('Error updating concept status:', err);
      toast({
        title: "Error",
        description: "Failed to update concept status",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateConceptParent = async (conceptId: string, parentId?: string) => {
    try {
      const { error: updateError } = await supabase
        .from('concepts')
        .update({ 
          parent_concept_id: parentId || null, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', conceptId);

      if (updateError) throw updateError;

      setConcepts(prev => 
        prev.map(concept => 
          concept.id === conceptId 
            ? { ...concept, parent_concept_id: parentId, updated_at: new Date().toISOString() }
            : concept
        )
      );

      toast({
        title: "Success",
        description: "Concept hierarchy updated",
      });

      return true;
    } catch (err) {
      console.error('Error updating concept parent:', err);
      toast({
        title: "Error",
        description: "Failed to update concept hierarchy",
        variant: "destructive",
      });
      return false;
    }
  };

  const moveConceptUp = async (conceptId: string) => {
    try {
      const concept = concepts.find(c => c.id === conceptId);
      if (!concept) return false;

      // Get concepts with same parent
      const siblings = concepts.filter(c => c.parent_concept_id === concept.parent_concept_id);
      const sortedSiblings = [...siblings].sort(smartComparator); // MODIFIED
      const currentIndex = sortedSiblings.findIndex(c => c.id === conceptId);
      
      if (currentIndex <= 0) return false; // Already at top

      // Swap display_order with previous sibling
      const prevSibling = sortedSiblings[currentIndex - 1];
      const currentOrder = concept.display_order ?? currentIndex;
      const prevOrder = prevSibling.display_order ?? (currentIndex - 1);

      const { error } = await supabase
        .from('concepts')
        .update({ display_order: prevOrder, updated_at: new Date().toISOString() })
        .eq('id', conceptId);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('concepts')
        .update({ display_order: currentOrder, updated_at: new Date().toISOString() })
        .eq('id', prevSibling.id);

      if (error2) throw error2;

      // Normalize sequential order for all siblings (nulls last)
      const newOrderIds = [...sortedSiblings].map(c => c.id);
      [newOrderIds[currentIndex - 1], newOrderIds[currentIndex]] = [newOrderIds[currentIndex], newOrderIds[currentIndex - 1]];
      await reorderSiblings(concept.parent_concept_id ?? null, newOrderIds);
      return true;
    } catch (err) {
      console.error('Error moving concept up:', err);
      toast({
        title: "Error",
        description: "Failed to move concept",
        variant: "destructive",
      });
      return false;
    }
  };

  const moveConceptDown = async (conceptId: string) => {
    try {
      const concept = concepts.find(c => c.id === conceptId);
      if (!concept) return false;

      // Get concepts with same parent
      const siblings = concepts.filter(c => c.parent_concept_id === concept.parent_concept_id);
      const sortedSiblings = [...siblings].sort(smartComparator); // MODIFIED
      const currentIndex = sortedSiblings.findIndex(c => c.id === conceptId);
      
      if (currentIndex >= sortedSiblings.length - 1) return false; // Already at bottom

      // Swap display_order with next sibling
      const nextSibling = sortedSiblings[currentIndex + 1];
      const currentOrder = concept.display_order ?? currentIndex;
      const nextOrder = nextSibling.display_order ?? (currentIndex + 1);

      const { error } = await supabase
        .from('concepts')
        .update({ display_order: nextOrder, updated_at: new Date().toISOString() })
        .eq('id', conceptId);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('concepts')
        .update({ display_order: currentOrder, updated_at: new Date().toISOString() })
        .eq('id', nextSibling.id);

      if (error2) throw error2;

      // Normalize sequential order for all siblings (nulls last)
      const newOrderIds = [...sortedSiblings].map(c => c.id);
      [newOrderIds[currentIndex], newOrderIds[currentIndex + 1]] = [newOrderIds[currentIndex + 1], newOrderIds[currentIndex]];
      await reorderSiblings(concept.parent_concept_id ?? null, newOrderIds);
      return true;
    } catch (err) {
      console.error('Error moving concept down:', err);
      toast({
        title: "Error",
        description: "Failed to move concept",
        variant: "destructive",
      });
      return false;
    }
  };

  const reorderSiblings = async (parentId: string | null, orderedIds: string[]) => {
    try {
      const timestamp = new Date().toISOString();

      // Build full sibling set (including hidden ones) to avoid duplicate/holes
      const siblingsAll = concepts
        .filter(c => (c.parent_concept_id ?? null) === parentId);

      // Keep non-listed siblings in their relative order after the visible ones
      const otherSiblings = siblingsAll
        .filter(c => !orderedIds.includes(c.id))
        .sort(smartComparator); // MODIFIED

      const fullOrder = [...orderedIds, ...otherSiblings.map(c => c.id)];

      await Promise.all(
        fullOrder.map((id, index) =>
          supabase
            .from('concepts')
            .update({
              display_order: index,
              parent_concept_id: parentId,
              updated_at: timestamp,
            })
            .eq('id', id)
        )
      );

      // Refresh local state
      fetchConcepts();
      return true;
    } catch (err) {
      console.error('Error reordering concepts:', err);
      toast({
        title: 'Error',
        description: 'Failed to reorder concepts',
        variant: 'destructive',
      });
      return false;
    }
  };
  
  const bulkUpdateStatus = async (conceptIds: string[], status: 'approved' | 'rejected', reviewerId?: string) => {
    try {
      // Get current user ID if reviewerId not provided
      let actualReviewerId = reviewerId;
      if (!actualReviewerId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No authenticated user found');
        actualReviewerId = user.id;
      }

      const { error: updateError } = await supabase
        .from('concepts')
        .update({
          status,
          reviewed_by: actualReviewerId,
          reviewed_at: new Date().toISOString(),
          updated_by: actualReviewerId,
        })
        .in('id', conceptIds);

      if (updateError) throw updateError;

      setConcepts(prev => 
        prev.map(concept => 
          conceptIds.includes(concept.id)
            ? { 
                ...concept, 
                status,
                reviewed_by: actualReviewerId,
                reviewed_at: new Date().toISOString(),
                updated_by: actualReviewerId,
                updated_at: new Date().toISOString() 
              }
            : concept
        )
      );

      toast({
        title: "Success",
        description: `${conceptIds.length} concepts ${status === 'approved' ? 'approved' : 'rejected'}`,
      });

      return true;
    } catch (err) {
      console.error('Error bulk updating concepts:', err);
      toast({
        title: "Error",
        description: "Failed to update concepts",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateConcept = async (conceptId: string, updates: Partial<Pick<Concept, 'name' | 'description'>>) => {
    try {
      const { error: updateError } = await supabase
        .from('concepts')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq('id', conceptId);

      if (updateError) throw updateError;

      setConcepts(prev => 
        prev.map(concept => 
          concept.id === conceptId 
            ? { ...concept, ...updates, updated_at: new Date().toISOString() }
            : concept
        )
      );

      toast({
        title: "Success",
        description: "Concept updated successfully",
      });

      return true;
    } catch (err) {
      console.error('Error updating concept:', err);
      toast({
        title: "Error",
        description: "Failed to update concept",
        variant: "destructive",
      });
      return false;
    }
  };

  const addConcept = async (conceptData: Omit<Concept, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'reviewed_by' | 'reviewed_at'>) => {
    try {
      // Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      console.log('🔍 Adding concept with data:', conceptData);
      console.log('🔍 User ID:', user.id);

      // Prepare insert data with proper audit fields for human-created concepts
      const insertData = {
        ...conceptData,
        created_by: user.id,
        // If this is a human-created concept that's approved immediately, set review fields
        // ...(conceptData.source === 'human' && conceptData.status === 'approved' && {
          // reviewed_by: user.id,
          // reviewed_at: new Date().toISOString(),
        // }),
      };
      
      console.log('🔍 Final insert data:', insertData);

      const { data, error: insertError } = await supabase
        .from('concepts')
        .insert(insertData)
        .select()
        .single();

      console.log('🔍 Insert response:', { data, error: insertError });

      if (insertError) {
        console.error('🔍 Insert error details:', insertError);
        console.error('🔍 Full error object:', JSON.stringify(insertError, null, 2));
        console.error('🔍 Error message:', insertError.message);
        console.error('🔍 Error code:', insertError.code);
        console.error('🔍 Error details:', insertError.details);
        console.error('🔍 Error hint:', insertError.hint);
        throw insertError;
      }

      console.log('🔍 Successfully created concept:', data);
      console.log('🔍 New concept parent_concept_id:', data.parent_concept_id);
      console.log('🔍 New concept status:', data.status);
      console.log('🔍 Adding to concepts list. Current count:', concepts.length);
      
      setConcepts(prev => {
        const newList = [...prev, data];
        console.log('🔍 Updated concepts list count:', newList.length);
        return newList;
      });

      toast({
        title: "Success",
        description: "Concept created successfully",
      });

      return data; // Return created concept for inline edit workflows
    } catch (err) {
      console.error('Error adding concept:', err);
      toast({
        title: "Error",
        description: "Failed to create concept",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteConcept = async (conceptId: string) => {
    try {
      // Check if concept has children
      const hasChildren = concepts.some(c => c.parent_concept_id === conceptId);
      if (hasChildren) {
        toast({
          title: "Error",
          description: "Cannot delete concept with child concepts. Please reassign or delete children first.",
          variant: "destructive",
        });
        return false;
      }

      const { error: deleteError } = await supabase
        .from('concepts')
        .delete()
        .eq('id', conceptId);

      if (deleteError) throw deleteError;

      setConcepts(prev => prev.filter(concept => concept.id !== conceptId));

      toast({
        title: "Success",
        description: "Concept deleted successfully",
      });

      return true;
    } catch (err) {
      console.error('Error deleting concept:', err);
      toast({
        title: "Error",
        description: "Failed to delete concept",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveMindmapPosition = async (conceptId: string, x: number, y: number): Promise<boolean> => {
    try {
      console.log('🎯 Saving mindmap position for concept:', conceptId, 'at position:', { x, y });
      
      // Debug: Check current session and auth state
      const { data: session } = await supabase.auth.getSession();
      console.log('🎯 Current Supabase session:', session?.session?.user?.id, session?.session?.user?.email);
      console.log('🎯 Session access token exists:', !!session?.session?.access_token);
      console.log('🎯 User role from JWT:', session?.session?.user?.app_metadata?.role);

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('🎯 No authenticated user - cannot save mindmap position');
        toast({
          title: "Authentication Required",
          description: "Please log in to save mindmap positions.",
          variant: "destructive",
        });
        return false;
      }

      if (!session?.session) {
        console.error('🎯 No valid Supabase session found');
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please refresh the page and try again.",
          variant: "destructive",
        });
        return false;
      }

      const concept = concepts.find(c => c.id === conceptId);
      if (!concept) {
        console.error('🎯 Concept not found:', conceptId);
        return false;
      }

      const metadata = concept.metadata || {};
      const updatedMetadata = {
        ...metadata,
        mindmap_position: { x, y }
      };

      console.log('🎯 Current metadata:', concept.metadata);
      console.log('🎯 Updated metadata:', updatedMetadata);
      console.log('🎯 User ID:', user.id, 'Concept created_by:', concept.created_by);

      // Debug: Test auth function access
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_current_user_jwt');
      console.log('🎯 Debug auth function result:', debugData, debugError);

      // Try a more targeted update that only changes metadata_json
      const { data, error: updateError } = await supabase
        .from('concepts')
        .update({ 
          metadata: updatedMetadata
        })
        .eq('id', conceptId)
        .select('id, metadata');

      console.log('🎯 Database update response:', { data, error: updateError });

      if (updateError) {
        console.error('🎯 Database update error:', updateError);
        
        // Enhanced error handling
        if (updateError.code === 'PGRST116' || updateError.message?.includes('new row violates row-level security')) {
          console.error('🎯 RLS policy violation - checking auth state');
          
          // Additional debugging for RLS failures
          const { data: testAdminData, error: testAdminError } = await supabase
            .rpc('test_user_is_admin');
          console.log('🎯 Admin test result:', testAdminData, testAdminError);
          
          toast({
            title: "Permission Denied",
            description: `You don't have permission to update this concept's position. Your ID: ${user.id}, Concept created by: ${concept.created_by}`,
            variant: "destructive",
          });
        } else if (updateError.code === 'PGRST301') {
          toast({
            title: "Authentication Error",
            description: "Your session is invalid. Please refresh the page and log in again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Save Failed",
            description: `Could not save mindmap position: ${updateError.message}`,
            variant: "destructive",
          });
        }
        return false;
      }

      if (!data || data.length === 0) {
        console.error('🎯 No data returned from update - possibly RLS policy blocked the update');
        toast({
          title: "Save Failed",
          description: "No data returned from server. Update may have been blocked by security policies.",
          variant: "destructive",
        });
        return false;
      }

      console.log('🎯 Successfully saved position to database');
      toast({
        title: "Position Saved",
        description: "Mindmap position has been saved successfully.",
      });

      setConcepts(prev => 
        prev.map(concept => 
          concept.id === conceptId 
            ? { ...concept, metadata: updatedMetadata }
            : concept
        )
      );

      return true;
    } catch (err) {
      console.error('🎯 Error saving mindmap position:', err);
      toast({
        title: "Save Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getMindmapPosition = (conceptId: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    const position = concept?.metadata?.mindmap_position || null;
    console.log('🎯 Getting mindmap position for concept:', conceptId, 'concept metadata:', JSON.stringify(concept?.metadata), 'found position:', JSON.stringify(position));
    return position;
  };

  const clearMindmapPositions = async (domainId: string) => {
    try {
      const domainConcepts = concepts.filter(c => c.domain_id === domainId);
      
      for (const concept of domainConcepts) {
        if (concept.metadata?.mindmap_position) {
          const metadata = { ...concept.metadata };
          delete metadata.mindmap_position;
          
          await supabase
            .from('concepts')
            .update({ 
              metadata: metadata,
              updated_at: new Date().toISOString() 
            })
            .eq('id', concept.id);
        }
      }

      // Refresh concepts to get updated metadata
      fetchConcepts();

      toast({
        title: "Success",
        description: "Mindmap layout reset successfully",
      });

      return true;
    } catch (err) {
      console.error('Error clearing mindmap positions:', err);
      toast({
        title: "Error",
        description: "Failed to reset mindmap layout",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConcepts();
  }, [domainId]);

  // Disable real-time updates temporarily to avoid conflicts
  // Set up real-time updates
  /*
  useEffect(() => {
    if (!domainId) return;

    const channel = supabase
      .channel('concepts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'concepts',
          filter: `domain_id=eq.${domainId}`
        },
        () => {
          fetchConcepts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [domainId]);
  */

  const getConceptStats = () => {
    const stats = concepts.reduce((acc, concept) => {
      acc[concept.status] = (acc[concept.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: concepts.length,
      ai_suggested: stats.suggested || 0,
      approved: stats.approved || stats.confirmed || 0, // Handle both 'approved' and 'confirmed'
      rejected: stats.rejected || 0,
    };
  };

  return {
    concepts,
    loading,
    error,
    refetch: fetchConcepts,
    updateConceptStatus,
    updateConceptParent,
    updateConcept,
    bulkUpdateStatus,
    addConcept,
    deleteConcept,
    moveConceptUp,
    moveConceptDown,
    reorderSiblings,
    saveMindmapPosition,
    getMindmapPosition,
    clearMindmapPositions,
    stats: getConceptStats(),
  };
};