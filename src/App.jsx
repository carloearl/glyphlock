import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
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
import CodeOfEthics from './pages/CodeOfEthics';
import EmailDeliveryLogPage from './pages/EmailDeliveryLogPage';
import NUPSPostLogin from './pages/NUPSPostLogin';
import SystemAudit from './pages/SystemAudit';
import OfficialChecks from './pages/OfficialChecks';
import NUPSLanding from './pages/NUPSLanding';
import NUPSSandbox from './pages/NUPSSandbox';
import NUPSTraining from './pages/NUPSTraining';
import NUPSOwner from './pages/NUPSOwner';
import NUPSStaff from './pages/NUPSStaff';
import NUPSPostImplementationReport from './pages/NUPSPostImplementationReport';
import CaseStudyNUPS from './pages/CaseStudyNUPS';
import CaseStudyOracleOHIP from './pages/CaseStudyOracleOHIP';
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
import VIPBillPrinter from './pages/VIPBillPrinter';
import GlyphBucksConsole from './pages/GlyphBucksConsole';
import RegisterConsole from './pages/RegisterConsole';
import Receipts from './pages/Receipts';
import DriverPayouts from './pages/DriverPayouts';
import NUPSHub from './pages/NUPSHub';
import BotAnalytics from './pages/BotAnalytics';
import EntertainerCheckIn from './pages/EntertainerCheckIn';
import StaffHome from './pages/StaffHome';
import HostessHome from './pages/HostessHome';
import DoormanHome from './pages/DoormanHome';
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
import GlyphBotMixer from './pages/GlyphBotMixer';
import SecureQRStudio from './pages/SecureQRStudio';
import KioskShell from './components/nups/KioskShell';
import KioskSessionGuard from './components/nups/KioskSessionGuard';
import RoleClassGuard from './components/nups/RoleClassGuard';
import RoleClassBadge from './components/nups/RoleClassBadge';
import GlobalBackButton from './components/nups/GlobalBackButton';
import { ErrorBoundary } from './components/ErrorBoundary';


import '@/styles/nups-print.css';
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
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-300 rounded-full animate-spin"></div>
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
    '/frontdoor', '/entertainercheckin', '/staffhome', '/hostesshome', '/doormanhome', '/entertainerhome', '/glyphlockfinancialpage',
    '/nupsinfrastructurepage', '/demo/', '/clubtv', '/mobilescanner',
    // NUPS operator surface — kiosk-wrapped
    '/nupshub', '/hub', '/register', '/registerconsole', '/barregister',
    '/receipts', '/driverpayouts', '/glyphbuckshub', '/glyphbucks',
    '/accounting', '/tonight', '/contracts', '/contractshub', '/vipbillprinter', '/dancedollarscontract',
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
    '/staffhome', '/hostesshome', '/doormanhome', '/entertainerhome',
    '/nupshub', '/hub', '/register', '/registerconsole', '/barregister',
    '/receipts', '/driverpayouts', '/glyphbuckshub', '/glyphbucks',
    '/accounting', '/tonight', '/contracts', '/contractshub', '/vipbillprinter',
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
        <Route path="/NUPSTraining" element={<LayoutWrapper currentPageName="NUPSTraining"><NUPSTraining /></LayoutWrapper>} />
        <Route path="/nupstraining" element={<LayoutWrapper currentPageName="NUPSTraining"><NUPSTraining /></LayoutWrapper>} />

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
        <Route path="/HostessHome" element={<RoleClassGuard allow={["STAFF","MANAGER","ADMIN"]}><HostessHome /></RoleClassGuard>} />
        <Route path="/hostesshome" element={<RoleClassGuard allow={["STAFF","MANAGER","ADMIN"]}><HostessHome /></RoleClassGuard>} />
        <Route path="/DoormanHome" element={<RoleClassGuard allow={["STAFF","MANAGER","ADMIN"]}><DoormanHome /></RoleClassGuard>} />
        <Route path="/doormanhome" element={<RoleClassGuard allow={["STAFF","MANAGER","ADMIN"]}><DoormanHome /></RoleClassGuard>} />
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
        {/* GlyphBucks Console — the ONE directly-reachable home for the full
            GlyphBucks system (Sales · Redeem · Press · Ledger · Inventory ·
            Contract · Search · Fraud). Not kiosk-gated. */}
        <Route path="/GlyphBucks" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><GlyphBucksConsole /></RoleClassGuard>} />
        <Route path="/glyphbucks" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><GlyphBucksConsole /></RoleClassGuard>} />
        {/* Old GlyphBucksHub links land on the full console now. */}
        <Route path="/GlyphBucksHub" element={<Navigate to="/GlyphBucks" replace />} />
        <Route path="/glyphbuckshub" element={<Navigate to="/GlyphBucks" replace />} />
        <Route path="/Accounting" element={<Accounting />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/Tonight" element={<Tonight />} />
        <Route path="/tonight" element={<Tonight />} />
        {/* Contracts Hub hosts entertainer onboarding + VIP generation +
            GlyphBucks sales — MANAGER/ADMIN only (audit fix 2026-07-17). */}
        <Route path="/Contracts" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><ContractsHub /></RoleClassGuard>} />
        <Route path="/contracts" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><ContractsHub /></RoleClassGuard>} />
        <Route path="/ContractsHub" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><ContractsHub /></RoleClassGuard>} />
        {/* Dream Palace VIP GlyphBucks — physical bill printer */}
        <Route path="/VIPBillPrinter" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><VIPBillPrinter /></RoleClassGuard>} />
        <Route path="/vipbillprinter" element={<RoleClassGuard allow={["MANAGER","ADMIN"]}><VIPBillPrinter /></RoleClassGuard>} />
        {/* Legacy Dance Dollars Agreement / Invoice — separate instrument */}
        <Route path="/DanceDollarsContract" element={<Navigate to="/Contracts?tab=dance_dollars" replace />} />
        <Route path="/dancedollarscontract" element={<Navigate to="/Contracts?tab=dance_dollars" replace />} />
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
        <Route path="/SecureQRStudio" element={<SecureQRStudio />} />
        <Route path="/Qr" element={<Navigate to="/SecureQRStudio" replace />} />
        <Route path="/qr" element={<Navigate to="/SecureQRStudio" replace />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="/AnalyticsDashboard" element={<AnalyticsDashboard />} />
        <Route path="/SettlementReports" element={<SettlementReports />} />
        <Route path="/GovernanceHub" element={<GovernanceHub />} />
        <Route path="/CodeOfEthics" element={<CodeOfEthics />} />
        <Route path="/codeofethics" element={<CodeOfEthics />} />
        <Route path="/admin/email-log" element={<EmailDeliveryLogPage />} />
        <Route path="/NUPSPostLogin" element={<NUPSPostLogin />} />
        <Route path="/NUPSMISReport" element={<NUPSMISReport />} />
        <Route path="/NUPSDemoManager" element={<NUPSDemoManager />} />
        <Route path="/NUPSStateDiff" element={<NUPSStateDiff />} />
        <Route path="/nupsstatediff" element={<NUPSStateDiff />} />
        <Route path="/DailyPerformanceReport" element={<DailyPerformanceReport />} />
        <Route path="/dailyperformancereport" element={<DailyPerformanceReport />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/CaseStudyNUPS" element={<CaseStudyNUPS />} />
        <Route path="/CaseStudyOracleOHIP" element={<CaseStudyOracleOHIP />} />
        <Route path="/admin/activity-log" element={<ActivityLogViewer />} />
        <Route path="/admin/settlement" element={<DailySettlementDashboard />} />
        <Route path="/admin/payout-history" element={<DriverPayoutHistory />} />
        <Route path="/Accounting" element={<Accounting />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/admin/audit-integrity" element={<AuditIntegrity />} />
        <Route path="/Search" element={<UnifiedSearch />} />
        <Route path="/search" element={<UnifiedSearch />} />
        <Route path="/Tonight" element={<Tonight />} />
        <Route path="/tonight" element={<Tonight />} />
        <Route path="/admin/venue-settings" element={<VenueAdminSettings />} />
        <Route path="/Contracts" element={<ContractsHub />} />
        <Route path="/contracts" element={<ContractsHub />} />
        <Route path="/ContractsHub" element={<ContractsHub />} />
        <Route path="/Register" element={<RegisterConsole />} />
        <Route path="/register" element={<RegisterConsole />} />
        <Route path="/RegisterConsole" element={<RegisterConsole />} />
        <Route path="/Receipts" element={<Receipts />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/DriverPayouts" element={<DriverPayouts />} />
        <Route path="/driverpayouts" element={<DriverPayouts />} />
        <Route path="/NUPSHub" element={<NUPSHub />} />
        <Route path="/nupshub" element={<NUPSHub />} />
        <Route path="/Hub" element={<NUPSHub />} />
        <Route path="/GlyphBotMixer" element={<GlyphBotMixer />} />
        <Route path="/glyphbotmixer" element={<GlyphBotMixer />} />
        <Route path="/BotAnalytics" element={<BotAnalytics />} />
        <Route path="/botanalytics" element={<BotAnalytics />} />
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
        <SonnerToaster position="top-center" richColors closeButton />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App