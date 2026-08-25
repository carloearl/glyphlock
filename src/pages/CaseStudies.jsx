import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CaseStudies() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('TechnicalEvidence'), { replace: true });
  }, [navigate]);

  return null;
}
