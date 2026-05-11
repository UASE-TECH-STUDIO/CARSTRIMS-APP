# CARSTRIMS — Project Documentation
### Version 1.0 | Testing Phase | UASE TECH STUDIO | 2026

---

## 1. OVERVIEW

CARSTRIMS is a multi-tenant car dealer management SaaS platform built for the Nigerian market. It connects car dealers, partners, customers and staff in a single platform — from inventory management to sales tracking, messaging, appointments and public car discovery.

**Live URLs**
- Frontend: https://carstrims.vercel.app
- Backend API: https://carstrims-api.onrender.com
- API Docs: https://carstrims-api.onrender.com/docs

---

## 2. USER ROLES

| Role | Access | Dashboard |
|------|--------|-----------|
| Super Admin | Full platform control | /dashboard/super-admin |
| Dealer Admin | Own dealership full control | /dashboard/dealer |
| Dealer Staff | Permission-based access | /dashboard/staff |
| Partner / Asset Owner | Cars across dealers | /dashboard/partner |
| Public User / Buyer | Browse, save, request, message | /dashboard/user |

---

## 3. FEATURES BY ROLE

### 3.1 Super Admin
- View all dealers, users, partners on platform
- Approve or reject dealer accounts
- Broadcast messages to all users or by role
- View platform-wide analytics and growth charts
- Create dealer accounts directly
- View activity logs
- Change platform contact info and settings

### 3.2 Dealer Admin
- Full inventory management (add/edit/delete cars, 10 photos + video)
- Sales tracking with profit/loss reporting
- Expense management with categories
- Staff management with granular permissions
- Partner management (approve/reject/assign cars)
- Customer request management (respond to buyer requests)
- Appointment management (confirm/decline/complete)
- Vehicle movement logging (test drives, inspections)
- CCTV section
- QR code generation per dealership
- Dealer profile with logo, banner, socials, contact info
- Financial reports with PDF export
- Notifications for all activities
- Messaging with any user

### 3.3 Dealer Staff
- Dashboard based on assigned permissions only
- Permissions: view_inventory, add_cars, edit_cars, delete_cars, view_sales, record_sales, view_staff, create_staff, view_partners, view_movements, view_reports, view_cctv
- Profile update (photo, name, phone, whatsapp, address)
- Password change
- Messaging system
- Notifications

### 3.4 Partner / Asset Owner
- Send partnership requests to dealers
- View all linked dealers with status (pending/approved/rejected)
- View all cars assigned by dealers
- Click car to view full public detail page
- Earnings tracking
- Movement logs for assigned cars
- Find dealer page with full dealer profile, cars listing, QR code
- Messaging system
- Profile with photo upload

### 3.5 Public User / Buyer
- Browse cars on homepage feed
- Advanced filtering (brand, price, condition, transmission, fuel, state, year, color)
- Like and save/favorite cars
- Click car to view full detail (images, video, comments, specs)
- Place special requests (select dealer from search or broadcast)
- Book appointments with dealer search
- Full messaging with any user/dealer
- QR scanner to visit dealer pages
- Notifications (clickable, routes to relevant section)
- Profile with photo, personal info, password change
- Device notifications with sound (togglable)

---

## 4. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Zustand, Axios |
| Backend | FastAPI (Python), Motor (async MongoDB) |
| Database | MongoDB Atlas |
| File Storage | Cloudinary |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | Render / Railway |
| Auth | JWT (Bearer tokens) |
| Push Notifications | Web Push API + Service Worker |

---

## 5. COLOUR PALETTE

| Name | Hex | Usage |
|------|-----|-------|
| Orange | #F47B20 | Primary brand, buttons, accents |
| Orange Light | #FF9340 | Hover states |
| Orange Pale | #FFF7ED | Backgrounds, tints |
| Grey 900 | #171717 | Main text |
| Grey 700 | #404040 | Secondary text |
| Grey 500 | #737373 | Muted text |
| Grey 200 | #E5E5E5 | Borders |
| Grey 100 | #F5F5F5 | Page backgrounds |
| White | #FFFFFF | Cards, surfaces |

---

## 6. TESTING CHECKLIST

### 6.1 Auth Flow
- [ ] Register as Buyer — gets dashboard immediately
- [ ] Register as Dealer — gets pending approval notice
- [ ] Register as Partner — gets dashboard immediately
- [ ] Login with correct credentials — redirected to correct dashboard by role
- [ ] Login with wrong credentials — shows error, not generic
- [ ] Forgot password — sends temp password, can login with it
- [ ] Change password — old password no longer works
- [ ] Logout — clears session, redirects to login

### 6.2 Homepage Feed
- [ ] Cars load on page open
- [ ] Search works (brand, model, year)
- [ ] Brand tab filter works
- [ ] Filter dropdown opens/closes correctly
- [ ] All filter options work (price, condition, transmission, fuel, state, year, color)
- [ ] Active filter tags show and can be removed
- [ ] Like button works (guest and logged in)
- [ ] Save/favorite button — prompts login for guest, saves for logged in
- [ ] Share button copies link or opens share sheet
- [ ] Click car card — opens car detail page
- [ ] QR scan button (bottom) — opens camera or manual entry
- [ ] Scan QR — entering DLR-XXXXXXXX redirects to dealer page
- [ ] My Dashboard button — routes to correct dashboard by role
- [ ] Login/Register buttons visible when not logged in
- [ ] Logout button visible when logged in
- [ ] Footer contact links work

### 6.3 Car Detail Page
- [ ] All images display with navigation
- [ ] Video plays if available
- [ ] All specs show correctly
- [ ] Like count updates
- [ ] Comments load and can be posted (logged in)
- [ ] Share works
- [ ] WhatsApp contact button opens WhatsApp
- [ ] Dealer info shows with link to dealer profile

### 6.4 Dealer Dashboard
- [ ] Overview shows real stats
- [ ] Cars page: add car with 10 photos + video
- [ ] Typing in add car form — stays in form (no page jump)
- [ ] Photos upload correctly (up to 10)
- [ ] Video uploads correctly (30s limit visible)
- [ ] Edit car — pre-fills all existing data
- [ ] Mark car as sold — removes from available
- [ ] Delete car — requires reason, logs it
- [ ] Sales page — shows all sales, CSV export
- [ ] Expenses — add/edit/delete, category breakdown
- [ ] Staff — create staff with permissions, edit, toggle suspend
- [ ] Partners — approve/reject requests, assign cars
- [ ] Requests — view buyer requests, respond
- [ ] Appointments — confirm/decline/complete
- [ ] Movements — log, edit, return
- [ ] Reports — revenue, profit, expenses charts, PDF export
- [ ] Settings — update logo (single click), banner, socials, QR download
- [ ] Notifications — clickable, routes to correct section
- [ ] Messages widget — can start conversation with any user

### 6.5 Staff Dashboard
- [ ] Only shows nav items matching permissions
- [ ] Quick access cards only show permitted sections
- [ ] Each section shows "Access Restricted" with permission name when no access
- [ ] Inventory: view/add/delete based on permissions
- [ ] Sales: view/record based on permissions
- [ ] Staff: view/create based on permissions
- [ ] Settings: photo upload, profile update, password change
- [ ] Messages widget works

### 6.6 Partner Dashboard
- [ ] Find Dealer: loads all dealers, search works
- [ ] Click dealer — opens profile modal with cars, contacts, QR
- [ ] Send partnership request — button shows correct status if already linked
- [ ] My Dealers — shows all links with status (pending/approved/rejected)
- [ ] My Cars — shows assigned cars, click goes to car detail page
- [ ] Earnings — shows sales data
- [ ] Settings — photo upload, all fields update
- [ ] Messages widget works

### 6.7 User Dashboard
- [ ] Home shows stat cards (saved, requests, appointments)
- [ ] Profile — photo clickable to view big, upload works, shows new photo everywhere
- [ ] Favorites — cars show, click goes to detail, WhatsApp button, share, remove
- [ ] Requests — place request, select dealer from search dropdown, send to all works
- [ ] Dealer responds — user sees Accept/Decline buttons
- [ ] Appointments — book with dealer search, detail modal, contact buttons
- [ ] Messages — conversation list, send/receive, new chat with user search
- [ ] Notifications — clickable, routes correctly, mark read works
- [ ] QR scan on bottom nav — opens camera, manual entry works

### 6.8 Mobile Responsiveness
- [ ] All sidebars hidden by default on mobile
- [ ] Hamburger button visible on mobile in all dashboards
- [ ] Sidebar slides in/out on tap
- [ ] Overlay closes sidebar on tap
- [ ] Feed topbar — search still clickable on mobile
- [ ] Feed filter dropdown fits screen on mobile
- [ ] Car grid adjusts to 2 columns on mobile
- [ ] Modals fit screen on mobile
- [ ] Notification dropdown stays on screen on mobile
- [ ] Bottom nav visible and tappable on mobile

### 6.9 Notifications
- [ ] Notification bell shows unread count
- [ ] Dropdown stays on screen (not cut off)
- [ ] Mark single as read — dot disappears
- [ ] Mark all as read — all dots disappear
- [ ] Clicking notification — routes to correct page
- [ ] Device notification permission prompt appears
- [ ] System notification shows when new notification arrives
- [ ] Sound plays on notification (audio.mp3)
- [ ] DND toggle in settings silences sound
- [ ] Notification toggle disables system popups

### 6.10 Messaging
- [ ] Can start conversation with any user
- [ ] Messages appear in real time (auto-refresh every 5s)
- [ ] Unread count shows on message widget button
- [ ] Conversation list updates after new message
- [ ] Works in dealer, staff, partner, super admin, user dashboards
- [ ] New conversation: user search works, select user, type message, send

### 6.11 Super Admin
- [ ] Stats show platform-wide numbers
- [ ] Dealers list — approve/reject
- [ ] Users list — view all
- [ ] Broadcast — send to all or by role
- [ ] Analytics — growth charts load
- [ ] Activity log loads
- [ ] Create dealer — form works
- [ ] Settings — update contact info, password

---

## 7. KNOWN LIMITATIONS (Testing Phase)

- Push notifications require HTTPS (works on Vercel/Render, not localhost)
- Video uploads limited to 50MB by Cloudinary free tier
- Render free tier has cold start (first request may take 30-60 seconds)
- BarcodeDetector API for QR scanning not available in Firefox
- Socket server real-time messaging not yet integrated (uses 5s polling)

---

## 8. TEST CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@cardealerapp.com | Admin@12345 |
| Dealer (create your own) | Register as Dealer | — |
| Staff (create via dealer dashboard) | — | — |
| Partner | Register as Partner | — |
| Buyer | Register as Buyer | — |

---

## 9. CONTACT & SUPPORT

**Development Team:** UASE TECH STUDIO
**Platform:** CARSTRIMS 2026
**Support Email:** support@carstrims.com

---

*This document is for internal testing purposes. Please report all bugs with steps to reproduce, screenshots, and the device/browser used.*
