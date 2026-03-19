import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SettlementReports from './pages/SettlementReports';
import GovernanceHub from './pages/GovernanceHub';
import NUPSPostLogin from './pages/NUPSPostLogin';
import SystemAudit from './pages/SystemAudit';
import OfficialChecks from './pages/OfficialChecks';
import NUPSLanding from './pages/NUPSLanding';
import NUPSGateway from './pages/NUPSGateway';
import NUPSSandbox from './pages/NUPSSandbox';
import NUPSPostImplementationReport from './pages/NUPSPostImplementationReport';
import NUPSDemoManager from './pages/NUPSDemoManager';
import NUPSMISReport from './pages/NUPSMISReport';
import ImageShare from './pages/ImageShare';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors — but let NUPS public routes through
  const currentPath = window.location.pathname;
  const nupsPublicPaths = ['/NUPSLanding', '/NUPSGateway', '/NUPSSandbox', '/NUPSLogin'];
  const isNupsPublicRoute = nupsPublicPaths.some(p => currentPath.startsWith(p));

  if (authError && !isNupsPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="/AnalyticsDashboard" element={
          <LayoutWrapper currentPageName="AnalyticsDashboard">
            <AnalyticsDashboard />
          </LayoutWrapper>
        } />
        <Route path="/SettlementReports" element={
          <LayoutWrapper currentPageName="SettlementReports">
            <SettlementReports />
          </LayoutWrapper>
        } />
        <Route path="/GovernanceHub" element={
          <LayoutWrapper currentPageName="GovernanceHub">
            <GovernanceHub />
          </LayoutWrapper>
        } />
        <Route path="/NUPSPostLogin" element={<NUPSPostLogin />} />
        <Route path="/SystemAudit" element={
          <LayoutWrapper currentPageName="SystemAudit">
            <SystemAudit />
          </LayoutWrapper>
        } />
        <Route path="/OfficialChecks" element={<OfficialChecks />} />
        <Route path="/NUPSLanding" element={<NUPSLanding />} />
        <Route path="/NUPSGateway" element={<NUPSGateway />} />
        <Route path="/NUPSSandbox" element={<NUPSSandbox />} />
        <Route path="/NUPSMISReport" element={<NUPSMISReport />} />
        <Route path="/view/:assetId" element={<ImageShare />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App