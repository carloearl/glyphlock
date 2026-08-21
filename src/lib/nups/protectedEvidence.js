import { base44 } from '@/api/base44Client';

export async function uploadProtectedEvidence({
  file,
  venueId,
  artifactType,
  classification,
  subjectEntity = '',
  subjectId = '',
  purpose = '',
  mode = 'REAL',
  signedUrlTtl = 120,
}) {
  if (!file) throw new Error('Protected evidence file is required.');
  if (!venueId) throw new Error('Active venue is required for protected evidence.');
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  if (!file_uri) throw new Error('Private upload returned no file reference.');
  const registration = await base44.functions.invoke('registerProtectedEvidence', {
    file_uri,
    venue_id: venueId,
    artifact_type: artifactType,
    classification,
    subject_entity: subjectEntity,
    subject_id: subjectId,
    purpose,
    mode,
    mime_type: file.type || '',
    file_name: file.name || '',
  });
  if (!registration?.data?.success) throw new Error(registration?.data?.error || 'Protected evidence registration failed.');
  let signed_url = null;
  if (signedUrlTtl > 0) {
    const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: signedUrlTtl });
    signed_url = signed?.signed_url || null;
  }
  return {
    file_uri,
    evidence_id: registration.data.evidence_id,
    evidence_ref: registration.data.evidence_ref,
    signed_url,
  };
}

export async function getProtectedEvidenceUrl(evidenceId, purpose = 'view') {
  const response = await base44.functions.invoke('getProtectedEvidence', { evidence_id: evidenceId, purpose });
  if (!response?.data?.success || !response?.data?.signed_url) {
    throw new Error(response?.data?.error || 'Protected evidence retrieval denied.');
  }
  return response.data;
}
