import { 
  ShoppingCart, Users, Package, TrendingUp, Map, AlertTriangle, 
  QrCode, Shield, Bed, UserCheck, DollarSign, BarChart3, Key,
  Hash, Code, Lock, Fingerprint, Zap
} from "lucide-react";
import { filterUiArtifacts } from "@/lib/uiArtifactFilter";

export const navItems = [
  {
    category: "General",
    items: [
      { id: "security-overview", label: "Security Overview", entity: null, icon: Shield },
      { id: "consultations", label: "Consultations", entity: "Consultation", icon: Users },
      { id: "products", label: "Products", entity: "Product", icon: Package },
    ]
  },
  {
    category: "Key Tools",
    items: [
      { id: "key-generator", label: "Key Generator", entity: null, icon: Key },
      { id: "hash-generator", label: "Hash Generator", entity: null, icon: Hash },
      { id: "encoder-decoder", label: "Encoder/Decoder", entity: null, icon: Code },
    ]
  },
  {
    category: "Point of Sale",
    items: [
      { id: "pos-products", label: "Products", entity: "POSProduct", icon: Package },
      { id: "pos-transactions", label: "Transactions", entity: "POSTransaction", icon: ShoppingCart },
      { id: "pos-customers", label: "Customers", entity: "POSCustomer", icon: Users },
      { id: "pos-campaigns", label: "Campaigns", entity: "POSCampaign", icon: TrendingUp },
      { id: "pos-locations", label: "Locations", entity: "POSLocation", icon: Map },
      { id: "pos-inventory", label: "Inventory Batches", entity: "POSInventoryBatch", icon: Package },
      { id: "pos-batches", label: "Cash Batches", entity: "POSBatch", icon: DollarSign },
      { id: "pos-zreports", label: "Z-Reports", entity: "POSZReport", icon: BarChart3 },
    ]
  },
  {
    category: "QR Security",
    items: [
      { id: "qr-history", label: "QR Generation History", entity: "QRGenHistory", icon: QrCode },
      { id: "qr-scores", label: "AI Security Scores", entity: "QRAIScore", icon: Shield },
      { id: "qr-threats", label: "Threat Logs", entity: "QRThreatLog", icon: AlertTriangle },
    ]
  },
  {
    category: "HSSS Security",
    items: [
      { id: "hotzone-maps", label: "Security Maps", entity: "HotzoneMap", icon: Map },
      { id: "hotzone-threats", label: "Threats", entity: "HotzoneThreat", icon: AlertTriangle },
    ]
  },
  {
    category: "Hospitality",
    items: [
      { id: "entertainers", label: "Entertainers", entity: "Entertainer", icon: Users },
      { id: "shifts", label: "Shifts", entity: "EntertainerShift", icon: UserCheck },
      { id: "vip-rooms", label: "VIP Rooms", entity: "VIPRoom", icon: Bed },
      { id: "vip-guests", label: "VIP Guests", entity: "VIPGuest", icon: Users },
    ]
  },
  {
    category: "System",
    items: [
      { id: "service-usage", label: "Service Usage", entity: "ServiceUsage", icon: BarChart3 },
    ]
  },
  {
    category: "Developer",
    items: [
      { id: "api-keys", label: "API Keys & Secrets", entity: "APIKey", icon: Lock },
    ]
  }
].map((category) => ({
  ...category,
  items: filterUiArtifacts(category.items || [])
}));