import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { recordNavigation } from '@/lib/nups/navStack';
import { NUPSPermissionsProvider } from '@/components/nups/hooks/useNUPSPermissions';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SettlementReports from './pages/SettlementReports';
import GovernanceHub from './pages/GovernanceHub';
import NUPSPostLogin from './pages/NUPSPostLogin';
import SystemAudit from './pages/SystemAudit';
import OfficialChecks from './pages/OfficialChecks';
import NUPSLanding from './pages/NUPSLanding';
import NUPSSandbox from './pages/NUPSSandbox';
import NUPSOwner from './pages/NUPSOwner';
import NUPSStaff from './pages/NUPSStaff';
import NUPSPostImplementationReport from './pages/NUPSPostImplementationReport';
import CaseStudyNUPS from './pages/CaseStudyNUPS';
import NUPSDemoManager from './pages/NUPSDemoManager';
import NUPSStateDiff from './pages/NUPSStateDiff';
import DailyPerformanceReport from './pages/DailyPerformanceReport';
import NUPSMISReport from './pages/NUPSMISReport';
import ImageShare from './pages/ImageShare';
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
import ClubTV from './pages/ClubTV';
import ActivityLogViewer from './pages/ActivityLogViewer';
import DailySettlementDashboard from './pages/DailySettlementDashboard';
import DriverPayoutHistory from './pages/DriverPayoutHistory';
import FrontDoor from './pages/FrontDoor';
import BarRegister from './pages/BarRegister';
import Accounting from './pages/Accounting';
import AuditIntegrity from './pages/AuditIntegrity';
import PaymentReconciliation from './pages/PaymentReconciliation';
import FinancialResolution from './pages/FinancialResolution';
import UnifiedSearch from './pages/UnifiedSearch';
import Tonight from './pages/Tonight';
import VenueAdminSettings from './pages/VenueAdminSettings';
import MobileScanner from './pages/MobileScanner';
import ContractsHub from './pages/ContractsHub';
import RegisterConsole from './pages/RegisterConsole';
import Receipts from './pages/Receipts';
import DriverPayouts from './pages/DriverPayouts';
import NUPSHub from './pages/NUPSHub';
import BotAnalytics from './pages/BotAnalytics';
import EntertainerCheckIn from './pages/EntertainerCheckIn';
import StaffHome from './pages/StaffHome';
import EntertainerHome from './pages/EntertainerHome';
import ManagerConsole from './pages/ManagerConsole';
import PeopleArchive from './pages/PeopleArchive';
import LedgerTrialBalance from './pages/LedgerTrialBalance';
import AccountingHub from './pages/AccountingHub';
import RegistryAdmin from './pages/RegistryAdmin';
import AdminDataManager from './pages/AdminDataManager';
import ArchitecturalDecisionRegister from './pages/ArchitecturalDecisionRegister';
import NUPSAdminPortal from './pages/NUPSAdminPortal';
import VIPShowVerify from './pages/VIPShowVerify';
import OfflineVerify from './pages/OfflineVerify';
import VerifyDispatch from './pages/VerifyDispatch';
import VIPShowContracts from './pages/VIPShowContracts';
import VIPCommandCenter from './pages/VIPCommandCenter';
import NUPSKiosk from './pages/NUPSKiosk';
import VIPSale from './pages/VIPSale';
import AccessRequests from './pages/AccessRequests';
import RoleViews from './pages/RoleViews';
import DJHome from './pages/DJHome';
import KioskShell from './components/nups/KioskShell';
import KioskSessionGuard from './components/nups/KioskSessionGuard';
import RoleClassGuard from './components/nups/RoleClassGuard';
import RoleClassBadge from './components/nups/RoleClassBadge';
import GlobalBackButton from './components/nups/GlobalBackButton';
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
  const location = useLocation();

  // Record EVERY route change in the central nav stack (idempotent), before
  // children render — so the Back button works on all pages, not only pages
  // that kept it mounted while navigating.
  recordNavigation(location.pathname + location.search);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const currentPathLower = currentPath.toLowerCase();
  const nupsPublicPaths = ['/nupslanding', '/nupsgateway', '/nupssandbox', '/nupslogin', '/unauthorized', '/entertainercheckin', '/demo/', '/v/', '/offlineverify', '/nupskiosk', '/vipsale', '/managerconsole'];
  const isNupsPublicRoute = nupsPublicPaths.some(p => currentPathLower.startsWith(p));

  if (authError && !isNupsPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Fullscreen pages that must render WITHOUT the GlyphLock layout wrapper.
  // All NUPS operator pages live here so kiosk mode shows only the NUPS UI.
  const fullscreenPaths = [
    '/nupslanding', '/landing', '/nupsgateway', '/unauthorized',
    '/nupssandbox', '/nupslogin', '/nupsowner', '/nupsstaff',
    '/frontdoor', '/entertainercheckin', '/staffhome', '/entertainerhome', '/glyphlockfinancialpage',
    '/nupsinfrastructurepage', '/demo/', '/clubtv', '/mobilescanner',
    // NUPS operator surface — kiosk-wrapped
    '/nupshub', '/hub', '/register', '/registerconsole', '/barregister',
    '/receipts', '/driverpayouts', '/glyphbuckshub',
    '/accounting', '/tonight', '/contracts', '/contractshub',
    '/managerconsole', '/peoplearchive', '/ledgertrialbalance', '/admin/ledger',
    '/accountinghub', '/admin/accounting-reports',
    '/admin/settlement', '/admin/payout-history', '/admin/activity-log',
    '/admin/audit-integrity', '/admin/payment-reconciliation', '/admin/financial-resolution', '/admin/venue-settings',
    '/admin/registry', '/registryadmin', '/admin/data', '/admindatamanager',
    '/admin/adr', '/architecturaldecisionregister',
    '/nupsadminportal', '/NUPSAdminPortal',
    '/v/', '/vipshowcontracts', '/offlineverify', '/vipcommand',
    '/nupskiosk', '/vipsale', '/accessrequests', '/roleviews', '/djhome',
  ];
  const isFullscreen = fullscreenPaths.some(p => currentPathLower.startsWith(p));

  // Every NUPS surface gets the kiosk shell. KioskShell auto-engages kiosk
  // mode on mount so the entire NUPS system runs locked from first entry.
  // Exit requires Manager PIN.
  const nupsKioskRoots = [
    '/nupslanding', '/landing', '/nupsgateway',
    '/nupsowner', '/nupsstaff', '/frontdoor', '/entertainercheckin',
    '/staffhome', '/entertainerhome',
    '/nupshub', '/hub', '/register', '/registerconsole', '/barregister',
    '/receipts', '/driverpayouts', '/glyphbuckshub',
    '/accounting', '/tonight', '/contracts', '/contractshub',
    '/managerconsole', '/peoplearchive', '/ledgertrialbalance', '/admin/ledger',
    '/accountinghub', '/admin/accounting-reports',
    '/admin/settlement', '/admin/payout-history', '/admin/activity-log',
    '/admin/audit-integrity', '/admin/payment-reconciliation', '/admin/financial-resolution', '/admin/venue-settings',
    '/admin/registry', '/registryadmin', '/admin/data', '/admindatamanager',
    '/admin/adr', '/architecturaldecisionregister',
    '/nupsadminportal', '/NUPSAdminPortal',
    '/vipshowcontracts', '/vipcommand',
    '/vipsale', '/accessrequests', '/roleviews', '/djhome',
  ];
  const isNupsKioskRoute = nupsKioskRoots.some(p => currentPathLower.startsWith(p));

  if (isFullscreen) {
    // Lazily-imported NUPS operator pages — already imported elsewhere via the
    // pagesConfig loop. Re-import inline so they render under KioskShell here.
    const inner = (
      // Kiosk routes get the Back button inside the kiosk strip (KioskShell);
      // a second floating one stacked/overlaid content (overlay audit 2026-07-17).
      <><RoleClassBadge />{!isNupsKioskRoute && <GlobalBackButton />}<Routes>
        <Route path="/NUPSLanding" element={<NUPSLanding />} />
        <Route path="/nupslanding" element={<NUPSLanding />} />
        <Route path="/landing" element={<NUPSLanding />} />
        <Route path="/Landing" element={<NUPSLanding />} />
        {/* DACO-NUPS-ROLE-VIP-BUILD §3 — the kiosk is the ONLY operational
            entry. Legacy Gateway and Login routes redirect there so no old
            bookmark or link resurrects the fragmented login surfaces. */}
        <Route path="/NUPSGateway" element={<Navigate to="/NUPSKiosk" replace />} />
        <Route path="/nupsgateway" element={<Navigate to="/NUPSKiosk" replace />} />
        <Route path="/NUPSSandbox" element={<NUPSSandbox />} />
        <Route path="/nupssandbox" element={<NUPSSandbox />} />
        <Route path="/NUPSLogin" element={<Navigate to="/NUPSKiosk?panel=clockIn" replace />} />
        <Route path="/nupslogin" element={<Navigate to="/NUPSKiosk?panel=clockIn" replace />} />
        {/* NUPSOwner restored — hosts all legacy operator tabs
            (Analytics, GlyphBucks, Staff, VIP, Reports, Payroll, Audit Log,
            Admin, Demo Keys, etc.). Sidebar deep-links via ?tab=.
            DACO 003 §2: ADMIN-only. */}
        <Route path="/NUPSOwner" element={<RoleClassGuard allow={["ADMIN"]}><NUPSOwner /></RoleClassGuard>} />
        <Route path="/NUPSAdminPortal" element={<RoleClassGuard allow={["ADMIN"]}><NUPSAdminPortal /></RoleClassGuard>} />
        <Route path="/nupsadminportal" element={<RoleClassGuard allow={["ADMIN"]}><NUPSAdminPortal /></RoleClassGuard>} />
        <Route path="/nupsowner" element={<RoleClassGuard allow={["ADMIN"]}><NUPSOwner /></RoleClassGuard>} />
        <Route path="/NUPSStaff" element={<NUPSStaff />} />
        <Route path="/nupsstaff" element={<NUPSStaff />} />
        <Route path="/FrontDoor" element={<KioskSessionGuard roles={["DOOR_GIRL","DOORMAN"]}><FrontDoor /></KioskSessionGuard>} />
        <Route path="/frontdoor" element={<KioskSessionGuard roles={["DOOR_GIRL","DOORMAN"]}><FrontDoor /></KioskSessionGuard>} />
        <Route path="/EntertainerCheckIn" element={<EntertainerCheckIn />} />
        <Route path="/entertainercheckin" element={<EntertainerCheckIn />} />
        {/* DACO 003 §2 — dedicated class homes. Guards allow the class itself
            plus higher classes (managers/admins can shadow support them). */}
        <Route path="/StaffHome" element={<RoleClassGuard allow={["STAFF","MANAGER","ADMIN"]}><StaffHome /></RoleClassGuard>} />
        <Route path="/staffhome" element={<RoleClassGuard allow={["STAFF","MANAGER","ADMIN"]}><StaffHome /></RoleClassGuard>} />
        <Route path="/EntertainerHome" element={<RoleClassGuard allow={["ENTERTAINER","MANAGER","ADMIN"]}><EntertainerHome /></RoleClassGuard>} />
        <Route path="/entertainerhome" element={<RoleClassGuard allow={["ENTERTAINER","MANAGER","ADMIN"]}><EntertainerHome /></RoleClassGuard>} />
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
        <Route path="/ClubTV" element={<ClubTV />} />
        <Route path="/clubtv" element={<ClubTV />} />
        <Route path="/MobileScanner" element={<MobileScanner />} />
        <Route path="/mobilescanner" element={<MobileScanner />} />
        {/* NUPS operator surface */}
        <Route path="/NUPSHub" element={<NUPSHub />} />
        <Route path="/nupshub" element={<NUPSHub />} />
        <Route path="/Hub" element={<NUPSHub />} />
        {/* DACO 003 §2: MANAGER + ADMIN only. */}
        <Route path="/ManagerConsole" element={<KioskSessionGuard roles={["VENUE_MANAGER"]}><ManagerConsole /></KioskSessionGuard>} />
        <Route path="/managerconsole" element={<KioskSessionGuard roles={["VENUE_MANAGER"]}><ManagerConsole /></KioskSessionGuard>} />
        <Route path="/PeopleArchive" element={<PeopleArchive />} />
        <Route path="/peoplearchive" element={<PeopleArchive />} />
        {/* DACO 003 §2: ADMIN-only accounting surfaces. */}
        <Route path="/LedgerTrialBalance" element={<RoleClassGuard allow={["ADMIN"]}><LedgerTrialBalance /></RoleClassGuard>} />
        <Route path="/ledgertrialbalance" element={<RoleClassGuard allow={["ADMIN"]}><LedgerTrialBalance /></RoleClassGuard>} />
        <Route path="/admin/ledger" element={<RoleClassGuard allow={["ADMIN"]}><LedgerTrialBalance /></RoleClassGuard>} />
        <Route path="/AccountingHub" element={<RoleClassGuard allow={["ADMIN"]}><AccountingHub /></RoleClassGuard>} />
        <Route path="/accountinghub" element={<RoleClassGuard allow={["ADMIN"]}><AccountingHub /></RoleClassGuard>} />
        <Route path="/admin/accounting-reports" element={<RoleClassGuard allow={["ADMIN"]}><AccountingHub /></RoleClassGuard>} />
        <Route path="/Register" element={<RegisterConsole />} />
        <Route path="/register" element={<RegisterConsole />} />
        <Route path="/RegisterConsole" element={<RegisterConsole />} />
        {/* Bar Register — BARTENDER's dedicated station (rev 3). */}
        <Route path="/BarRegister" element={<KioskSessionGuard roles={["BARTENDER"]}><BarRegister /></KioskSessionGuard>} />
        <Route path="/barregister" element={<KioskSessionGuard roles={["BARTENDER"]}><BarRegister /></KioskSessionGuard>} />
        <Route path="/Receipts" element={<Receipts />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/DriverPayouts" element={<DriverPayouts />} />
        <Route path="/driverpayouts" element={<DriverPayouts />} />
        {/* GlyphBucks merged into the VIP Command Center (merge directive
            2026-07-17) — old hub links land on the GlyphBucks tab. */}
        <Route path="/GlyphBucksHub" element={<Navigate to="/VIPCommand?tab=GlyphBucks" replace />} />
        <Route path="/glyphbuckshub" element={<Navigate to="/VIPCommand?tab=GlyphBucks" replace />} />
        <Route path="/Accounting" element={<Accounting />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/Tonight" element={<Tonight />} />
        <Route path="/tonight" element={<Tonight />} />
        {/* Contracts Hub hosts entertainer onboarding + VIP generation +
            GlyphBucks sales — MANAGER/ADMIN only (audit fix 2026-07-17). */}
        <Route path="/Contracts" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><ContractsHub /></RoleClassGuard>} />
        <Route path="/contracts" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><ContractsHub /></RoleClassGuard>} />
        <Route path="/ContractsHub" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><ContractsHub /></RoleClassGuard>} />
        {/* DACO 003 §2: ADMIN-only admin/audit/registry surfaces. */}
        <Route path="/admin/settlement" element={<RoleClassGuard allow={["ADMIN"]}><DailySettlementDashboard /></RoleClassGuard>} />
        <Route path="/admin/payout-history" element={<RoleClassGuard allow={["ADMIN"]}><DriverPayoutHistory /></RoleClassGuard>} />
        <Route path="/admin/activity-log" element={<RoleClassGuard allow={["ADMIN"]}><ActivityLogViewer /></RoleClassGuard>} />
        <Route path="/admin/audit-integrity" element={<RoleClassGuard allow={["ADMIN"]}><AuditIntegrity /></RoleClassGuard>} />
        <Route path="/admin/payment-reconciliation" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><PaymentReconciliation /></RoleClassGuard>} />
        <Route path="/admin/financial-resolution" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><FinancialResolution /></RoleClassGuard>} />
        <Route path="/FinancialResolution" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><FinancialResolution /></RoleClassGuard>} />
        <Route path="/admin/venue-settings" element={<RoleClassGuard allow={["ADMIN"]}><VenueAdminSettings /></RoleClassGuard>} />
        <Route path="/admin/data" element={<RoleClassGuard allow={["ADMIN"]}><AdminDataManager /></RoleClassGuard>} />
        <Route path="/AdminDataManager" element={<RoleClassGuard allow={["ADMIN"]}><AdminDataManager /></RoleClassGuard>} />
        <Route path="/admindatamanager" element={<RoleClassGuard allow={["ADMIN"]}><AdminDataManager /></RoleClassGuard>} />
        <Route path="/admin/registry" element={<RoleClassGuard allow={["ADMIN"]}><RegistryAdmin /></RoleClassGuard>} />
        <Route path="/RegistryAdmin" element={<RoleClassGuard allow={["ADMIN"]}><RegistryAdmin /></RoleClassGuard>} />
        <Route path="/registryadmin" element={<RoleClassGuard allow={["ADMIN"]}><RegistryAdmin /></RoleClassGuard>} />
        <Route path="/admin/adr" element={<RoleClassGuard allow={["ADMIN"]}><ArchitecturalDecisionRegister /></RoleClassGuard>} />
        <Route path="/ArchitecturalDecisionRegister" element={<RoleClassGuard allow={["ADMIN"]}><ArchitecturalDecisionRegister /></RoleClassGuard>} />
        <Route path="/architecturaldecisionregister" element={<RoleClassGuard allow={["ADMIN"]}><ArchitecturalDecisionRegister /></RoleClassGuard>} />
        {/* DACO VIP SHOW CONTRACT SYSTEM v2 */}
        {/* VRF-… refs = GlyphBucks stored-value seals; others = VIP Show contracts */}
        <Route path="/v/:ref" element={<VerifyDispatch />} />
        <Route path="/OfflineVerify" element={<OfflineVerify />} />
        <Route path="/offlineverify" element={<OfflineVerify />} />
        <Route path="/VIPCommand" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><VIPCommandCenter /></RoleClassGuard>} />
        <Route path="/vipcommand" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><VIPCommandCenter /></RoleClassGuard>} />
        <Route path="/VIPShowContracts" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><VIPShowContracts /></RoleClassGuard>} />
        <Route path="/vipshowcontracts" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><VIPShowContracts /></RoleClassGuard>} />
        {/* DACO-NUPS-ROLE-VIP-BUILD-20260717 — role-gated kiosk system */}
        <Route path="/NUPSKiosk" element={<NUPSKiosk />} />
        <Route path="/nupskiosk" element={<NUPSKiosk />} />
        <Route path="/DJHome" element={<KioskSessionGuard roles={["DJ"]}><DJHome /></KioskSessionGuard>} />
        <Route path="/djhome" element={<KioskSessionGuard roles={["DJ"]}><DJHome /></KioskSessionGuard>} />
        <Route path="/VIPSale" element={<KioskSessionGuard roles={["HOSTESS","FLOOR_HOST"]}><VIPSale /></KioskSessionGuard>} />
        <Route path="/vipsale" element={<KioskSessionGuard roles={["HOSTESS","FLOOR_HOST"]}><VIPSale /></KioskSessionGuard>} />
        <Route path="/AccessRequests" element={<RoleClassGuard allow={["ADMIN"]}><AccessRequests /></RoleClassGuard>} />
        <Route path="/accessrequests" element={<RoleClassGuard allow={["ADMIN"]}><AccessRequests /></RoleClassGuard>} />
        <Route path="/RoleViews" element={<RoleClassGuard allow={["ADMIN"]}><RoleViews /></RoleClassGuard>} />
        <Route path="/roleviews" element={<RoleClassGuard allow={["ADMIN"]}><RoleViews /></RoleClassGuard>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes></>
    );
    return isNupsKioskRoute ? <KioskShell>{inner}</KioskShell> : inner;
  }

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <GlobalBackButton />
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
        <Route path="/NUPSStateDiff" element={<NUPSStateDiff />} />
        <Route path="/nupsstatediff" element={<NUPSStateDiff />} />
        <Route path="/DailyPerformanceReport" element={<DailyPerformanceReport />} />
        <Route path="/dailyperformancereport" element={<DailyPerformanceReport />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/CaseStudyNUPS" element={<CaseStudyNUPS />} />
        <Route path="/admin/activity-log" element={<LayoutWrapper currentPageName="ActivityLogViewer"><ActivityLogViewer /></LayoutWrapper>} />
        <Route path="/admin/settlement" element={<LayoutWrapper currentPageName="DailySettlementDashboard"><DailySettlementDashboard /></LayoutWrapper>} />
        <Route path="/admin/payout-history" element={<LayoutWrapper currentPageName="DriverPayoutHistory"><DriverPayoutHistory /></LayoutWrapper>} />
        <Route path="/Accounting" element={<LayoutWrapper currentPageName="Accounting"><Accounting /></LayoutWrapper>} />
        <Route path="/accounting" element={<LayoutWrapper currentPageName="Accounting"><Accounting /></LayoutWrapper>} />
        <Route path="/admin/audit-integrity" element={<LayoutWrapper currentPageName="AuditIntegrity"><AuditIntegrity /></LayoutWrapper>} />
        <Route path="/Search" element={<LayoutWrapper currentPageName="UnifiedSearch"><UnifiedSearch /></LayoutWrapper>} />
        <Route path="/search" element={<LayoutWrapper currentPageName="UnifiedSearch"><UnifiedSearch /></LayoutWrapper>} />
        <Route path="/Tonight" element={<LayoutWrapper currentPageName="Tonight"><Tonight /></LayoutWrapper>} />
        <Route path="/tonight" element={<LayoutWrapper currentPageName="Tonight"><Tonight /></LayoutWrapper>} />
        <Route path="/admin/venue-settings" element={<LayoutWrapper currentPageName="VenueAdminSettings"><VenueAdminSettings /></LayoutWrapper>} />
        <Route path="/Contracts" element={<LayoutWrapper currentPageName="ContractsHub"><ContractsHub /></LayoutWrapper>} />
        <Route path="/contracts" element={<LayoutWrapper currentPageName="ContractsHub"><ContractsHub /></LayoutWrapper>} />
        <Route path="/ContractsHub" element={<LayoutWrapper currentPageName="ContractsHub"><ContractsHub /></LayoutWrapper>} />
        <Route path="/Register" element={<LayoutWrapper currentPageName="RegisterConsole"><RegisterConsole /></LayoutWrapper>} />
        <Route path="/register" element={<LayoutWrapper currentPageName="RegisterConsole"><RegisterConsole /></LayoutWrapper>} />
        <Route path="/RegisterConsole" element={<LayoutWrapper currentPageName="RegisterConsole"><RegisterConsole /></LayoutWrapper>} />
        <Route path="/Receipts" element={<LayoutWrapper currentPageName="Receipts"><Receipts /></LayoutWrapper>} />
        <Route path="/receipts" element={<LayoutWrapper currentPageName="Receipts"><Receipts /></LayoutWrapper>} />
        <Route path="/DriverPayouts" element={<LayoutWrapper currentPageName="DriverPayouts"><DriverPayouts /></LayoutWrapper>} />
        <Route path="/driverpayouts" element={<LayoutWrapper currentPageName="DriverPayouts"><DriverPayouts /></LayoutWrapper>} />
        <Route path="/NUPSHub" element={<LayoutWrapper currentPageName="NUPSHub"><NUPSHub /></LayoutWrapper>} />
        <Route path="/nupshub" element={<LayoutWrapper currentPageName="NUPSHub"><NUPSHub /></LayoutWrapper>} />
        <Route path="/Hub" element={<LayoutWrapper currentPageName="NUPSHub"><NUPSHub /></LayoutWrapper>} />
        <Route path="/BotAnalytics" element={<LayoutWrapper currentPageName="BotAnalytics"><BotAnalytics /></LayoutWrapper>} />
        <Route path="/botanalytics" element={<LayoutWrapper currentPageName="BotAnalytics"><BotAnalytics /></LayoutWrapper>} />
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
            <NUPSPermissionsProvider>
              <AuthenticatedApp />
            </NUPSPermissionsProvider>
          </ErrorBoundary>
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App