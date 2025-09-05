/**
 * Email Dashboard Component
 * Displays email statistics and management interface
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailQueue, useEmailLogs } from '@/hooks/useEmail';
import { Mail, Send, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const EmailDashboard: React.FC = () => {
  const { queueItems, loading: queueLoading, fetchQueueItems, cancelQueueItem, retryQueueItem } = useEmailQueue();
  const { logs, stats, loading: logsLoading, fetchLogs, fetchStats } = useEmailLogs();

  useEffect(() => {
    fetchQueueItems();
    fetchLogs({ limit: 50 });
    fetchStats();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'default';
      case 'pending':
      case 'queued':
        return 'secondary';
      case 'failed':
      case 'bounced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent}</div>
              <p className="text-xs text-muted-foreground">
                {stats.delivery_rate.toFixed(1)}% delivery rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_delivered}</div>
              <p className="text-xs text-muted-foreground">
                {stats.open_rate.toFixed(1)}% open rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_failed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.bounce_rate.toFixed(1)}% bounce rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queued</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {queueItems.filter(item => ['pending', 'queued'].includes(item.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Management Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue</CardTitle>
              <CardDescription>
                Emails waiting to be sent or recently processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {queueLoading ? (
                    <p className="text-center text-muted-foreground">Loading queue...</p>
                  ) : queueItems.length === 0 ? (
                    <p className="text-center text-muted-foreground">No emails in queue</p>
                  ) : (
                    queueItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          {getStatusIcon(item.status)}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{item.to_email}</p>
                            <p className="text-sm text-muted-foreground">{item.subject}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getStatusBadgeVariant(item.status)}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline">{item.template_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            {item.error_message && (
                              <p className="text-xs text-red-500">{item.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryQueueItem(item.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                          {['pending', 'queued'].includes(item.status) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelQueueItem(item.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                Historical record of all sent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {logsLoading ? (
                    <p className="text-center text-muted-foreground">Loading logs...</p>
                  ) : logs.length === 0 ? (
                    <p className="text-center text-muted-foreground">No email logs found</p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          {getStatusIcon(log.status)}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{log.to_email}</p>
                            <p className="text-sm text-muted-foreground">{log.subject}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getStatusBadgeVariant(log.status)}>
                                {log.status}
                              </Badge>
                              <Badge variant="outline">{log.template_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                              {log.opened_at && (
                                <span className="text-xs text-green-600">Opened</span>
                              )}
                              {log.clicked_at && (
                                <span className="text-xs text-blue-600">Clicked</span>
                              )}
                            </div>
                            {log.error_message && (
                              <p className="text-xs text-red-500">{log.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {log.provider_message_id && (
                            <p className="text-xs text-muted-foreground">
                              ID: {log.provider_message_id.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};