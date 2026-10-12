# ELECTRO STORE — Database Backup & Recovery Strategy

## 1. Scope of Backup Data
- **Products & Catalogue**: `/products`, `/categories`, `/brands`, `/banners`
- **Customer Profiles & Security**: `/users`, `/users/{userId}/addresses`
- **Orders, GST Invoices & Financials**: `/orders`, `/payments`
- **Discounts & Marketing**: `/coupons`
- **Store Configuration**: `/settings/business`, `/settings/shipping`
- **Customer Inquiries & Notifications**: `/inquiries`, `/notifications`

---

## 2. Automated Google Cloud Firestore Export Strategy

### Recommended Schedule
- **Daily Full Export**: Scheduled at 02:00 UTC via Cloud Scheduler + Cloud Functions.
- **Retention Period**: 30 days rolling in Google Cloud Storage (`gs://<PROJECT_ID>-firestore-backups`).

### Manual Immediate Backup Command
To trigger a point-in-time full database export using Google Cloud SDK:
```bash
gcloud firestore export gs://digital-store-elfin-backups/$(date +%Y-%m-%d-%H%M%S) \
  --project=digital-store-elfin
```

### Selective Collection Export Command
```bash
gcloud firestore export gs://digital-store-elfin-backups/$(date +%Y-%m-%d)/catalogue \
  --collection-ids=products,categories,brands,coupons,settings \
  --project=digital-store-elfin
```

---

## 3. Disaster Recovery & Restoration

### Restoration Command
To restore all collections or a specific collection from a cloud backup bucket:
```bash
gcloud firestore import gs://digital-store-elfin-backups/<BACKUP_FOLDER_NAME> \
  --project=digital-store-elfin
```

---

## 4. Index Audit & Query Optimization
All critical production queries are indexed:
1. `orders`: `userId ASC, createdAt DESC` (Customer Order History)
2. `orders`: `status ASC, createdAt DESC` (Admin Order Management)
3. `coupons`: `code ASC, isActive ASC` (Fast Coupon Redemption)
4. `notifications`: `userId ASC, createdAt DESC` (User Notifications)
5. `products`: `category ASC, price ASC, inStock ASC` (Filtered Catalog Browsing)
