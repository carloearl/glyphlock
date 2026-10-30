import { Navigate } from 'react-router-dom';

// Preserve old bookmarks; Payroll is the only employee payroll workspace.
export default function OfficialChecks() {
  return <Navigate to="/Payroll" replace />;
}
