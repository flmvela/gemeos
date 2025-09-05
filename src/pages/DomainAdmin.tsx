import React from "react";
import { useParams } from "react-router-dom";
import { AdminDomainPage } from "../components/AdminDomainPage";
import { useDomains } from "@/hooks/useDomains";

export default function DomainAdmin() {
  const { domainId } = useParams();
  const { domains } = useDomains();
  const domain = domains.find(d => d.id === (domainId || ""));
  const displayName = domain?.name ?? (domainId ?? "Domain");
  return <AdminDomainPage domainName={displayName} />;
}
