import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CaseStudyAIBinding() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('ProvenanceMethodology'), { replace: true });
  }, [navigate]);

  return null;
}
