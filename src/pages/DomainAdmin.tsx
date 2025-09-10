import React from "react";
import { useParams } from "react-router-dom";
import { AdminDomainPage } from "../components/AdminDomainPage";
import { useDomainSlug } from "@/hooks/useDomainSlug";

export default function DomainAdmin() {
  const { slug, domainId } = useParams();
  // Support both slug and domainId parameters for backward compatibility
  const identifier = slug || domainId || "";
  const { domain, loading, error } = useDomainSlug(identifier);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !domain) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Domain Not Found</h2>
          <p className="text-gray-600">{error || "The requested domain could not be found."}</p>
        </div>
      </div>
    );
  }
  
  return <AdminDomainPage domainName={domain.name} />;
}
