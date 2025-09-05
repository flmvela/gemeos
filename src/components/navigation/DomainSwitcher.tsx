import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, BookOpen } from 'lucide-react';
import { useDomains } from '@/hooks/useDomains';
import { cn } from '@/lib/utils';

export function DomainSwitcher() {
  const navigate = useNavigate();
  const { domainId } = useParams();
  const { domains, loading } = useDomains();
  const [open, setOpen] = useState(false);

  const currentDomain = domains.find(d => d.id === domainId);

  const handleDomainSelect = (selectedDomainId: string) => {
    if (selectedDomainId !== domainId) {
      navigate(`/admin/domain/${selectedDomainId}`);
    }
    setOpen(false);
  };

  if (loading || !currentDomain) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center space-x-2 truncate">
            <BookOpen className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{currentDomain.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0">
        {domains.map((domain) => (
          <DropdownMenuItem
            key={domain.id}
            onSelect={() => handleDomainSelect(domain.id)}
            className={cn(
              "flex items-center justify-between p-2 cursor-pointer",
              domain.id === domainId && "bg-muted"
            )}
          >
            <div className="flex items-center space-x-2 flex-1 truncate">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{domain.name}</span>
            </div>
            {domain.id === domainId && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Current
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}