import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useDomains, Domain } from '@/hooks/useDomains';
import { DomainFormModal } from '@/components/domains/DomainFormModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toStringSafe } from '@/lib/utils';

const DomainManagement = () => {
  const { domains, loading, createDomain, updateDomain, deleteDomain } = useDomains();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | undefined>();
  const [deletingDomain, setDeletingDomain] = useState<Domain | undefined>();

  const filteredDomains = domains.filter(domain =>
    domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    toStringSafe(domain.description).toLowerCase().includes(searchQuery.toLowerCase()) ||
    domain.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDomain = async (data: { id: string; name: string; description: string; icon_name?: string }) => {
    await createDomain(data);
    setShowCreateModal(false);
  };

  const handleUpdateDomain = async (data: { id: string; name: string; description: string; icon_name?: string }) => {
    if (editingDomain) {
      await updateDomain(editingDomain.id, data);
      setEditingDomain(undefined);
    }
  };

  const handleDeleteDomain = async () => {
    if (deletingDomain) {
      await deleteDomain(deletingDomain.id);
      setDeletingDomain(undefined);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Domain Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage learning domains for the platform
        </p>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{domains.length}</div>
              <div className="text-sm text-muted-foreground">Total Domains</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {domains.filter(d => d.name.toLowerCase().includes('test')).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Domains</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {new Set(domains.map(d => d.icon_name)).size}
              </div>
              <div className="text-sm text-muted-foreground">Unique Icons</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Domains</CardTitle>
          <CardDescription>
            Add, edit, or remove learning domains from the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </div>

          {/* Domains Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No domains found matching your search.' : 'No domains found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDomains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {domain.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{domain.name}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{toStringSafe(domain.description)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{domain.icon_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(domain.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDomain(domain)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingDomain(domain)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the "{domain.name}" domain? 
                                  This action cannot be undone and may affect existing curricula.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteDomain}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <DomainFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDomain}
      />

      <DomainFormModal
        domain={editingDomain}
        open={!!editingDomain}
        onClose={() => setEditingDomain(undefined)}
        onSubmit={handleUpdateDomain}
      />
    </div>
  );
};

export default DomainManagement;