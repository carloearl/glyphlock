/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import AboutCarlo from './pages/AboutCarlo';
import Accessibility from './pages/Accessibility';
import AccountSecurity from './pages/AccountSecurity';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BillingAndPayments from './pages/BillingAndPayments';
import Blockchain from './pages/Blockchain';
import CaseStudies from './pages/CaseStudies';
import CaseStudyAIBinding from './pages/CaseStudyAIBinding';
import CaseStudyCovenantVictory from './pages/CaseStudyCovenantVictory';
import CaseStudyTruthStrike from './pages/CaseStudyTruthStrike';
import ClubCurrencyPress from './pages/ClubCurrencyPress';
import CommandCenter from './pages/CommandCenter';
import Consultation from './pages/Consultation';
import ConsultationSuccess from './pages/ConsultationSuccess';
import Contact from './pages/Contact';
import ContentGenerator from './pages/ContentGenerator';
import ContractArchive from './pages/ContractArchive';
import ContractSearch from './pages/ContractSearch';
import Cookies from './pages/Cookies';
import GlyphBucksHub from './pages/GlyphBucksHub';
import DreamTeam from './pages/DreamTeam';
import EmergencyBackup from './pages/EmergencyBackup';

import FAQ from './pages/FAQ';
import FullExport from './pages/FullExport';
import GlyphBot from './pages/GlyphBot';
import GlyphBotJunior from './pages/GlyphBotJunior';
import GlyphBotMixer from './pages/GlyphBotMixer';
import GlyphLockAudit from './pages/GlyphLockAudit';
import GlyphLockFinancial from './pages/GlyphLockFinancial';
import GlyphLockPlayground from './pages/GlyphLockPlayground';
import GovernanceHub from './pages/GovernanceHub';
import Home from './pages/Home';
import ImageGenerator from './pages/ImageGenerator';
import ImageLab from './pages/ImageLab';
import IntegrationTests from './pages/IntegrationTests';
import InteractiveImageStudio from './pages/InteractiveImageStudio';
import ManageSubscription from './pages/ManageSubscription';
import MasterCovenant from './pages/MasterCovenant';
import Mobile from './pages/Mobile';
import NISTChallenge from './pages/NISTChallenge';
import NUPSAudit from './pages/NUPSAudit';
import NUPSDemoManager from './pages/NUPSDemoManager';
import NUPSLogin from './pages/NUPSLogin';
import NUPSOwner from './pages/NUPSOwner';
import NUPSPostLogin from './pages/NUPSPostLogin';
import NUPSReport from './pages/NUPSReport';
import NUPSStaff from './pages/NUPSStaff';
import NotFound from './pages/NotFound';
import PartnerPortal from './pages/PartnerPortal';
import Partners from './pages/Partners';
import PaymentCancel from './pages/PaymentCancel';
import PaymentSuccess from './pages/PaymentSuccess';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import ProjectUpdates from './pages/ProjectUpdates';
import ProviderConsole from './pages/ProviderConsole';
import Qr from './pages/Qr';
import Roadmap from './pages/Roadmap';
import Robots from './pages/Robots';
import SDKDocs from './pages/SDKDocs';
import SecurityDocs from './pages/SecurityDocs';
import SecurityOperationsCenter from './pages/SecurityOperationsCenter';
import SecurityTools from './pages/SecurityTools';
import Services from './pages/Services';
import SettlementReports from './pages/SettlementReports';
import Share from './pages/Share';
import Sie from './pages/Sie';
import SiteAudit from './pages/SiteAudit';
import SiteBuilder from './pages/SiteBuilder';
import SiteBuilderTest from './pages/SiteBuilderTest';
import Sitemap from './pages/Sitemap';
import SitemapApp from './pages/SitemapApp';
import SitemapDynamic from './pages/SitemapDynamic';
import SitemapImages from './pages/SitemapImages';
import SitemapInteractive from './pages/SitemapInteractive';
import SitemapQr from './pages/SitemapQr';
import SitemapXml from './pages/SitemapXml';
import Solutions from './pages/Solutions';
import StrategicScale from './pages/StrategicScale';
import SystemAudit from './pages/SystemAudit';
import Terms from './pages/Terms';
import TrustSecurity from './pages/TrustSecurity';
import VIPContract from './pages/VIPContract';
import VideoUpload from './pages/VideoUpload';
import sitemapQr from './pages/sitemap-qr';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AboutCarlo": AboutCarlo,
    "Accessibility": Accessibility,
    "AccountSecurity": AccountSecurity,
    "AnalyticsDashboard": AnalyticsDashboard,
    "BillingAndPayments": BillingAndPayments,
    "Blockchain": Blockchain,
    "CaseStudies": CaseStudies,
    "CaseStudyAIBinding": CaseStudyAIBinding,
    "CaseStudyCovenantVictory": CaseStudyCovenantVictory,
    "CaseStudyTruthStrike": CaseStudyTruthStrike,
    "ClubCurrencyPress": ClubCurrencyPress,
    "CommandCenter": CommandCenter,
    "Consultation": Consultation,
    "ConsultationSuccess": ConsultationSuccess,
    "Contact": Contact,
    "ContentGenerator": ContentGenerator,
    "ContractArchive": ContractArchive,
    "ContractSearch": ContractSearch,
    "Cookies": Cookies,
    "GlyphBucksHub": GlyphBucksHub,
    "DreamTeam": DreamTeam,
    "EmergencyBackup": EmergencyBackup,

    "FAQ": FAQ,
    "FullExport": FullExport,
    "GlyphBot": GlyphBot,
    "GlyphBotJunior": GlyphBotJunior,
    "GlyphBotMixer": GlyphBotMixer,
    "GlyphLockAudit": GlyphLockAudit,
    "GlyphLockFinancial": GlyphLockFinancial,
    "GlyphLockPlayground": GlyphLockPlayground,
    "GovernanceHub": GovernanceHub,
    "Home": Home,
    "ImageGenerator": ImageGenerator,
    "ImageLab": ImageLab,
    "IntegrationTests": IntegrationTests,
    "InteractiveImageStudio": InteractiveImageStudio,
    "ManageSubscription": ManageSubscription,
    "MasterCovenant": MasterCovenant,
    "Mobile": Mobile,
    "NISTChallenge": NISTChallenge,
    "NUPSAudit": NUPSAudit,
    "NUPSDemoManager": NUPSDemoManager,
    "NUPSLogin": NUPSLogin,
    "NUPSOwner": NUPSOwner,
    "NUPSPostLogin": NUPSPostLogin,
    "NUPSReport": NUPSReport,
    "NUPSStaff": NUPSStaff,
    "NotFound": NotFound,
    "PartnerPortal": PartnerPortal,
    "Partners": Partners,
    "PaymentCancel": PaymentCancel,
    "PaymentSuccess": PaymentSuccess,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "ProjectUpdates": ProjectUpdates,
    "ProviderConsole": ProviderConsole,
    "Qr": Qr,
    "Roadmap": Roadmap,
    "Robots": Robots,
    "SDKDocs": SDKDocs,
    "SecurityDocs": SecurityDocs,
    "SecurityOperationsCenter": SecurityOperationsCenter,
    "SecurityTools": SecurityTools,
    "Services": Services,
    "SettlementReports": SettlementReports,
    "Share": Share,
    "Sie": Sie,
    "SiteAudit": SiteAudit,
    "SiteBuilder": SiteBuilder,
    "SiteBuilderTest": SiteBuilderTest,
    "Sitemap": Sitemap,
    "SitemapApp": SitemapApp,
    "SitemapDynamic": SitemapDynamic,
    "SitemapImages": SitemapImages,
    "SitemapInteractive": SitemapInteractive,
    "SitemapQr": SitemapQr,
    "SitemapXml": SitemapXml,
    "Solutions": Solutions,
    "StrategicScale": StrategicScale,
    "SystemAudit": SystemAudit,
    "Terms": Terms,
    "TrustSecurity": TrustSecurity,
    "VIPContract": VIPContract,
    "VideoUpload": VideoUpload,
    "sitemap-qr": sitemapQr,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};