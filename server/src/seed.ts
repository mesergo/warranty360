import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Brand, ProductModel } from './models/Brand.js';
import { Partner } from './models/Partner.js';
import { ServiceProvider } from './models/ServiceProvider.js';
import { Site, Location } from './models/Site.js';
import { Product } from './models/Product.js';
import { ProductDocument } from './models/ProductDocument.js';
import { QrTag } from './models/QrTag.js';
import { ServiceRequest, ServiceMessage } from './models/ServiceRequest.js';
import { getWarrantyStatus } from './utils/warranty.js';

const TENANT_ID = 'tenant-demo';

async function run() {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/warranty360';
  await connectDb(mongoUri);

  console.log('[seed] מוחק נתונים קיימים...');
  await Promise.all([
    User.deleteMany({}),
    Brand.deleteMany({}),
    ProductModel.deleteMany({}),
    Partner.deleteMany({}),
    ServiceProvider.deleteMany({}),
    Site.deleteMany({}),
    Location.deleteMany({}),
    Product.deleteMany({}),
    ProductDocument.deleteMany({}),
    QrTag.deleteMany({}),
    ServiceRequest.deleteMany({}),
    ServiceMessage.deleteMany({}),
  ]);

  console.log('[seed] יוצר משתמשים...');
  const [consumerUser, adminUser, techUser] = await User.create([
    {
      tenantId: TENANT_ID,
      name: 'ישראל ישראלי',
      phone: '0521234567',
      email: 'israel@example.com',
      role: 'consumer',
      isActive: true,
    },
    {
      tenantId: TENANT_ID,
      name: 'רותם כהן',
      phone: '0507654321',
      email: 'rotem@ir.example.co.il',
      role: 'admin',
      isActive: true,
    },
    {
      tenantId: TENANT_ID,
      name: 'דני אזולאי',
      phone: '0533456789',
      role: 'technician',
      isActive: true,
    },
  ]);

  console.log('[seed] יוצר מותגים ודגמים...');
  const brandNames = ['LG', 'Bosch', 'Tornado', 'CoolAir', 'HP', 'APC', 'MedCool', 'DryPro', 'Samsung', 'Axis'];
  const brands = Object.fromEntries(
    (await Brand.create(brandNames.map((name) => ({ name })))).map((b) => [b.name, b]),
  );

  const modelDefs = [
    { key: 'lg-fridge', brand: 'LG', category: 'מקררים', modelName: 'LG 512L No-Frost' },
    { key: 'bosch-washer', brand: 'Bosch', category: 'מכונות כביסה', modelName: 'Bosch 9kg Serie 6' },
    { key: 'tornado-ac', brand: 'Tornado', category: 'מיזוג', modelName: 'Tornado 1.5 כ"ס' },
    { key: 'coolair-central', brand: 'CoolAir', category: 'מיזוג', modelName: 'CoolAir מרכזי 25HP' },
    { key: 'lg-freezer', brand: 'LG', category: 'אחר', modelName: 'LG מקפיא תעשייתי' },
    { key: 'hp-printer', brand: 'HP', category: 'מדפסות', modelName: 'HP LaserJet MFP משולבת' },
    { key: 'apc-ups', brand: 'APC', category: 'חשמל', modelName: 'APC Smart-UPS' },
    { key: 'medcool-fridge', brand: 'MedCool', category: 'אחר', modelName: 'MedCool מקרר תרופות' },
    { key: 'drypro-dryer', brand: 'DryPro', category: 'אחר', modelName: 'DryPro מייבש ידיים תעשייתי' },
    { key: 'samsung-screen', brand: 'Samsung', category: 'אחר', modelName: 'Samsung מסך חכם 86"' },
    { key: 'axis-camera', brand: 'Axis', category: 'אחר', modelName: 'Axis מצלמת אבטחה IP' },
  ];
  const models: Record<string, any> = {};
  for (const def of modelDefs) {
    models[def.key] = await ProductModel.create({
      brandId: brands[def.brand]._id,
      category: def.category,
      modelName: def.modelName,
    });
  }

  console.log('[seed] יוצר ספקים/יבואנים ונותני שירות...');
  const partnerDefs = [
    { key: 'lg', type: 'importer', name: 'LG ישראל', phone: '*9080', slaHours: 48 },
    { key: 'bosch', type: 'importer', name: 'Bosch ישראל', phone: '*2020', slaHours: 48 },
    { key: 'tornado', type: 'importer', name: 'Tornado ישראל', phone: '*6465', slaHours: 72 },
    { key: 'coolair', type: 'supplier', name: 'CoolAir', phone: '04-6111111', slaHours: 24 },
    { key: 'hp', type: 'importer', name: 'HP ישראל', phone: '*4477', slaHours: 48 },
    { key: 'apc', type: 'importer', name: 'APC by Schneider', phone: '03-9001234', slaHours: 24 },
    { key: 'medcool', type: 'supplier', name: 'MedCool', phone: '08-9998877', slaHours: 12 },
    { key: 'drypro', type: 'supplier', name: 'DryPro', phone: '09-7776655', slaHours: 48 },
    { key: 'samsung', type: 'importer', name: 'Samsung ישראל', phone: '*5454', slaHours: 48 },
    { key: 'axis', type: 'supplier', name: 'Axis Communications', phone: '03-7654321', slaHours: 24 },
  ] as const;
  const partners: Record<string, any> = {};
  for (const def of partnerDefs) {
    partners[def.key] = await Partner.create(def);
  }

  const spDefs = [
    { key: 'lg', name: 'LG Israel Service', providerType: 'importer_lab', phone: '*9080', brand: 'LG', categories: ['מקררים', 'אחר'] },
    { key: 'bosch', name: 'Bosch שירות לקוחות', providerType: 'importer_lab', phone: '*2020', brand: 'Bosch', categories: ['מכונות כביסה'] },
    { key: 'general', name: 'מעבדה כללית – שירות חוץ-אחריות', providerType: 'general_lab', phone: '1-700-555555', isPrivate: true, supportsWarranty: false, categories: [] },
    { key: 'coolair', name: 'CoolAir שירות מיזוג', providerType: 'importer_lab', phone: '04-6111111', brand: 'CoolAir', categories: ['מיזוג'], slaHours: 24 },
    { key: 'hp', name: 'HP שירות עסקי', providerType: 'importer_lab', phone: '*4477', brand: 'HP', categories: ['מדפסות'] },
    { key: 'apc', name: 'APC by Schneider – שירות', providerType: 'importer_lab', phone: '03-9001234', brand: 'APC', categories: ['חשמל'], slaHours: 24 },
    { key: 'medcool', name: 'MedCool שירות טכני', providerType: 'importer_lab', phone: '08-9998877', brand: 'MedCool', categories: ['אחר'], slaHours: 12 },
    { key: 'drypro', name: 'DryPro שירות', providerType: 'general_lab', phone: '09-7776655', brand: 'DryPro', categories: ['אחר'] },
    { key: 'samsung', name: 'Samsung שירות מוצרי חשמל', providerType: 'importer_lab', phone: '*5454', brand: 'Samsung', categories: ['אחר'] },
    { key: 'axis', name: 'Axis שירות מערכות אבטחה', providerType: 'importer_lab', phone: '03-7654321', brand: 'Axis', categories: ['אחר'] },
  ] as const;
  const serviceProviders: Record<string, any> = {};
  for (const def of spDefs) {
    serviceProviders[def.key] = await ServiceProvider.create({
      tenantId: TENANT_ID,
      name: def.name,
      providerType: def.providerType,
      isPrivate: 'isPrivate' in def ? def.isPrivate : false,
      supportsWarranty: 'supportsWarranty' in def ? def.supportsWarranty : true,
      supportsOutOfWarranty: true,
      supportsRepair: true,
      supportsOnsite: true,
      supportsPickupDelivery: false,
      phone: def.phone,
      slaHours: 'slaHours' in def ? def.slaHours : undefined,
      brandIds: 'brand' in def && def.brand ? [brands[def.brand]._id] : [],
      categories: def.categories,
    });
  }

  console.log('[seed] יוצר אתרים ומיקומים...');
  const siteDefs = [
    { key: 'community', name: 'מרכז קהילתי' },
    { key: 'school', name: 'בית ספר "רימון"' },
    { key: 'city', name: 'עירייה – בניין ראשי' },
    { key: 'clinic', name: 'קופת חולים מרכזית' },
    { key: 'sports', name: 'אולם ספורט עירוני' },
    { key: 'library', name: 'ספרייה עירונית' },
  ];
  const sites: Record<string, any> = {};
  for (const def of siteDefs) {
    sites[def.key] = await Site.create({ tenantId: TENANT_ID, name: def.name });
  }

  const locationDefs = [
    { key: 'roof', site: 'community', name: 'גג – יחידה ראשית' },
    { key: 'hall', site: 'community', name: 'אולם כנסים' },
    { key: 'kitchen', site: 'school', name: 'מטבח' },
    { key: 'mayor', site: 'city', name: 'קומה 3 – לשכת ראש העיר' },
    { key: 'server', site: 'city', name: 'חדר שרתים' },
    { key: 'pharmacy', site: 'clinic', name: 'חדר תרופות' },
    { key: 'equipment', site: 'sports', name: 'חדר ציוד' },
    { key: 'entrance', site: 'library', name: 'כניסה ראשית' },
  ];
  const locations: Record<string, any> = {};
  for (const def of locationDefs) {
    locations[def.key] = await Location.create({ siteId: sites[def.site]._id, name: def.name });
  }

  console.log('[seed] יוצר מוצרי לקוח פרטי...');
  const consumerProducts = await Product.create([
    {
      tenantId: TENANT_ID,
      productModelId: models['lg-fridge']._id,
      serialNumber: 'LG-FR-88213',
      purchaseDate: new Date('2024-03-12'),
      warrantyStart: new Date('2024-03-12'),
      warrantyEnd: new Date('2027-03-12'),
      purchasedAtBranch: 'רשת "אור החשמל" – סניף עפולה',
      importerPartnerId: partners.lg._id,
      warrantyServiceProviderId: serviceProviders.lg._id,
      ownerUserId: consumerUser._id,
    },
    {
      tenantId: TENANT_ID,
      productModelId: models['bosch-washer']._id,
      serialNumber: 'BO-WA-55019',
      purchaseDate: new Date('2022-09-01'),
      warrantyStart: new Date('2022-09-01'),
      warrantyEnd: new Date('2025-09-01'),
      purchasedAtBranch: 'רשת "אור החשמל" – סניף עפולה',
      importerPartnerId: partners.bosch._id,
      warrantyServiceProviderId: serviceProviders.bosch._id,
      ownerUserId: consumerUser._id,
    },
    {
      tenantId: TENANT_ID,
      productModelId: models['tornado-ac']._id,
      serialNumber: 'TOR-AC-11207',
      purchaseDate: new Date('2019-06-20'),
      warrantyStart: new Date('2019-06-20'),
      warrantyEnd: new Date('2022-06-20'),
      purchasedAtBranch: 'רשת "אור החשמל" – סניף עפולה',
      importerPartnerId: partners.tornado._id,
      warrantyServiceProviderId: serviceProviders.general._id,
      ownerUserId: consumerUser._id,
    },
  ]);

  console.log('[seed] יוצר ציוד מוסדי...');
  const institutionDefs = [
    { model: 'coolair-central', tag: 'A-1042', purchase: '2022-10-15', end: '2026-10-15', partnerKey: 'coolair', partnerField: 'supplierPartnerId', sp: 'coolair', site: 'community', loc: 'roof' },
    { model: 'lg-freezer', tag: 'A-2091', purchase: '2024-03-01', end: '2028-03-01', partnerKey: 'lg', partnerField: 'importerPartnerId', sp: 'lg', site: 'school', loc: 'kitchen' },
    { model: 'hp-printer', tag: 'A-3110', purchase: '2021-01-10', end: '2024-01-10', partnerKey: 'hp', partnerField: 'importerPartnerId', sp: 'hp', site: 'city', loc: 'mayor' },
    { model: 'apc-ups', tag: 'A-3155', purchase: '2023-11-01', end: '2026-11-01', partnerKey: 'apc', partnerField: 'importerPartnerId', sp: 'apc', site: 'city', loc: 'server' },
    { model: 'medcool-fridge', tag: 'A-4402', purchase: '2024-06-01', end: '2027-06-01', partnerKey: 'medcool', partnerField: 'supplierPartnerId', sp: 'medcool', site: 'clinic', loc: 'pharmacy' },
    { model: 'drypro-dryer', tag: 'A-5017', purchase: '2024-01-01', end: '2027-01-01', partnerKey: 'drypro', partnerField: 'supplierPartnerId', sp: 'drypro', site: 'sports', loc: 'equipment' },
    { model: 'samsung-screen', tag: 'A-5230', purchase: '2023-09-20', end: '2026-09-20', partnerKey: 'samsung', partnerField: 'importerPartnerId', sp: 'samsung', site: 'community', loc: 'hall' },
    { model: 'axis-camera', tag: 'A-6301', purchase: '2025-05-01', end: '2028-05-01', partnerKey: 'axis', partnerField: 'supplierPartnerId', sp: 'axis', site: 'library', loc: 'entrance' },
  ] as const;

  const institutionProducts: any[] = [];
  for (const def of institutionDefs) {
    const doc = await Product.create({
      tenantId: TENANT_ID,
      productModelId: models[def.model]._id,
      assetTag: def.tag,
      purchaseDate: new Date(def.purchase),
      warrantyStart: new Date(def.purchase),
      warrantyEnd: new Date(def.end),
      [def.partnerField]: partners[def.partnerKey]._id,
      warrantyServiceProviderId: serviceProviders[def.sp]._id,
      siteId: sites[def.site]._id,
      locationId: locations[def.loc]._id,
    });
    institutionProducts.push(doc);
  }

  console.log('[seed] יוצר מסמכים...');
  await ProductDocument.create([
    {
      productId: consumerProducts[0]._id,
      type: 'invoice',
      fileName: 'חשבונית-מקרר-LG.pdf',
      extractionStatus: 'done',
      extractedJson: { יבואן: 'LG ישראל', דגם: 'LG 512L No-Frost', 'תוקף אחריות': '12.03.2027' },
    },
    { productId: consumerProducts[0]._id, type: 'warranty', fileName: 'תעודת-אחריות-מקרר-LG.pdf' },
    {
      productId: consumerProducts[1]._id,
      type: 'invoice',
      fileName: 'חשבונית-כביסה-Bosch.pdf',
      extractionStatus: 'done',
      extractedJson: { יבואן: 'Bosch ישראל', דגם: 'Bosch 9kg Serie 6', 'תוקף אחריות': '01.09.2025' },
    },
    { productId: consumerProducts[1]._id, type: 'warranty', fileName: 'תעודת-אחריות-כביסה.pdf' },
    { productId: consumerProducts[2]._id, type: 'invoice', fileName: 'חשבונית-מזגן-Tornado.pdf' },
  ]);

  console.log('[seed] יוצר מדבקות QR...');
  await QrTag.create(
    institutionProducts.map((p, i) => ({
      productId: p._id,
      code: `W360-${1000 + i}`,
      printed: i % 3 === 0,
      scansCount: i === 1 ? 4 : 0,
      lastScannedAt: i === 1 ? new Date('2026-08-10T11:20:00') : undefined,
    })),
  );

  console.log('[seed] יוצר קריאות שירות...');
  const sr1 = await ServiceRequest.create({
    productId: institutionProducts[2]._id, // hp-printer
    openedByUserId: techUser._id,
    assignedPartnerId: partners.hp._id,
    serviceProviderId: serviceProviders.hp._id,
    status: 'in_progress',
    priority: 'high',
    description: 'המדפסת לא מדפיסה, נורית שגיאה אדומה מהבהבת.',
    warrantySnapshot: { isUnderWarranty: false, warrantyEnd: new Date('2024-01-10') },
    leadStatus: 'in_treatment',
    sentAt: new Date('2026-08-20T08:35:00'),
  });
  const sr2 = await ServiceRequest.create({
    productId: institutionProducts[0]._id, // coolair-central
    openedByUserId: adminUser._id,
    assignedPartnerId: partners.coolair._id,
    serviceProviderId: serviceProviders.coolair._id,
    status: 'waiting',
    priority: 'medium',
    description: 'המזגן המרכזי מרעיש ומפסיק לעבוד לסירוגין.',
    warrantySnapshot: { isUnderWarranty: true, warrantyEnd: new Date('2026-10-15') },
    leadStatus: 'sent',
    sentAt: new Date('2026-08-22T10:02:00'),
  });

  await ServiceMessage.create([
    { serviceRequestId: sr1._id, authorType: 'system', body: 'קריאת השירות נפתחה ונשלחה ל-HP ישראל.' },
    { serviceRequestId: sr1._id, authorType: 'partner', body: 'התקבל, טכנאי משובץ להגעה עד 48 שעות.' },
    { serviceRequestId: sr2._id, authorType: 'system', body: 'קריאת השירות נפתחה ונשלחה ל-CoolAir.' },
  ]);

  console.log('[seed] בדיקת סטטוס אחריות לדוגמה:');
  for (const p of [...consumerProducts, ...institutionProducts]) {
    console.log(` - ${p._id}: ${getWarrantyStatus(p.warrantyEnd)}`);
  }

  console.log('[seed] הושלם בהצלחה.');
  console.log(`[seed] התחברות דמו: לקוח פרטי ${consumerUser.phone} | מנהל מוסדי ${adminUser.phone}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] נכשל:', err);
  process.exit(1);
});
