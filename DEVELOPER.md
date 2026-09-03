# Warranty360 — מדריך פיתוח מלא

מסמך זה מיועד לכל מפתח/ת שנכנס/ת לפרויקט בפעם הראשונה — הוא מסביר מה המערכת עושה, איך היא בנויה, איך מריצים אותה מקומית, ואילו כללים/מלכודות חשוב להכיר לפני שנוגעים בקוד. למדריך התחלה מהיר (quick start) ראו גם [README.md](README.md); מסמך זה הוא ההרחבה המלאה.

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [מבנה הריפו](#2-מבנה-הריפו)
3. [הרצה מקומית](#3-הרצה-מקומית)
4. [מודל הנתונים ורב-דיירות (Multi-Tenancy)](#4-מודל-הנתונים-ורב-דיירות-multi-tenancy)
5. [Backend — ארכיטקטורה ו-API](#5-backend--ארכיטקטורה-ו-api)
6. [אימות והרשאות (Auth)](#6-אימות-והרשאות-auth)
7. [Frontend — ארכיטקטורה](#7-frontend--ארכיטקטורה)
8. [פריסה ל-Production](#8-פריסה-ל-production)
9. [כללי אבטחה שחובה לשמר בקוד חדש](#9-כללי-אבטחה-שחובה-לשמר-בקוד-חדש)
10. [מלכודות ונקודות תשומת לב ידועות](#10-מלכודות-ונקודות-תשומת-לב-ידועות)
11. [רשימת בדיקה לפני commit / PR](#11-רשימת-בדיקה-לפני-commit--pr)

---

## 1. סקירה כללית

Warranty360 (360) היא מערכת **אמיתית** (לא דמו) לניהול אחריות על ציוד, מיועדת לארגונים מוסדיים (למשל בתי ספר) וללקוחות פרטיים בתוכם. המערכת מנהלת:

- **מוצרים** ותעודות אחריות שלהם (תאריכי רכישה/תחילת-אחריות/סיום-אחריות).
- **מסמכים** נלווים (חשבוניות, תעודות אחריות), כולל שדה לתוצאת חילוץ נתונים אוטומטי (OCR/AI) מהמסמך.
- **מדבקות QR** פיזיות למעקב אחר ציוד — סריקה ציבורית ללא התחברות מציגה סטטוס אחריות ופרטי ספק.
- **קריאות שירות** (Service Requests) עם שרשור הודעות (צ'אט) מול ספק/יבואן.
- **דשבורד מוסדי** עם מדדי אחריות מצטברים.

ההתחברות מתבצעת בשתי דרכים עצמאיות: **טלפון + קוד חד-פעמי (OTP)** דרך ספק חיצוני (`wa.message.co.il`), או **Google Sign-In** (ללא צורך בטלפון כלל).

### תפקידים (Roles)

| תפקיד | משמעות |
|---|---|
| `consumer` | לקוח פרטי — רואה/מנהל רק את המוצרים שהוא הבעלים שלהם (`ownerUserId`) |
| `admin` | מנהל מוסד — צוות תפעולי הרואה את כל הציוד/קריאות של ה-`tenantId` שלו |
| `technician` | טכנאי שירות — גם הוא "צוות מוסד" (לא `consumer`), אין לו כרגע מסך ייעודי בפרונט |
| `superadmin` | מנהל-על גלובלי (cross-tenant) — ניהול קטלוג משותף (מותגים/ספקים/דגמים/נותני שירות) וצפייה בכל המשתמשים/ציוד במערכת, ב-`/admin` |

### Tech Stack

**Frontend** (שורש הריפו) — React 19, TypeScript ~6.0, Vite 8, Tailwind CSS 4, react-router-dom 7, `@tanstack/react-query` 5, zustand 5, `qrcode.react`, `oxlint`.

**Backend** (`server/`) — Express 4, TypeScript ~5.6 (גרסה **שונה** מזו של הפרונט — שני `tsconfig` בלתי-תלויים), Mongoose 8, `jsonwebtoken`, `bcryptjs`, `google-auth-library`, `multer`, `dotenv`, `cors`.

אלו **שני פרויקטי Node נפרדים** באותו ריפו git (אין npm workspaces, אין חבילה משותפת) שמתקשרים אך ורק דרך HTTP/JSON. שני ה-`package.json` הם `"type": "module"` (ESM) — imports בצד שרת נכתבים עם סיומת `.js` מפורשת גם עבור קבצי `.ts` (נדרש ע"י `moduleResolution: NodeNext`).

---

## 2. מבנה הריפו

```
360/
├── src/                  # React + TS + Vite + Tailwind — צד לקוח
│   ├── pages/            # עמודי מסך לפי תפקיד (consumer/ institution/ admin/)
│   ├── components/       # רכיבי UI משותפים
│   ├── hooks/            # הוקי react-query לכל תחום נתונים
│   ├── store/            # zustand: auth.ts, theme.ts
│   ├── lib/              # api.ts, jwt.ts, warranty.ts, roleHome.ts וכו'
│   └── types/index.ts    # טיפוסי TS משותפים לצד לקוח
├── server/
│   └── src/
│       ├── routes/       # נתיבי API, קובץ per-domain
│       ├── models/       # סכמות Mongoose
│       ├── services/     # אינטגרציות חיצוניות (googleAuth, phoneAuth)
│       ├── middleware/   # auth.ts, error.ts
│       ├── utils/        # jwt.ts, otp.ts, asyncHandler.ts, productAccess.ts
│       ├── config/db.ts  # חיבור MongoDB
│       ├── env.ts        # טעינת server/.env
│       ├── index.ts       # נקודת הכניסה
│       └── seed.ts        # זריעת נתוני דמו
├── dist/                 # פלט build של הפרונט (gitignored)
├── public/
├── index.html
└── .claude/launch.json   # מריץ "npm run dev" בפורט 5173 לתצוגה מקדימה
```

**בפרודקשן**: תהליך Node **אחד** (`server/dist/index.js`) מגיש גם את ה-API תחת `/api` וגם את קבצי ה-build הסטטיים של הפרונט (`dist/`) לכל נתיב אחר — פריסה יחידה על CloudPanel, למרות ששני הצדדים מפותחים ונבנים בנפרד. חשוב: `server/dist/index.js` מאתר את `dist/` דרך שני `..` יחסית למיקומו — כלומר **חובה** ש-`<project-root>/dist` יישב כ"אח" של `server/`, אחרת הגשת קבצי הפרונט תישבר.

אין ESLint בפרויקט כלל — ה-linting היחיד הוא `oxlint` דרך `.oxlintrc.json` בשורש, וסורק גם את `server/src` למרות שאין script `lint` נפרד ב-`server/package.json`.

---

## 3. הרצה מקומית

### דרישות מוקדמות

- Node.js — אין `engines` מוגדר בפרויקט עצמו, אך `vite` דורש בפועל `^20.19.0 || >=22.12.0`.
- Docker (או MongoDB מותקן מקומית).
- Git.

⚠️ **בטיחות מידע**: `server/.env` ו-`.env` (root) לא מגיעים עם ה-clone (ב-`.gitignore`). **לעולם אל תעתיקו את `server/.env` האמיתי מ-production כתבנית לפיתוח** — הוא עלול להצביע על מסד הנתונים החי ולהכיל `NODE_ENV=production`. השתמשו רק ב-`server/.env.example`.

### שלב 1 — קלון והתקנה (שני `npm install` נפרדים)

```bash
git clone https://github.com/mesergo/warranty360.git
cd warranty360
npm install
cd server && npm install && cd ..
```

### שלב 2 — MongoDB מקומי (אין docker-compose, רק `docker run` בודד)

```bash
docker run -d --name warranty360-mongo -p 27017:27017 -v warranty360-mongo-data:/data/db mongo:7
# בפעמים הבאות: docker start warranty360-mongo
```

### שלב 3 — משתני סביבה

**`server/.env`** (מתוך `server/.env.example`):

```bash
cp server/.env.example server/.env
```

```env
MONGODB_URI=mongodb://127.0.0.1:27017/warranty360
JWT_SECRET=change-this-secret-in-production
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

# ברירת המחדל בקוד היא 'external' — שולחת SMS/WhatsApp אמיתי (בתשלום!) דרך wa.message.co.il.
# לפיתוח מקומי חובה 'internal':
PHONE_AUTH_PROVIDER=internal
OTP_DEMO_MODE=true

# אופציונלי — רק אם בודקים גם התחברות Google מקומית:
GOOGLE_CLIENT_ID=
```

⚠️ **אם שוכחים להגדיר `PHONE_AUTH_PROVIDER=internal` מקומית** — כל ניסיון התחברות בטלפון ישלח בפועל SMS/WhatsApp אמיתי ובתשלום לכל מספר שמוזן בטופס.

**`.env`** (root, לצד הלקוח — אין `.env.example` כרגע, יוצרים ידנית):

```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### שלב 4 — זריעת נתוני דמו (חד-פעמי)

```bash
cd server && npm run seed && cd ..
```

יוצר שני משתמשי דמו: לקוח פרטי `0521234567`, מנהל מוסדי `0507654321`.

### שלב 5 — הרצה (שני טרמינלים)

```bash
# טרמינל 1 — API על http://localhost:4000
cd server && npm run dev
```

```bash
# טרמינל 2 — Client על http://localhost:5173
npm run dev
```

### Type-check ו-Lint

```bash
npx tsc -b                                          # צד לקוח
cd server && npx tsc -p tsconfig.json --noEmit       # צד שרת (צריך --noEmit במפורש)
npm run lint                                          # oxlint, מהשורש — סורק גם server/src
```

### בדיקות (Tests)

**אין שום מסגרת בדיקות אוטומטיות בפרויקט כרגע** — אין script בשם `test`, אין קבצי `*.test.*`/`*.spec.*`, ואין Vitest/Jest/Playwright/Cypress בשום `package.json`. האימות היחיד לפני commit/deploy הוא type-check + lint + build ידניים.

---

## 4. מודל הנתונים ורב-דיירות (Multi-Tenancy)

כל המודלים ב-`server/src/models/*.ts` (Mongoose 8, ESM) — 10 קבצים, 12 מודלים בפועל (`Brand.ts`, `Site.ts` ו-`ServiceRequest.ts` כל אחד מכיל שני מודלים).

### תבנית הרב-דיירות

**אין קולקציית `Tenant` מנורמלת בשום מקום בקוד.** `tenantId` הוא שדה `String` חופשי שמועתק ישירות על גבי המסמכים (למשל `'tenant-demo'` ב-`seed.ts`) — לא `ObjectId`/FK שמצביע לרשומת דייר קיימת, ואין ולידציה שהערך "קיים". זו רב-דיירות מבוססת **shared-collection + discriminator string**, לא schema-per-tenant.

האכיפה כולה **ברמת האפליקציה**:
1. **JWT** — `AuthTokenPayload` (`server/src/utils/jwt.ts`) כולל `tenantId`, ונחתם ב-login.
2. **שאילתות בראוטים** — כל route מזריק את `req.auth.tenantId` בעצמו (הלקוח **לעולם לא** שולח `tenantId` ישירות).

פונקציית עזר מרכזית, `assertProductAccess` (`server/src/utils/productAccess.ts`): משתמש רשאי לגשת למוצר אם הוא **הבעלים** (`ownerUserId`) *או* **צוות מוסדי** (`role !== 'consumer'`) **מאותו `tenantId`**.

**אין אינדקס ייחודי מורכב (`compound unique`) שכולל `tenantId`** — `User.phone`, `User.googleId` ו-`QrTag.code` ייחודיים **גלובלית**, לא per-tenant.

### אילו מודלים נושאים `tenantId`

| קטגוריה | מודלים | הסבר |
|---|---|---|
| נתוני-דייר ישירים | `User`, `Product`, `Site`, `ServiceProvider` (חלקי), `OtpLogin` | ישויות ששייכות ישירות למוסד |
| קטלוג/lookup **גלובלי** (ללא `tenantId`) | `Brand`, `ProductModel`, `Partner` | משותף לכל הדיירים (למשל "LG ישראל") |
| רשומות-בת שיורשות שיוך בעקיפין | `Location` (דרך `Site`), `ProductDocument`/`QrTag`/`ServiceRequest` (דרך `Product`) | הבידוד נבדק דרך ה-parent — כל בדיקת הרשאה חייבת לטעון קודם את ה-`Product` |

**מקרה היברידי — `ServiceProvider`**: `tenantId` אופציונלי + `isPrivate: Boolean`. שאילתת התצוגה (`lookups.ts`):
```js
ServiceProvider.find({ $or: [{ isPrivate: { $ne: true } }, { tenantId: req.auth!.tenantId }] })
```
ספקים "ציבוריים" (`isPrivate: false`) גלויים לכל הדיירים; ספק `isPrivate: true` מסונן לפי tenant.

### פירוט מודלים עיקריים

| מודל | שדות מפתח | populate |
|---|---|---|
| **User** | `tenantId`(required), `phone`(unique+sparse), `email`, `googleId`(unique+sparse), `role`, `isActive`, `lastLoginAt` | — |
| **Brand** | `name`, `logoPath` | — |
| **ProductModel** | `brandId`, `category`, `modelName`, `specs`(Mixed) | → Brand |
| **Partner** | `type`(`supplier`\|`importer`), `name`, `phone`, `slaHours`, `webhookUrl`(פנימי, superadmin בלבד) | — |
| **ServiceProvider** | `tenantId`, `isPrivate`, `providerType`, דגלי יכולות (`supportsWarranty` וכו'), `brandIds`, `categories` | → Brand[] |
| **Site / Location** | `Site{name,address,tenantId}`; `Location{siteId,parentId,name}` (עץ מקונן) | → Site |
| **Product** | `tenantId`, `productModelId`, `serialNumber`, `warrantyStart/End`, `importerPartnerId`, `supplierPartnerId`, `warrantyServiceProviderId`, `siteId`, `locationId`, `ownerUserId`, `status` | 6 יעדי populate — הכי הרבה קשרים במערכת |
| **ProductDocument** | `productId`, `partnerId`, `type`, `fileName`, `filePath`, `extractionStatus`, `extractedJson`(Mixed) | → Product, Partner |
| **QrTag** | `productId`, `code`(unique גלובלי), `status`, `printed`, `scansCount` | → Product |
| **ServiceRequest** | `productId`, `openedByUserId`, `status`(7 ערכים), `priority`, `warrantySnapshot`, `leadStatus` | → Product, User, Partner, ServiceProvider |
| **ServiceMessage** | `serviceRequestId`, `authorType`(`user`\|`partner`\|`system`), `authorId`(**ללא ref מוגדר** — יש לפענח לפי `authorType`), `body` | → ServiceRequest |
| **OtpLogin** | `phone`(indexed), `provider`, `codeHash`, `expiresAt`, `consumedAt`, `attempts`, `ip`/`userAgent` | → User |

---

## 5. Backend — ארכיטקטורה ו-API

### מחזור חיים של בקשה (`server/src/index.ts`)

סדר האתחול קריטי:
1. **בדיקות fail-fast**: אם `MONGODB_URI` חסר → זריקת שגיאה מיידית (לא נפילה שקטה למונגו מקומי — זו הייתה סיבת תקלת production ממושכת בעבר). אם `NODE_ENV=production` וגם `PHONE_AUTH_PROVIDER=internal`/`OTP_DEMO_MODE=true` → השרת מסרב לעלות.
2. חיבור MongoDB (`connectDb`).
3. **CORS** עם `origin` callback מותאם: מאפשר את `CLIENT_ORIGIN` המוגדר, ומחוץ ל-production בלבד גם כל `http://localhost:<port>`.
4. `express.json()`.
5. `/uploads` מוגש כ-static **לפני** ה-routers — קבצים שהועלו נגישים ישירות ללא אימות.
6. **סדר טעינת ה-routers קריטי**: `/api/health` → `/api/auth` → `/api/admin` → `/api/products` → `/api/documents` → `/api/qr-tags` → `/api/service-requests` → `/api/dashboard` → `/api/public` → **`/api` (lookups, חייב אחרון)** — כי `lookups.ts` מורכב על הקידומת הגורפת `/api` וכולל `requireAuth` פנימי; אם ייטען מוקדם הוא "יבלע" בקשות ל-`/api/public` וכו'.
7. הגשת ה-build הסטטי של הפרונט + catch-all ל-`index.html` (SPA routing).
8. `app.use(errorHandler)` — אחרון.

בנוסף, `uncaughtException`/`unhandledRejection` נתפסים ונכתבים ל-`crash.log` (מחוץ לזרימת הבקשות הרגילה).

### Middleware אימות (`server/src/middleware/auth.ts`)

- **`requireAuth`** — קורא `Authorization: Bearer <token>`, מאמת עם `verifyToken`, תולה תוצאה על `req.auth`. כשל → `401`.
- **`requireRole(...roles)`** — factory שבודק ש-`req.auth.role` נמצא ב-set המדויק שהועבר. **אין היררכיה** — `superadmin` **לא** עובר אוטומטית `requireRole('admin','technician')` (חסום מ-`/api/qr-tags`, `/api/dashboard/institution`, `POST /api/sites`, `POST /api/locations`).

### עטיפת שגיאות ו-error handler

כל route handler עטוף ב-`asyncHandler` (`server/src/utils/asyncHandler.ts`) שמעביר exceptions ל-`next(err)`. ה-`errorHandler` הגלובלי (`server/src/middleware/error.ts`) תמיד כותב ל-`crash.log`+`console.error`, ותמיד מחזיר `500` — אך **בפרודקשן** (`NODE_ENV=production`) מחזיר ללקוח הודעה גנרית בלבד ("שגיאה לא צפויה בשרת"), לא את `err.message` האמיתי. שגיאות "רגילות" (ולידציה/403/404) תמיד נשלחות ישירות מה-route ולא מגיעות לכאן.

⚠️ שגיאות `multer` (סוג קובץ לא נתמך / קובץ גדול מדי) **לא** נתפסות ייעודית — הן מגיעות ל-`errorHandler` הגלובלי ומוחזרות כ-`500` גנרי במקום `400` עם ההודעה הספציפית.

### העלאת קבצים (`server/src/routes/documents.ts`)

```ts
const ALLOWED_MIME_TO_EXT = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif' };
filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${ALLOWED_MIME_TO_EXT[file.mimetype] ?? ''}`)
```

- שם הקובץ בדיסק **לעולם לא נגזר מ-`originalname`** (מונע path traversal) — הסיומת נגזרת מה-MIME type שזוהה, לא ממה שהקליינט שלח.
- `fileFilter` דוחה כל MIME שלא ברשימה; הגבלת גודל 15MB.
- הקובץ נשמר לדיסק **לפני** בדיקת הרשאת המשתמש למוצר; אם ההרשאה נכשלת, ה-route מוחק אותו (`fs.unlink`).
- מחיקה (`DELETE /api/documents/:id`) משתמשת ב-`path.basename` (לא בנתיב הגולמי) — מונע path traversal גם במחיקה.

### מסלולי API לפי משאב

**`/api/auth`** (ציבורי, ללא `router.use(requireAuth)` גורף):

| שיטה | נתיב | הרשאה | תיאור |
|---|---|---|---|
| POST | `/otp/request` | ציבורי | שליחת קוד OTP (עם cooldown 60ש׳) |
| POST | `/otp/verify` | ציבורי | אימות קוד → JWT |
| POST | `/google` | ציבורי | התחברות/הרשמה עם Google |
| GET | `/me` | `requireAuth` | פרטי המשתמש המחובר |

**`/api/admin`** — `router.use(requireAuth, requireRole('superadmin'))` על **כל** הראוטר:

| שיטה | נתיב | תיאור |
|---|---|---|
| GET | `/users` | כל המשתמשים בכל ה-tenants |
| GET | `/products` | כל המוצרים בכל המוסדות, ללא סינון tenant (מכוון) |
| POST/PATCH/DELETE | `/service-providers`, `/brands/:id`, `/product-models/:id`, `/partners/:id` | CRUD קטלוג משותף — מחיקה נחסמת אם יש רשומות תלויות |

**`/api/products`** — `router.use(requireAuth)` בלבד (הבחנה צרכן/צוות בלוגיקה פנימית):

| שיטה | נתיב | תיאור |
|---|---|---|
| GET | `/` | רשימה: צרכן רואה בבעלותו, צוות רואה לפי tenant; פילטרים `siteId`/`partnerId`/`status` |
| GET | `/:id` | פרטי מוצר — בעלים או צוות מאותו tenant בלבד |
| PATCH | `/:id` | עדכון — שדות שונים מותרים לצרכן (`CONSUMER_EDITABLE_FIELDS`) מול צוות (`STAFF_EDITABLE_FIELDS`) |
| POST | `/` | יצירה — לצוות מוסד יוצרת גם `QrTag` אוטומטית |

**`/api/documents`** — `router.use(requireAuth)`:

| שיטה | נתיב | תיאור |
|---|---|---|
| GET | `/?productId=` | רשימת מסמכים למוצר (עם `assertProductAccess`) |
| POST | `/` | העלאת קובץ (`upload.single('file')`) |
| DELETE | `/:id` | מחיקה + מחיקת הקובץ מהדיסק |

**`/api/qr-tags`** — `router.use(requireAuth, requireRole('admin','technician'))` (לא לצרכנים, לא ל-superadmin):

| שיטה | נתיב | תיאור |
|---|---|---|
| GET | `/` | מדבקות QR של הטננט |
| PATCH | `/:id` | סימון "הודפס" |

**`/api/service-requests`** — `router.use(requireAuth)`:

| שיטה | נתיב | תיאור |
|---|---|---|
| GET | `/` | לפי `productId` (עם בדיקת הרשאה) או כל קריאות הטננט/הצרכן |
| POST | `/` | פתיחת קריאה חדשה (סטטוס `draft`, **ללא שליחה אוטומטית** לספק) |
| PATCH | `/:id/status` | עדכון ידני ל-`sent` |
| GET/POST | `/:id/messages` | שרשור הודעות |

**`/api/dashboard`** — middleware מוצמד per-route (לא `router.use` גורף):

| שיטה | נתיב | הרשאה | תיאור |
|---|---|---|---|
| GET | `/institution` | `requireAuth`+`requireRole('admin','technician')` | סטטיסטיקות אחריות מצטברות |

**`/api/public`** (`server/src/routes/public.ts`) — **ללא שום middleware אימות**:

| שיטה | נתיב | תיאור |
|---|---|---|
| GET | `/qr/:code` | תוצאת סריקת QR — שדות מצומצמים בלבד (דגם, מבנה, מיקום, ספקים, תוקף אחריות), **לא** מסמך המוצר המלא |

**`/api` (lookups, `server/src/routes/lookups.ts`, נטען אחרון בכוונה)** — `router.use(requireAuth)`:

| שיטה | נתיב | הרשאה | תיאור |
|---|---|---|---|
| GET/POST | `/brands`, `/product-models`, `/partners` | `requireAuth` (**כל תפקיד, גם consumer**) | קטלוג גלובלי — אין `requireRole` על היצירה |
| GET | `/service-providers` | `requireAuth` | ציבוריים + פרטיים של הטננט הנוכחי |
| GET | `/sites`, `/locations` | `requireAuth` | לפי הטננט הנוכחי |
| POST | `/sites`, `/locations` | `requireAuth`+`requireRole('admin','technician')` | יצירה (locations מוודא שהאתר שייך לטננט) |

`GET /api/health` מוגדר ישירות על ה-`app` (לא בקובץ routes), ללא אימות.

---

## 6. אימות והרשאות (Auth)

### JWT (`server/src/utils/jwt.ts`)

```ts
export interface AuthTokenPayload {
  sub: string;        // User._id
  tenantId: string;
  role: 'consumer' | 'admin' | 'technician' | 'superadmin';
}
```

נחתם עם `JWT_SECRET` (HMAC סימטרי, אין רוטציה/`kid`), תוקף **5 שעות**, **ללא refresh token** — כשפג, המשתמש פשוט מתחבר מחדש. חסר `JWT_SECRET` → זריקת שגיאה מיידית בכל ניסיון חתימה/אימות (לא fallback שקט).

### זרימת טלפון + OTP (`server/src/routes/auth.ts`)

1. **`POST /otp/request`**: ולידציית פורמט (`/^0\d{8,9}$/`), **cooldown 60 שניות** בצד שרת מול בקשות חוזרות לאותו טלפון (מונע "איפוס" מונה הניסיונות ע"י בקשת קוד חדש שוב ושוב), ואז שליחה בפועל דרך `PHONE_AUTH_PROVIDER`:
   - `external` (**ברירת מחדל, production**) — מול `wa.message.co.il` דרך `server/src/services/phoneAuth.ts`; קוד לעולם לא נראה אצלנו, רק תשובת valid/invalid.
   - `internal` (**dev בלבד**) — קוד נוצר עם `crypto.randomInt`, מגובב עם bcrypt; אם גם `OTP_DEMO_MODE=true` מוחזר ללקוח כ-`demoCode`.
2. **`POST /otp/verify`**: ולידציית **טיפוס מפורשת** (`typeof phone !== 'string'`) — מונעת NoSQL injection דרך אובייקטי אופרטור (`{"$gt":""}`). בדיקות: קוד לא קיים/פג תוקף (TTL 5 דקות)/`attempts >= 5`. משתמש חדש נוצר עם `tenantId` **ייחודי משלו** (`tenant-${randomUUID()}`) — בידוד מלא ממוסדות אחרים.

### Google Sign-In — ערוץ עצמאי מלא (`server/src/services/googleAuth.ts`)

`POST /api/auth/google`: מאמת `credential` (ID token) מול Google (`verifyIdToken`, דורש `email_verified`). משתמש חדש שלא סיפק `accountType` מקבל `{needsAccountType: true}` (שלב בחירה בצד לקוח); עם `accountType` נוצר משתמש **ללא טלפון בכלל** (`phone` נשאר ריק — תקין כי `sparse`), עם `tenantId` ייחודי משלו. אם `GOOGLE_CLIENT_ID` לא מוגדר, ה-route זורק שגיאה ידידותית לכל בקשה.

### הגנות קיימות (rate limiting / cooldown)

| הגנה | ערך |
|---|---|
| Cooldown בקשת קוד חדש | 60 שניות (per-phone) |
| תוקף קוד OTP | 5 דקות |
| ניסיונות מקסימליים לאימות קוד | 5 (per-`OtpLogin` document) |
| תוקף JWT | 5 שעות |
| Timeout מול ספק חיצוני | 30 שניות |

**אין** rate-limiting כללי ברמת IP (כמו `express-rate-limit`) — ההגנה כולה per-phone/per-document.

---

## 7. Frontend — ארכיטקטורה

RTL מלא (`lang="he" dir="rtl"`), Tailwind עם `dark` class (anti-FOUC script ב-`index.html` שקורא את ה-theme מ-localStorage לפני עליית React).

### Router ו-state

- `main.tsx`: `<App/>` בתוך `StrictMode → QueryClientProvider → BrowserRouter`.
- `App.tsx` — כל ה-`<Routes>` בקובץ אחד (אין `routes.tsx` נפרד). `useSessionWatcher` בודק כל 30 שניות אם ה-JWT פג ומבצע `logout()` אוטומטי.
- **Zustand** (`src/store/`): `auth.ts` (`token`, `currentUser`, `expiresAt`, persist ל-`warranty360-auth`, **ללא refresh token**) ו-`theme.ts` (persist ל-`warranty360-theme`).
- `src/lib/jwt.ts` מפענח את ה-JWT בצד לקוח **ללא אימות חתימה** — ל-UI בלבד (הצגת מצב מחובר, תזמון logout), לא אמצעי אבטחה.

### מפת נתיבים

| נתיב | עמוד | הגנה |
|---|---|---|
| `/` | `Home` (גם login/register) | ציבורי |
| `/q/:code` | `ScanQr` | ציבורי |
| `/consumer`, `/consumer/products/:id` | `pages/consumer/*` | `RoleGate role="consumer"` |
| `/institution*` (home/dashboard/products/labels/service-requests) | `pages/institution/*` | `RoleGate role="admin"` |
| `/admin` | `AdminHome` | `RoleGate role="superadmin"` |

⚠️ **`RoleGate role="admin"` בפועל מאפשר כל תפקיד חוץ מ-`consumer`** (הבדיקה היא `role !== 'consumer'`) — גם `technician` וגם `superadmin` "עוברים" לנתיבי `/institution`. `src/lib/roleHome.ts` הוא מקור האמת היחיד ל"נתיב הבית" לפי role.

⚠️ אין דף/מסך ייעודי ל-`technician` בפרונט בכלל — התפקיד קיים בטיפוסים ומוצג רק כתווית בטבלת המשתמשים באדמין.

### שכבת API (`src/lib/api.ts`)

עטיפת `fetch` (**לא axios**) — `request<T>()` מצרפת `Authorization: Bearer <token>` אוטומטית מה-store; `401` → `logout()` אוטומטי. **כל** קריאה לשרת עוברת דרך הוקים ב-`src/hooks/*.ts` העטופים ב-TanStack Query — אין `fetch`/`api` ישיר מתוך קומפוננטות UI.

### התחברות בצד לקוח

- **Google**: `GoogleSignInButton.tsx` עוטף את סקריפט ה-GSI הגלובלי (`window.google.accounts.id`, לא חבילת npm) שנטען ב-`index.html`. אם `VITE_GOOGLE_CLIENT_ID` לא מוגדר, הכפתור לא מוצג כלל.
- **טלפון+OTP**: מנוהל כולו ב-`pages/Home.tsx` עם state machine מקומי (`select` → `details` → `code`), כולל cooldown UI של 90 שניות בין שליחות.

### רכיבים מרכזיים

`PageHeader`, `Modal`, `Badge`/`WarrantyBadge`, `StatCard`, `ProductForm` (טופס יחיד ל-consumer/institution לפי `mode`), `DocumentsSection`, `ServiceRequestModal`/`ServiceRequestThread` (**אין שליחה אוטומטית** לספק — המשתמש מעתיק טקסט ושולח ידנית), `RoleGate`, `TopBar`/`ThemeToggle`.

⚠️ `src/components/InstallLocationEditor.tsx` הוא **קוד מת** — לא מיובא משום מקום (הפונקציונליות כבר בתוך `ProductForm`).

---

## 8. פריסה ל-Production

### טופולוגיה

תהליך Node **אחד** (CloudPanel, VPS לינוקס) מריץ `server/dist/index.js` שמגיש גם API וגם את ה-SPA הבנוי. MongoDB **חיצוני** (שרת נפרד), מחובר לפי `MONGODB_URI` בלבד. **אין** בריפו `.github/workflows`, `Dockerfile`, `pm2`/`ecosystem.config.js` — הפריסה היא `git pull` + build ידני; restart-on-crash מנוהל דרך ממשק ה-Node.js App של CloudPanel.

### טעינת `.env`

`server/src/env.ts` טוען את `server/.env` (**לא** `.env` בשורש) לפי **הנתיב המוחלט של הקובץ עצמו**, לא `process.cwd()` — תיקון לתקלת production אמיתית (commit `5de4b2b`) שבה ה-launcher של CloudPanel גרם ל-`dotenv` לפתור נתיב שגוי, מה שהפיל את `MONGODB_URI` בשקט לברירת מחדל ל-crash-loop.

### התנהגות מגודרת לפי `NODE_ENV`

חובה `NODE_ENV=production` בפועל ב-`server/.env` בסביבה החיה — שלוש התנהגויות תלויות בזה:

1. **CORS** — bypass ל-`localhost` מבוטל.
2. **OTP** — `PHONE_AUTH_PROVIDER=internal`/`OTP_DEMO_MODE=true` **חוסמים את עליית השרת לגמרי** (throw לפני חיבור ל-DB אפילו).
3. **הודעות שגיאה** — הלקוח מקבל הודעה גנרית בלבד; הפרטים המלאים תמיד ב-`crash.log`/console.

אם `NODE_ENV` לא מוגדר כלל — שלושת אלו **שקטות ולא פעילות**, גם אם שאר הקוד "נראה" מוכן ל-production.

### `crash.log`

נכתב אוטומטית ב-`uncaughtException`/`unhandledRejection` וגם משגיאות שמגיעות ל-`errorHandler`. ממוקם ב-**שורש הפרויקט** (לא ב-`server/`), gitignored — קיים רק בזמן ריצה על השרת עצמו. נוסף בעקבות תקלת production שבה CloudPanel לא הציג stack trace שימושי.

### Build ופריסה

```bash
# בשרת:
cd ~/htdocs/360.message.co.il
git pull
npm run build          # tsc -b && vite build → dist/ (שורש)
cd server
npm run build           # tsc → server/dist/
```

לאחר מכן לוודא `NODE_ENV=production` קיים ב-`server/.env`, ולהפעיל מחדש את תהליך ה-Node (למשל: `kill $(pgrep -f "server/dist/index.js")` — supervisor מרים אותו מחדש אוטומטית תוך שניות; כפתור ה-Restart של CloudPanel לא תמיד אמין).

### משתני סביבה מלאים

| שם | חובה? | מטרה |
|---|---|---|
| `MONGODB_URI` | **כן** | חיבור MongoDB; חסר → זריקת שגיאה, השרת לא עולה |
| `JWT_SECRET` | **כן** | חתימה/אימות JWT |
| `PORT` | לא (ברירת מחדל 4000) | פורט Express |
| `CLIENT_ORIGIN` | לא (ברירת מחדל `http://localhost:5173`) | ה-origin היחיד המותר ב-CORS ב-production |
| `NODE_ENV` | **כן בפועל** | ראו סעיף לעיל — **חובה `production` בסביבה החיה** |
| `PHONE_AUTH_PROVIDER` | לא (ברירת מחדל `external`) | `external`=SMS/WhatsApp אמיתי בתשלום; `internal` **אסור** יחד עם `NODE_ENV=production` |
| `PHONE_AUTH_BASE_URL` | לא | כתובת בסיס ל-`wa.message.co.il`, רלוונטי רק ל-`external` |
| `OTP_DEMO_MODE` | לא (ברירת מחדל `false`) | חושף קוד OTP בתשובת ה-API; **אסור** יחד עם `NODE_ENV=production` |
| `GOOGLE_CLIENT_ID` | לא טכנית (אך נדרש לפיצ'ר) | ללא זה, Google login נכשל בבקשה ידידותית — שאר האפליקציה תקינה |

---

## 9. כללי אבטחה שחובה לשמר בקוד חדש

הפרויקט עבר ביקורת אבטחה מלאה (commit `329ca27`, "Fix critical security issues found by a full audit") שמצאה וטיפלה בכ-18 ליקויים. הכללים הבאים נובעים ישירות מהתיקונים האלה — **חובה לשמר אותם בכל קוד חדש**:

- **לעולם לא לקבל `tenantId` מהקלט של הלקוח** — הוא תמיד נגזר מ-`req.auth.tenantId` (מה-JWT החתום), בכל route שיוצר/מסנן נתונים.
- **כל route שמקבל מזהה Mongo (`productId` וכו') מגוף/query — לוודא `mongoose.isValidObjectId(...)` לפני שימוש בשאילתה**, ולבדוק הרשאה (`assertProductAccess` או שקול) לפני חשיפת/עדכון הנתון.
- **קלט שהופך לחלק משאילתת Mongo (למשל `phone`/`code`) חייב ולידציית `typeof === 'string'` מפורשת** — לא רק "יש ערך" — כדי למנוע NoSQL injection דרך אובייקטי אופרטור (`{"$gt": ""}`).
- **שם קובץ בדיסק לעולם לא נגזר מקלט חיצוני** (`originalname`) — תמיד `uuid`/timestamp + סיומת שנגזרת מ-MIME מאומת דרך allow-list.
- **מחיקת קובץ מהדיסק תמיד עם `path.basename`** על ערך שמור ב-DB, לא על נתיב גולמי מהקלט.
- **`requireRole` לא היררכי** — אם צריך ש-`superadmin` יעבור גם בדיקת `requireRole('admin','technician')`, יש להוסיף אותו במפורש לרשימה, הוא לא "כלול" אוטומטית.
- **הודעות שגיאה ללקוח בפרודקשן חייבות להישאר גנריות** — אם מוסיפים error handling חדש, לא להחזיר `err.message` גולמי ללקוח כש-`NODE_ENV=production`.
- **`NODE_ENV=production` חייב להיות מוגדר בפועל בשרת החי** — בלעדיו שלוש הגנות קריטיות (CORS, חסימת OTP-דמו, הסתרת שגיאות) פשוט לא פעילות.

---

## 10. מלכודות ונקודות תשומת לב ידועות

**רב-דיירות ומודלים**
- אין קולקציית `Tenant` — `tenantId` הוא מחרוזת חופשית ללא FK/ולידציה.
- `User.phone`/`googleId` ו-`QrTag.code` ייחודיים **גלובלית**, לא per-tenant.
- `ServiceMessage.authorId` הוא `ObjectId` **בלי `ref` מוגדר** — צריך לפענח לפי `authorType` ידנית.

**Backend**
- `POST /api/brands`, `/api/product-models`, `/api/partners` פתוחים לכל `requireAuth` **כולל `consumer`** (אין `requireRole` על היצירה, כי אלו ישויות גלובליות).
- `assertProductAccess` (helper משותף) משמש את `documents.ts`/`serviceRequests.ts`, אבל `products.ts` **כותב מחדש** את אותה בדיקה בקוד שלו — כפילות לוגיקה קיימת.
- שגיאות `multer` (סוג/גודל קובץ) מגיעות ל-`errorHandler` הגלובלי כ-`500` גנרי, לא כ-`400` ידידותי.
- `lookups.ts` מורכב על `/api` הגורף — **חייב** להיטען אחרון ב-`index.ts`.

**Frontend**
- `RoleGate role="admin"` בפועל = "כל תפקיד חוץ מ-consumer" (כולל `technician` ו-`superadmin`).
- אין מסך ייעודי ל-`technician`.
- `InstallLocationEditor.tsx` — קוד מת, לא מיובא משום מקום.
- אין refresh token — JWT שפג = logout מלא, חובה כניסה מחדש.
- `decodeJwtExpiresAt` בצד לקוח הוא פענוח ללא אימות חתימה — ל-UI בלבד.

**סביבה / deploy**
- `server/.env` (לא `.env` בשורש) הוא הקובץ היחיד שנטען, לפי נתיב מוחלט של הקובץ (לא `cwd`).
- `crash.log` יושב בשורש הפרויקט (לא ב-`server/`), gitignored — קיים רק על השרת בזמן ריצה.
- אין Dockerfile/CI/pm2 בריפו — restart-on-crash מנוהל כולו דרך CloudPanel.
- תיקיית `dist/` (build הפרונט) חייבת להישאר "אחות" של `server/` — `server/dist/index.js` מאתר אותה עם שני `..`.
- `PHONE_AUTH_PROVIDER=external` (ברירת המחדל!) שולח SMS/WhatsApp **אמיתי ובתשלום** — לוודא `internal` בסביבת פיתוח/staging.
- **חשוב במיוחד**: בדקו תמיד לאיזה `MONGODB_URI` מצביע ה-`server/.env` המקומי שלכם לפני שאתם מריצים סקריפטים/מוחקים נתונים — קל בטעות לרשת קובץ `.env` שהועתק פעם מ-production.

---

## 11. רשימת בדיקה לפני commit / PR

```bash
npx tsc -b                                          # type-check צד לקוח
cd server && npx tsc -p tsconfig.json --noEmit && cd ..   # type-check צד שרת
npm run lint                                         # oxlint (סורק גם server/src)
npm run build                                        # build מלא לצד לקוח (כולל tsc -b)
```

אין כרגע test runner בפרויקט — אלו הבדיקות היחידות הזמינות. בדקו ידנית בדפדפן כל flow שנגעתם בו (במיוחד flows של הרשאות/multi-tenant — הכי קל לשבור בטעות ולא לראות מקומית עם משתמש דמו יחיד).
