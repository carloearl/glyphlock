import { base44 } from '@/api/base44Client';

/**
 * Employee payroll calls always go through the employeePayrollCheck function.
 * The client never decides tenant, mode, check number, status or totals.
 */
async function call(payload) {
  let response;
  try { response = await base44.functions.invoke('employeePayrollCheck', payload); }
  catch (failure) {
    const details = failure?.response?.data;
    if (!details?.error) throw failure;
    const error = new Error(details.error);
    error.code = details.error;
    error.errors = details.errors || [];
    throw error;
  }
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
export const loadPayrollWorkspace = (scope = {}) => call({ action: 'workspace', ...scope });
export const savePayrollEmployee = (scope, employee) => call({ action: 'save_employee', ...scope, employee });
