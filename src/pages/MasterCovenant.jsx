// DEPRECATED: Use GovernanceHub page instead
// This file redirects to the consolidated Governance Hub

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MasterCovenant() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(createPageUrl("GovernanceHub"), { replace: true });
  }, []);
  
  return null;
}