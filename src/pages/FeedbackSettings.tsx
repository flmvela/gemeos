import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, Brain, Target, Gamepad2, Trophy, CheckSquare, Heart } from 'lucide-react';
import { useFeedbackConfig } from '@/hooks/useFeedbackConfig';
import { useDomains } from '@/hooks/useDomains';
import { toast } from '@/hooks/use-toast';
import { toStringSafe } from '@/lib/utils';

const FeedbackSettings = () => {
  const { configs, loading: configLoading, updateConfig } = useFeedbackConfig();
  const { domains, loading: domainsLoading } = useDomains();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (configId: string, currentValue: boolean) => {
    setUpdating(configId);
    try {
      await updateConfig(configId, !currentValue);
      toast({
        title: "Settings updated",
        description: `Feedback loop ${!currentValue ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback settings.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getAspectIcon = (aspect: string) => {
    switch (aspect) {
      case 'concepts':
        return <Brain className="h-4 w-4" />;
      case 'learning_goals':
        return <Target className="h-4 w-4" />;
      case 'exercises':
        return <CheckSquare className="h-4 w-4" />;
      case 'strategies':
        return <Settings className="h-4 w-4" />;
      case 'gamification':
        return <Gamepad2 className="h-4 w-4" />;
      case 'tasks':
        return <CheckSquare className="h-4 w-4" />;
      case 'motivation':
        return <Heart className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getAspectLabel = (aspect: string) => {
    switch (aspect) {
      case 'concepts':
        return 'Concepts';
      case 'learning_goals':
        return 'Learning Goals';
      case 'exercises':
        return 'Exercises';
      case 'strategies':
        return 'Learning Strategies';
      case 'gamification':
        return 'Gamification';
      case 'tasks':
        return 'Tasks';
      case 'motivation':
        return 'Motivation';
      default:
        return aspect.charAt(0).toUpperCase() + aspect.slice(1);
    }
  };

  const getAspectDescription = (aspect: string) => {
    switch (aspect) {
      case 'concepts':
        return 'AI will learn from approved/rejected concepts to improve future suggestions';
      case 'learning_goals':
        return 'AI will learn from approved/rejected learning goals to improve future suggestions';
      case 'exercises':
        return 'AI will learn from approved/rejected exercises to improve future suggestions';
      case 'strategies':
        return 'AI will learn from approved/rejected learning strategies to improve future suggestions';
      case 'gamification':
        return 'AI will learn from approved/rejected gamification elements to improve future suggestions';
      case 'tasks':
        return 'AI will learn from approved/rejected tasks to improve future suggestions';
      case 'motivation':
        return 'AI will learn from approved/rejected motivation techniques to improve future suggestions';
      default:
        return `AI feedback learning for ${aspect}`;
    }
  };

  if (configLoading || domainsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.domain_id]) {
      acc[config.domain_id] = [];
    }
    acc[config.domain_id].push(config);
    return acc;
  }, {} as Record<string, typeof configs>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Feedback Settings</h1>
        <p className="text-muted-foreground">
          Configure AI training feedback loops for each domain and learning aspect.
        </p>
      </div>

      <div className="grid gap-6">
        {domains.map((domain) => {
          const domainConfigs = groupedConfigs[domain.id] || [];
          
          return (
            <Card key={domain.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {domain.icon_name && (
                    <span className="text-xl">{domain.icon_name}</span>
                  )}
                  {domain.name}
                </CardTitle>
                <CardDescription>
                  {toStringSafe(domain.description)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {domainConfigs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No feedback configurations found for this domain.
                    </p>
                  ) : (
                    domainConfigs.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getAspectIcon(config.aspect)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {getAspectLabel(config.aspect)}
                              </span>
                              <Badge variant={config.is_enabled ? "default" : "secondary"}>
                                {config.is_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getAspectDescription(config.aspect)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {updating === config.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <Switch
                            checked={config.is_enabled}
                            onCheckedChange={() => handleToggle(config.id, config.is_enabled)}
                            disabled={updating === config.id}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FeedbackSettings;