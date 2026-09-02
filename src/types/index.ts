// טיפוסי הישויות של Warranty360, כפי שמוחזרות מה-API (Express + MongoDB/Mongoose).
// שדות אבטחה פנימיים (code_hash, access_token, ip...) נשארים בשרת בלבד ולא נחשפים ב-API.

export type UserRole = 'consumer' | 'admin' | 'technician';

export interface User {
  _id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  logoPath?: string;
}

export interface ProductModel {
  _id: string;
  brandId: Brand;
  category: string;
  modelName: string;
  specs?: Record<string, string>;
}

export type PartnerType = 'supplier' | 'importer';

export interface Partner {
  _id: string;
  type: PartnerType;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  slaHours?: number;
}

export type ServiceProviderType = 'importer_lab' | 'general_lab' | 'hybrid';

export interface ServiceProvider {
  _id: string;
  name: string;
  providerType: ServiceProviderType;
  isPrivate: boolean;
  supportsWarranty: boolean;
  supportsOutOfWarranty: boolean;
  partsOnly: boolean;
  supportsRepair: boolean;
  supportsOnsite: boolean;
  supportsPickupDelivery: boolean;
  phone: string;
  email?: string;
  address?: string;
  slaHours?: number;
  brandIds: string[];
  categories: string[];
  notes?: string;
}

export interface Site {
  _id: string;
  name: string;
  address?: string;
}

export interface Location {
  _id: string;
  siteId: string;
  parentId?: string;
  name: string;
}

export type ProductStatus = 'active' | 'retired';
export type WarrantyStatus = 'in_warranty' | 'near_expiry' | 'out_of_warranty';

export interface Product {
  _id: string;
  tenantId: string;
  productModelId: ProductModel;
  serialNumber?: string;
  assetTag?: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  purchasedAtBranch?: string;
  importerPartnerId?: Partner;
  supplierPartnerId?: Partner;
  warrantyServiceProviderId?: ServiceProvider;
  siteId?: Site;
  locationId?: Location;
  ownerUserId?: string;
  reportedInstallLocation?: string;
  status: ProductStatus;
  notes?: string;
  warrantyStatus: WarrantyStatus;
}

export type DocumentType = 'invoice' | 'warranty' | 'other';
export type ExtractionStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ProductDocument {
  _id: string;
  productId?: string;
  partnerId?: string;
  type: DocumentType;
  fileName: string;
  filePath?: string;
  mime?: string;
  createdAt: string;
  extractionStatus?: ExtractionStatus;
  extractedJson?: Record<string, string>;
}

export type QrTagStatus = 'active' | 'disabled';

export interface QrTag {
  _id: string;
  productId: Product;
  code: string;
  status: QrTagStatus;
  printed: boolean;
  lastScannedAt?: string;
  scansCount: number;
}

export type ServiceRequestStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'in_progress'
  | 'waiting'
  | 'closed'
  | 'cancelled';

export type ServicePriority = 'low' | 'medium' | 'high';

export type LeadStatus =
  | 'new'
  | 'sent'
  | 'received'
  | 'in_treatment'
  | 'rejected'
  | 'closed';

export interface ServiceRequest {
  _id: string;
  productId: Product;
  openedByUserId?: string;
  assignedPartnerId?: Partner;
  serviceProviderId?: ServiceProvider;
  status: ServiceRequestStatus;
  priority: ServicePriority;
  description: string;
  warrantySnapshot: { isUnderWarranty: boolean; warrantyEnd: string };
  leadStatus?: LeadStatus;
  createdAt: string;
  sentAt?: string;
  closedAt?: string;
}

export type MessageAuthorType = 'user' | 'partner' | 'system';

export interface ServiceMessage {
  _id: string;
  serviceRequestId: string;
  authorType: MessageAuthorType;
  authorId?: string;
  body: string;
  createdAt: string;
}
