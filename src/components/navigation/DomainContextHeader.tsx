import { DynamicBreadcrumb } from './DynamicBreadcrumb';

export function DomainContextHeader() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
    </div>
  );
}