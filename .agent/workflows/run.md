---
description: how to run the library management system locally
---

## لتشغيل نظام إدارة المكتبة

افتح مجلد المشروع في VS Code، ثم افتح **ترمينالين منفصلين**:

### Terminal 1 — الخادم (Backend)

```bash
npm run dev --prefix server
```

انتظر أن يظهر:

```
✅ تم الاتصال بـ MongoDB Atlas بنجاح
🚀 الخادم يعمل على المنفذ 5000
```

### Terminal 2 — الواجهة (Frontend)

```bash
npm start
```

انتظر أن يظهر:

```
Compiled successfully!
```

ثم افتح المتصفح على: **http://localhost:3000**
