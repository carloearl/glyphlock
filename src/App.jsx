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
import NUPSLogin from './pages/NUPSLogin';
import NUPSOwner from './pages/NUPSOwner';
import NUPSStaff from './pages/NUPSStaff';
import NUPSPostImplementationReport from './pages/NUPSPostImplementationReport';
import CaseStudyNUPS from './pages/CaseStudyNUPS';
import NUPSDemoManager from './pages/NUPSDemoManager';
import NUPSMISReport from './pages/NUPSMISReport';
import ImageShare from './pages/ImageShare';
import GlyphBucksHub from './pages/GlyphBucksHub';
import ContractLookup from './pages/ContractLookup';
import Unauthorized from './pages/Unauthorized';
import NUPSInfrastructurePage from './pages/NUPSInfrastructurePage';
import GlyphLockFinancialPage from './pages/GlyphLockFinancialPage';
import DemoGate from './pages/DemoGate';
import CommandCenterDemo from './pages/CommandCenterDemo';
import DemoFloorStatus from './pages/DemoFloorStatus';
import DemoOpenNightPreview from './pages/DemoOpenNightPreview';
import DemoVipBoardPreview from './pages/DemoVipBoardPreview';
import DemoPosRegisterPreview from './pages/DemoPosRegisterPreview';
import DemoCloseNightPreview from './pages/DemoCloseNightPreview';
import DemoCompliancePreview from './pages/DemoCompliancePreview';
import { ErrorBoundary } from './components/ErrorBoundary';


const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentPath = window.location.pathname;
  const currentPathLower = currentPath.toLowerCase();
  const nupsPublicPaths = ['/nupslanding', '/nupsgateway', '/nupssandbox', '/nupslogin', '/unauthorized', '/entertainercheckin'];
  const isNupsPublicRoute = nupsPublicPaths.some(p => currentPathLower.startsWith(p));

  if (authError && !isNupsPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Fullscreen pages that must render WITHOUT the layout wrapper
  const fullscreenPaths = ['/nupslanding', '/nupsgateway', '/unauthorized', '/nupssandbox', '/nupslogin', '/nupsowner', '/nupsstaff', '/entertainercheckin', '/glyphlockfinancialpage', '/nupsinfrastructurepage', '/demo/'];
  const isFullscreen = fullscreenPaths.some(p => currentPathLower.startsWith(p));

  if (isFullscreen) {
    return (
      <Routes>
        <Route path="/NUPSLanding" element={<NUPSLanding />} />
        <Route path="/nupslanding" element={<NUPSLanding />} />
        <Route path="/NUPSGateway" element={<NUPSGateway />} />
        <Route path="/nupsgateway" element={<NUPSGateway />} />
        <Route path="/NUPSSandbox" element={<NUPSSandbox />} />
        <Route path="/nupssandbox" element={<NUPSSandbox />} />
        <Route path="/NUPSLogin" element={<NUPSLogin />} />
        <Route path="/nupslogin" element={<NUPSLogin />} />
        <Route path="/NUPSOwner" element={<NUPSOwner />} />
        <Route path="/nupsowner" element={<NUPSOwner />} />
        <Route path="/NUPSStaff" element={<NUPSStaff />} />
        <Route path="/nupsstaff" element={<NUPSStaff />} />
        <Route path="/NUPSInfrastructurePage" element={<NUPSInfrastructurePage />} />
        <Route path="/nupsinfrastructurepage" element={<NUPSInfrastructurePage />} />
        <Route path="/GlyphLockFinancialPage" element={<GlyphLockFinancialPage />} />
        <Route path="/glyphlockfinancialpage" element={<GlyphLockFinancialPage />} />
        <Route path="/demo/gate" element={<DemoGate />} />
        <Route path="/demo/command-center" element={<CommandCenterDemo />} />
        <Route path="/demo/floor-status" element={<DemoFloorStatus />} />
        <Route path="/demo/open-night-preview" element={<DemoOpenNightPreview />} />
        <Route path="/demo/vip-board-preview" element={<DemoVipBoardPreview />} />
        <Route path="/demo/pos-register-preview" element={<DemoPosRegisterPreview />} />
        <Route path="/demo/close-night-preview" element={<DemoCloseNightPreview />} />
        <Route path="/demo/compliance-preview" element={<DemoCompliancePreview />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="/AnalyticsDashboard" element={<LayoutWrapper currentPageName="AnalyticsDashboard"><AnalyticsDashboard /></LayoutWrapper>} />
        <Route path="/SettlementReports" element={<LayoutWrapper currentPageName="SettlementReports"><SettlementReports /></LayoutWrapper>} />
        <Route path="/GovernanceHub" element={<LayoutWrapper currentPageName="GovernanceHub"><GovernanceHub /></LayoutWrapper>} />
        <Route path="/NUPSPostLogin" element={<NUPSPostLogin />} />
        <Route path="/NUPSMISReport" element={<NUPSMISReport />} />
        <Route path="/NUPSDemoManager" element={<NUPSDemoManager />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/CaseStudyNUPS" element={<CaseStudyNUPS />} />
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
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App