# Warranty360

מערכת חכמה לניהול אחריות, לפי מסמך האפיון (ישויות ושדות DB) והדמו ב-mesergo.co.il.

📘 למדריך פיתוח מלא (ארכיטקטורה, API, מודל נתונים, אימות, פריסה, מלכודות ידועות) ראו [DEVELOPER.md](DEVELOPER.md).

מערכת מלאה (לא דמו): **React** בצד לקוח, **Node.js/Express + MongoDB** בצד שרת, התחברות אמיתית
עם JWT וקוד חד-פעמי (OTP), ונתוני דמו זרועים במסד נתונים אמיתי.

## מבנה הפרויקט

```
360/
├── src/            # React + TypeScript + Vite + Tailwind (צד לקוח)
├── server/         # Express + TypeScript + MongoDB/Mongoose (צד שרת / API)
└── .claude/launch.json
```

## הרצה מקומית

### 1. מסד נתונים (MongoDB)

```bash
docker run -d --name warranty360-mongo -p 27017:27017 -v warranty360-mongo-data:/data/db mongo:7
```

(אם המכולה כבר קיימת: `docker start warranty360-mongo`)

### 2. שרת API

```bash
cd server
cp .env.example .env    # לעדכן JWT_SECRET אמיתי בסביבת פרודקשן
npm install
npm run seed             # זריעת נתוני דמו למסד (חד-פעמי / לאיפוס)
npm run dev               # http://localhost:4000
```

### 3. צד לקוח (React)

```bash
npm install
npm run dev                # http://localhost:5173
```

## התחברות

ההתחברות מתבצעת עם מספר טלפון וקוד חד-פעמי (OTP), בדיוק כפי שמתואר במסמך (`users` / `otp_logins`).

⚠️ **אין כרגע חיבור לספק SMS אמיתי** (כמו Twilio) — הקוד רק נרשם ללוג השרת ומוחזר בתשובת ה-API
כאשר `OTP_DEMO_MODE=true` (ברירת המחדל), כדי לאפשר התחברות בפיתוח. לפני production יש לחבר ספק
SMS אמיתי ולכבות את המצב הזה.

משתמשי דמו זרועים במסד (לאחר `npm run seed`):
- לקוח פרטי: `0521234567`
- מנהל מוסדי: `0507654321`

## מבנה ה-API (Express)

| נתיב | תיאור |
|---|---|
| `POST /api/auth/otp/request` \| `verify` | התחברות בקוד חד-פעמי |
| `GET /api/products` \| `GET/PATCH /api/products/:id` | מוצרים (לקוח פרטי: שלי; מוסד: לפי טננט) |
| `GET/POST /api/documents` | מסמכים + הדמיית ניתוח AI לחשבונית |
| `GET /api/qr-tags` \| `PATCH /api/qr-tags/:id` | מדבקות QR |
| `GET /api/public/qr/:code` | פענוח מדבקת QR (ללא התחברות) — נתיב `/q/:code` בלקוח |
| `GET/POST /api/service-requests` \| `.../messages` | קריאות שירות + הודעות |
| `GET /api/dashboard/institution` | מדדי הדשבורד המוסדי |
| `GET /api/{brands,product-models,partners,service-providers,sites,locations}` | נתוני עזר |

כל הנתיבים (מלבד auth ו-public) דורשים `Authorization: Bearer <JWT>`.

## ישויות (Mongoose)

`server/src/models` — תואמות למסמך האפיון: `User`, `OtpLogin`, `Brand`/`ProductModel`, `Partner`,
`ServiceProvider`, `Site`/`Location`, `Product`, `ProductDocument`, `QrTag`, `ServiceRequest`/
`ServiceMessage`. שדות אבטחה פנימיים (access_token, ip...) קיימים רק בשרת ולא נחשפים ב-API.

## בדיקות

```bash
npx tsc -b && npm run lint && npm run build      # צד לקוח
cd server && npx tsc -p tsconfig.json --noEmit    # צד שרת
```
