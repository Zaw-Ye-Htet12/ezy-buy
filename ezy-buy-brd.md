# Business Requirements Document
## SmartStore Online Ordering System

---

| Field | Details |
|---|---|
| **Project Name** | SmartStore Online Ordering System |
| **Document Version** | v1.1 |
| **Prepared By** | Project Initiator / Store Owner |
| **Date** | March 12, 2026 |
| **Classification** | Confidential — Internal Use Only |
| **Status** | Draft — Pending Approval |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Justification](#2-problem-statement--justification)
3. [Project Scope](#3-project-scope)
4. [Stakeholders](#4-stakeholders)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Proposed System Architecture](#7-proposed-system-architecture)
8. [Database Design](#8-database-design)
9. [API Design Overview](#9-api-design-overview-nestjs-rest)
10. [Key User Flows](#10-key-user-flows)
11. [Proposed Development Timeline](#11-proposed-development-timeline)
12. [Risks & Mitigation](#12-risks--mitigation)
13. [Success Metrics](#13-success-metrics)

---

## 1. Executive Summary

This document defines the business requirements for the **SmartStore Online Ordering System** — a digital platform designed to eliminate unnecessary customer wait times in-store. Customers will be able to browse products, place orders, and choose between **Click & Collect** or **Home Delivery** (restricted to nearby locations) from any device.

The solution directly targets the core operational pain point: customers standing in physical queues to order and pay. By shifting the ordering process online, the store can serve more customers simultaneously, reduce physical congestion, and create a modern purchasing experience that aligns with customer expectations.

---

## 2. Problem Statement & Justification

### 2.1 Current State Analysis

At present, all customer orders are handled in-person at the store counter. This creates the following operational problems:

- Customers must physically travel to the store to place an order, even for routine or repeat purchases.
- Queue waiting times during peak hours create frustration and negatively impact customer satisfaction.
- Staff bandwidth is consumed managing walk-in queue flow, leaving less time for order preparation.
- Lost customers: potential buyers who see a long queue may leave without purchasing.
- No historical order data is captured, making demand forecasting and inventory planning difficult.
- No mechanism to serve customers outside of physical store proximity.

### 2.2 Does This Project Solve the Problem?

**Yes** — with the following reasoning:

| Problem | Current Situation | After Implementation |
|---|---|---|
| Queue wait times | 5–20 min average wait | Eliminated — orders placed online |
| Peak hour congestion | Physical bottleneck at counter | Distributed online ordering load |
| Limited reach | Walk-in customers only | Online + nearby delivery radius |
| No order history | Manual receipts only | Full digital order history per customer |
| Staff overload | Counter staff manage queue & orders | Staff focus on fulfillment only |
| Lost customers (queue dropout) | No recovery mechanism | Customers order remotely, no dropout |

The project is justified. All primary pain points are directly addressed by the proposed solution. The investment in a Next.js + NestJS platform will yield measurable improvements in customer throughput, satisfaction, and revenue capture.

---

## 3. Project Scope

### 3.1 In Scope

- Customer-facing web application (responsive, mobile-first) built with Next.js
- Admin/store management dashboard for product, order, and delivery management
- Backend API built with NestJS (REST)
- Product catalog with categories, descriptions, images, pricing, and availability
- Shopping cart and checkout flow
- Two fulfillment options: Click & Collect and Home Delivery (nearby radius only)
- Location-based delivery radius enforcement using geolocation
- Order status tracking (Pending → Preparing → Ready / Out for Delivery → Completed)
- Customer authentication (registration, login, password reset)
- Manual payment via bank transfer / mobile banking slip upload
- Admin payment verification dashboard (approve / reject slip submissions)
- Notifications (email / SMS / push) for order confirmation and status updates
- Basic admin reporting: orders per day, revenue, popular products

### 3.2 Out of Scope (Phase 1)

- Loyalty or points reward system
- Multi-store / franchise management
- Third-party delivery platform integrations (e.g., GrabFood, Foodpanda)
- Native iOS/Android apps (web app only for Phase 1)
- AI-based product recommendations

---

## 4. Stakeholders

| Stakeholder | Role | Interest |
|---|---|---|
| Store Owner | Project Sponsor & Admin | Revenue growth, operational efficiency |
| Store Staff | Order Fulfillment | Clear order queue, reduced walk-in pressure |
| Customers | End Users | Convenient ordering, no queue, fast service |
| Dev Team | Builders | Clear requirements, defined API contracts |
| Delivery Personnel | Last-mile delivery | Accurate addresses, real-time order updates |

---

## 5. Functional Requirements

### 5.1 Customer Module

1. Customers can register an account with name, email, phone, and password.
2. Customers can log in and log out securely.
3. Customers can browse the product catalog by category and search by keyword.
4. Customers can view product details: name, description, image, price, availability.
5. Customers can add/remove items to/from a shopping cart.
6. Customers can specify product options or special instructions per item.
7. Customers can checkout with two fulfillment options: Click & Collect or Home Delivery.
8. For Home Delivery, the system validates that the customer address is within the allowed delivery radius.
9. Customers can transfer payment and upload a payment slip image for admin verification.
10. Customers receive an order confirmation with estimated preparation/delivery time.
11. Customers can track their order status in real time.
12. Customers can view their full order history.

### 5.2 Admin / Store Management Module

1. Admin can manage the product catalog: add, edit, delete products and categories.
2. Admin can set product availability (in stock / out of stock) instantly.
3. Admin can view all incoming orders in a live order queue dashboard.
4. Admin can update order status at each stage of fulfillment.
5. Admin can configure the delivery radius (distance in km from store).
6. Admin can manage customer accounts (view, disable).
7. Admin can view sales reports: daily revenue, orders, top-selling products.
8. Admin can set store operating hours and pause online ordering when the store is closed.

### 5.3 Click & Collect Service

1. Customer selects Click & Collect at checkout.
2. Customer chooses a preferred collection time slot.
3. Admin is notified of the order; staff prepare items.
4. Customer receives notification when the order is ready for collection.
5. Customer presents order confirmation (QR code or order number) at store.

### 5.4 Home Delivery Service

1. Customer enters a delivery address at checkout.
2. System calculates distance from the store using geolocation API.
3. If address is outside allowed radius, delivery option is disabled with clear messaging.
4. If within radius, customer can proceed. Delivery fee is calculated and shown.
5. Admin assigns order to available delivery personnel.
6. Customer receives real-time status updates (Preparing → Out for Delivery → Delivered).

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | Page load time | < 2 seconds on 4G mobile |
| Availability | System uptime | 99.5% uptime (excluding planned maintenance) |
| Scalability | Concurrent users | Support 200+ concurrent sessions |
| Security | Authentication | JWT tokens, HTTPS enforced, bcrypt password hashing |
| Security | Payment slip storage | Slip images stored in private S3 bucket, accessible only to admin; no sensitive card data ever stored |
| Usability | Mobile experience | Responsive, thumb-friendly UI on all screen sizes |
| Maintainability | Code standards | Typed codebase (TypeScript), documented APIs |
| Accessibility | WCAG compliance | WCAG 2.1 Level AA for core customer flows |

---

## 7. Proposed System Architecture

### 7.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js (React) | SSR/SSG for SEO, fast page loads, excellent DX |
| Styling | Tailwind CSS | Utility-first, rapid responsive UI development |
| Backend | NestJS (Node.js) | Modular, scalable, TypeScript-first REST API framework |
| ORM | Prisma | Type-safe DB access, migration management, schema clarity |
| Primary DB | PostgreSQL | Relational, reliable, supports complex queries & transactions |
| Cache | Redis | Session storage, rate limiting, real-time order queue |
| Auth | JWT + Refresh Tokens | Stateless, scalable authentication |
| Payments | Manual Slip Upload | Bank transfer + mobile banking (KBZPay, Wave Money, AYA Pay, CB Pay); customer uploads slip image for admin verification |
| Slip Storage | AWS S3 (private bucket) | Secure, access-controlled storage for payment slip images |
| Notifications | Nodemailer + Twilio | Email order confirmations, SMS status updates |
| Geo / Maps | Google Maps Platform | Distance Matrix API for delivery radius validation |
| File Storage | AWS S3 / Cloudinary | Product image uploads and CDN delivery |
| Hosting | Vercel (frontend) + Railway/Render (API) | Easy deployment, scalable infrastructure |

---

## 8. Database Design

### 8.1 Entity Relationship Overview

The database is designed around five primary domains: **Users & Auth**, **Product Catalog**, **Orders & Items**, **Delivery**, and **Store Configuration**. All tables include `created_at` and `updated_at` timestamps. Soft deletes are used for products and users to preserve order history integrity.

### 8.2 Core Tables

#### `users`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| phone | VARCHAR(20) | UNIQUE | Contact number |
| password_hash | TEXT | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(100) | NOT NULL | Display name |
| role | ENUM | NOT NULL | `customer \| staff \| admin` |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration timestamp |

#### `addresses`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → users | Belongs to user |
| label | VARCHAR(50) | | e.g. 'Home', 'Office' |
| address_line1 | TEXT | NOT NULL | Street address |
| city | VARCHAR(100) | NOT NULL | City |
| latitude | DECIMAL(10,8) | NOT NULL | GPS latitude for distance calc |
| longitude | DECIMAL(11,8) | NOT NULL | GPS longitude for distance calc |
| is_default | BOOLEAN | DEFAULT false | Default delivery address |

#### `categories`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Category name |
| slug | VARCHAR(100) | UNIQUE | URL-friendly identifier |
| parent_id | UUID | FK → categories, NULL | Supports sub-categories |
| sort_order | INTEGER | DEFAULT 0 | Display ordering |
| is_active | BOOLEAN | DEFAULT true | Show/hide category |

#### `products`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| category_id | UUID | FK → categories | Product category |
| name | VARCHAR(200) | NOT NULL | Product name |
| slug | VARCHAR(200) | UNIQUE | URL-friendly identifier |
| description | TEXT | | Full product description |
| price | DECIMAL(10,2) | NOT NULL | Current selling price (MMK) |
| image_url | TEXT | | CDN image URL |
| is_available | BOOLEAN | DEFAULT true | Toggle availability instantly |
| is_deleted | BOOLEAN | DEFAULT false | Soft delete |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |

#### `product_options` & `product_option_values`

Supports configurable products (e.g., size, add-ons, spice level).

| Column | Type | Constraint | Description |
|---|---|---|---|
| product_options.id | UUID | PK | Option group (e.g. 'Size') |
| product_options.product_id | UUID | FK → products | Parent product |
| product_options.name | VARCHAR(100) | NOT NULL | Option label |
| product_option_values.id | UUID | PK | Specific option value |
| product_option_values.option_id | UUID | FK → product_options | Parent option group |
| product_option_values.label | VARCHAR(100) | NOT NULL | e.g. 'Large' |
| product_option_values.price_delta | DECIMAL(8,2) | DEFAULT 0 | Price adjustment (+/-) |

#### `orders`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| order_number | VARCHAR(20) | UNIQUE, NOT NULL | Human-readable order ID (e.g. ORD-20240312-001) |
| user_id | UUID | FK → users | Placing customer |
| fulfillment_type | ENUM | NOT NULL | `click_and_collect \| home_delivery` |
| status | ENUM | NOT NULL | `pending \| confirmed \| preparing \| ready \| out_for_delivery \| delivered \| cancelled` |
| subtotal | DECIMAL(10,2) | NOT NULL | Items total before fees |
| delivery_fee | DECIMAL(8,2) | DEFAULT 0 | 0 for click & collect |
| total_amount | DECIMAL(10,2) | NOT NULL | subtotal + delivery_fee |
| special_instructions | TEXT | | Customer order notes |
| estimated_ready_at | TIMESTAMP | | ETA set by staff |
| created_at | TIMESTAMP | DEFAULT NOW() | Order placement time |
| updated_at | TIMESTAMP | AUTO UPDATE | Last status change |

#### `order_items`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| order_id | UUID | FK → orders | Parent order |
| product_id | UUID | FK → products | Ordered product (snapshot ref) |
| product_name | VARCHAR(200) | NOT NULL | Name snapshot at order time |
| unit_price | DECIMAL(10,2) | NOT NULL | Price snapshot at order time |
| quantity | INTEGER | NOT NULL | Quantity ordered |
| selected_options | JSONB | | Selected option values + deltas |
| item_total | DECIMAL(10,2) | NOT NULL | unit_price × quantity + options |

#### `deliveries`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| order_id | UUID | FK → orders, UNIQUE | One delivery per order |
| address_id | UUID | FK → addresses | Delivery destination |
| delivery_person_id | UUID | FK → users, NULL | Assigned staff |
| distance_km | DECIMAL(6,2) | NOT NULL | Calculated delivery distance |
| dispatched_at | TIMESTAMP | NULL | When item left store |
| delivered_at | TIMESTAMP | NULL | Confirmed delivery time |

#### `collect_slots` (Click & Collect)

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| order_id | UUID | FK → orders, UNIQUE | One slot per order |
| slot_time | TIMESTAMP | NOT NULL | Customer's chosen pickup time |
| collected_at | TIMESTAMP | NULL | Actual collection timestamp |
| notes | TEXT | | Staff notes |

#### `payments`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| order_id | UUID | FK → orders | Related order |
| payment_method | ENUM | NOT NULL | `kbz_pay \| wave_money \| aya_pay \| cb_pay \| bank_transfer \| other` |
| bank_account_ref | VARCHAR(100) | | Store's bank/wallet account number shown to customer |
| amount | DECIMAL(10,2) | NOT NULL | Expected payment amount (MMK) |
| currency | VARCHAR(3) | DEFAULT 'MMK' | Myanmar Kyat |
| slip_image_url | TEXT | NOT NULL | Private S3 URL of uploaded payment slip |
| slip_uploaded_at | TIMESTAMP | NOT NULL | When customer submitted the slip |
| status | ENUM | NOT NULL | `pending_review \| approved \| rejected` |
| reviewed_by | UUID | FK → users, NULL | Admin who verified the slip |
| reviewed_at | TIMESTAMP | NULL | Time of admin approval/rejection |
| rejection_reason | TEXT | NULL | Reason shown to customer if rejected |
| transaction_ref | VARCHAR(100) | NULL | Optional: transaction ID from slip |

#### `store_payment_accounts`

Stores the bank/wallet accounts customers should transfer to. Admin can manage multiple accounts.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| payment_method | ENUM | NOT NULL | `kbz_pay \| wave_money \| aya_pay \| cb_pay \| bank_transfer` |
| account_name | VARCHAR(100) | NOT NULL | Account holder name |
| account_number | VARCHAR(50) | NOT NULL | Account/phone number |
| bank_name | VARCHAR(100) | NULL | Bank name (for bank transfers) |
| qr_code_image_url | TEXT | NULL | QR code image for mobile payment |
| is_active | BOOLEAN | DEFAULT true | Show/hide this payment option |
| sort_order | INTEGER | DEFAULT 0 | Display order in checkout |

#### `store_settings`

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | UUID | PK | Single-row config table |
| store_name | VARCHAR(100) | NOT NULL | Display name |
| store_latitude | DECIMAL(10,8) | NOT NULL | Store GPS latitude |
| store_longitude | DECIMAL(11,8) | NOT NULL | Store GPS longitude |
| delivery_radius_km | DECIMAL(5,2) | NOT NULL | Max delivery distance |
| delivery_fee_per_km | DECIMAL(6,2) | NOT NULL | Fee calculation basis |
| min_delivery_fee | DECIMAL(6,2) | NOT NULL | Minimum delivery charge |
| is_accepting_orders | BOOLEAN | DEFAULT true | Master on/off switch |
| opening_hours | JSONB | NOT NULL | Operating hours per day of week |

---

## 9. API Design Overview (NestJS REST)

### 9.1 Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Customer registration |
| POST | `/auth/login` | Login, returns JWT access + refresh token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Trigger password reset email |

### 9.2 Product & Catalog Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | List all active categories |
| GET | `/products` | List products (filter by category, search, page) |
| GET | `/products/:id` | Get product detail with options |
| POST | `/admin/products` | Create product [Admin] |
| PATCH | `/admin/products/:id` | Update product / toggle availability [Admin] |
| DELETE | `/admin/products/:id` | Soft delete product [Admin] |

### 9.3 Order Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Place new order (includes checkout) |
| GET | `/orders/my` | Customer's own order history |
| GET | `/orders/:id` | Order detail + status |
| GET | `/admin/orders` | All orders with filters [Admin/Staff] |
| PATCH | `/admin/orders/:id/status` | Update order status [Admin/Staff] |
| POST | `/delivery/validate` | Check if address is within delivery radius |

### 9.4 Payment Slip Module (Myanmar Market)

Since international payment gateways (Stripe, PayPal) do not support Myanmar (MMR), all payments are handled manually via bank transfer or mobile wallet transfer. The customer uploads a payment slip screenshot, and an admin verifies it before the order is confirmed.

#### Supported Payment Methods

| Method | Type | Notes |
|---|---|---|
| KBZPay | Mobile Wallet | Most widely used in Myanmar |
| Wave Money | Mobile Wallet | Popular for rural & urban users |
| AYA Pay | Mobile Wallet | AYA Bank's mobile payment |
| CB Pay | Mobile Wallet | CB Bank's mobile payment |
| Bank Transfer | Bank | KBZ, AYA, CB, AGD, Yoma Bank etc. |

#### Customer Payment Flow

1. Customer places order and reaches the payment step.
2. System displays the store's active payment accounts (name, account number, QR code if available) for the customer's selected payment method.
3. Customer transfers the exact order total to the displayed account using their banking/wallet app.
4. Customer takes a screenshot of the transfer confirmation (payment slip).
5. Customer uploads the slip image directly in the app (JPEG/PNG, max 5MB).
6. Order status changes to 'Pending Payment Verification'. Customer sees a holding screen.
7. Customer receives a notification: "Your payment slip has been received. We will confirm your order shortly."

#### Admin Slip Verification Flow

1. Admin/staff receives a real-time alert (push notification + dashboard badge) for a new slip awaiting review.
2. Admin opens the payment verification queue in the dashboard.
3. Admin views: order summary, expected amount (MMK), submitted slip image (full-size), customer name and contact.
4. Admin cross-checks the slip: transfer amount, recipient account, transaction reference if visible.
5. If approved: admin clicks Approve. Order status advances to 'Confirmed → Preparing'. Customer is notified.
6. If rejected: admin selects a rejection reason (wrong amount, unreadable slip, duplicate submission, etc.) and clicks Reject. Order status returns to 'Awaiting Payment'. Customer is notified with the reason and can re-upload.
7. Customer has up to 3 re-upload attempts before the order is auto-cancelled.

#### Payment Slip API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/payment-accounts` | List active store payment accounts (shown at checkout) |
| POST | `/orders/:id/payment-slip` | Customer uploads payment slip (multipart/form-data) |
| GET | `/orders/:id/payment` | Get payment status for an order |
| GET | `/admin/payments/pending` | List all slips awaiting admin review [Admin] |
| PATCH | `/admin/payments/:id/approve` | Approve payment slip, advance order [Admin] |
| PATCH | `/admin/payments/:id/reject` | Reject slip with reason, notify customer [Admin] |
| GET | `/admin/payment-accounts` | Manage store payment accounts [Admin] |
| POST | `/admin/payment-accounts` | Add new payment account [Admin] |
| PATCH | `/admin/payment-accounts/:id` | Update or toggle account visibility [Admin] |

---

## 10. Key User Flows

### 10.1 Customer Ordering Flow

1. Customer visits the store web app on mobile or desktop.
2. Customer browses categories and product listings.
3. Customer selects items, sets options/quantities, adds to cart.
4. Customer proceeds to checkout, selects fulfillment type.
5. For Home Delivery: customer enters/selects delivery address. System validates distance.
6. For Click & Collect: customer selects preferred collection time slot.
7. Customer reviews order summary and total (including delivery fee if applicable).
8. Customer transfers payment via bank transfer or mobile banking (KBZPay, Wave Money, AYA Pay, CB Pay, etc.).
9. Customer uploads a payment slip (screenshot/photo) directly in the app.
10. Admin reviews and verifies the payment slip in the management dashboard.
11. Order is confirmed only after admin approves the payment slip.
12. Order confirmation is displayed on-screen and sent via email/SMS.
13. Customer tracks order status in real time from their account.

### 10.2 Staff Order Fulfillment Flow

1. Staff sees new order appear in the live order queue dashboard.
2. Staff confirms and begins preparing the order, updates status to 'Preparing'.
3. For Click & Collect: staff marks order 'Ready', customer is notified automatically.
4. For Home Delivery: staff marks 'Ready', assigns delivery personnel, status changes to 'Out for Delivery'.
5. Delivery personnel marks 'Delivered' upon completion. Customer is notified.

---

## 11. Proposed Development Timeline

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 1 | 2 Weeks | Project setup, DB schema, NestJS boilerplate, auth module, user module |
| Phase 2 | 2 Weeks | Product catalog (CRUD), category management, image upload, admin product dashboard |
| Phase 3 | 2 Weeks | Cart system, checkout flow, Click & Collect logic, collect slot management |
| Phase 4 | 2 Weeks | Home delivery module, geolocation/distance validation, delivery fee calculation |
| Phase 5 | 1 Week | Payment slip upload flow, store payment account management, admin slip verification dashboard, order confirmation & rejection notifications |
| Phase 6 | 1 Week | Notifications (email/SMS), order status tracking, customer order history |
| Phase 7 | 1 Week | Admin order queue dashboard, reporting, store settings, operating hours |
| Phase 8 | 1 Week | QA/testing, performance optimization, security review, UAT with store staff |
| Phase 9 | 3 Days | Production deployment, DNS setup, go-live checklist, staff training |
| **Total** | **~12 Weeks** | **Full production-ready system** |

---

## 12. Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Low customer adoption of online ordering | High | Offer incentive (first order discount), in-store signage, staff guidance |
| Fraudulent or fake payment slips | High | Admin must manually verify every slip before confirming order; clear rejection reason + customer notification flow; admin can view full-size slip image |
| Admin verification bottleneck at peak hours | Medium | Multiple staff can access the verification dashboard; push/sound alert for new pending slips; set SLA of 15 min review window |
| Inaccurate delivery radius enforcement | High | Use Google Maps Distance Matrix API (not straight-line distance) |
| Order surge causing backend slowdowns | Medium | Redis queue for order processing, rate limiting, load testing before go-live |
| Staff resistance to new workflow | Medium | Simple, mobile-friendly staff dashboard; conduct training session before launch |
| Data privacy concerns (PDPA compliance) | High | Privacy policy in place, customer data consent at registration, secure data handling |

---

## 13. Success Metrics

The following KPIs will be used to evaluate whether the project has achieved its objectives within 90 days of go-live:

| Metric | Baseline (Current) | Target (90 Days Post-Launch) |
|---|---|---|
| Avg. customer queue wait time | 5–20 minutes | < 2 minutes (walk-in only) |
| % of orders placed online | 0% | > 40% of total daily orders |
| Customer satisfaction (NPS) | Not measured | NPS > 50 |
| Daily order volume | Baseline at launch | +20% within 90 days |
| Order dropout rate (walk-in) | Unmeasured | Measurably reduced (tracked via survey) |
| Click & Collect fulfillment time | N/A | < 15 minutes from order placement |
| Home Delivery on-time rate | N/A | > 90% delivered within estimated window |

---

*END OF DOCUMENT — SmartStore Online Ordering System BRD v1.1*