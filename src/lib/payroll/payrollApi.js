import { base44 } from '@/api/base44Client';

/**
 * Employee payroll calls always go through the employeePayrollCheck function.
 * The client never decides tenant, mode, check number, status or totals.
 */
async function call(payload) {
  const response = await base44.functions.invoke('employeePayrollCheck', payload);
  const data = response?.data || {};
  if (data.error) {
    const error = new Error(data.error);
    error.code = data.error;
    error.errors = data.errors || [];
    throw error;
  }
  return data;
}

export const listChecks = (scope = {}) => call({ action: 'list', ...scope });

export const createDraft = (payload = {}) => call({ action: 'create_draft', ...payload });

export const reviewCheck = (payload = {}) => call({ action: 'review', ...payload });