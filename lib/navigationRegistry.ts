/**
 * Navigation intent registry — powers the "tell me what you want to
 * do" search feature. Someone can type or say something like "I want
 * to add a car" or "change my password" and get taken straight to
 * the right page, without needing to know the app's menu structure.
 *
 * Built specifically with less tech-confident users in mind (as
 * requested — the "keke/okada" example): plain language descriptions,
 * generous keyword lists including common local terms and phrasing,
 * and a scoring match rather than requiring an exact phrase.
 */

export interface NavEntry {
  path: string;
  label: string;
  description: string;
  keywords: string[];
  roles: Role[];
}

export type Role = "user" | "dealer" | "staff" | "partner" | "super-admin";

const ENTRIES: NavEntry[] = [
  // ── Universal (all roles) ──────────────────────────────────────
  { path: "/how-it-works", label: "How CARSTRIMS Works", description: "New here? Learn what this app is for and how to use it", keywords: ["how it works", "what is this app", "i am new", "i'm new", "new here", "i dont know", "i don't know", "confused", "help", "what can i do", "how do i use this", "teach me", "explain this app", "what is carstrims for", "how does this benefit me", "getting started", "learn", "guide", "tutorial", "i dont understand"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/feed", label: "Browse Vehicles", description: "See all cars, motorcycles, and other vehicles for sale", keywords: ["browse", "see cars", "look at cars", "feed", "home", "vehicles", "shop"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/messages", label: "Messages", description: "Talk to a dealer, buyer, or send a message", keywords: ["message", "chat", "talk to dealer", "talk to buyer", "contact", "text someone", "reply", "inbox"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/notifications", label: "Notifications", description: "See your alerts and updates", keywords: ["notification", "alert", "updates", "what happened"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/settings", label: "Settings", description: "Change your password, profile picture, or account details", keywords: ["settings", "change password", "change my password", "reset password", "profile picture", "edit profile", "account", "update my details", "change email", "change phone"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/appointments", label: "Appointments", description: "Book or manage a showroom visit or test drive", keywords: ["appointment", "test drive", "visit", "showroom", "book a visit", "schedule"], roles: ["user","dealer","staff"] },

  // ── Buyer / user (thoroughly audited: every page + sub-states) ──
  { path: "/dashboard/user", label: "My Dashboard", description: "Your buyer dashboard overview", keywords: ["dashboard", "my account", "overview", "home page", "main page"], roles: ["user"] },

  { path: "/dashboard/user/favorites", label: "Saved Vehicles", description: "Cars and vehicles you've saved to look at later", keywords: ["saved", "save", "save for later", "save this car", "keep this car", "favorites", "favourite", "wishlist", "bookmarked", "cars i liked", "vehicles i saved"], roles: ["user"] },

  { path: "/dashboard/user/requests?action=new", label: "Make a Request", description: "Ask for a specific vehicle you're looking for — dealers respond with matches", keywords: ["make a request", "send a request", "new request", "ask for a car", "custom request", "find me a car", "i want a specific car", "cant find what i want", "request a vehicle"], roles: ["user"] },
  { path: "/dashboard/user/requests", label: "My Requests", description: "Vehicle requests you've sent to dealers and their responses", keywords: ["request", "my requests", "requests i sent", "dealer response", "request status"], roles: ["user"] },

  { path: "/dashboard/user/appointments", label: "My Appointments", description: "Test drives and showroom visits you've booked", keywords: ["appointment", "test drive", "showroom visit", "my bookings", "booked visit"], roles: ["user"] },

  { path: "/dashboard/user/profile#password", label: "Change Password", description: "Update your account password", keywords: ["change password", "change my password", "reset password", "new password", "update password", "forgot password"], roles: ["user"] },
  { path: "/dashboard/user/profile#personal", label: "Personal Information", description: "Update your name, phone number, address, city, state", keywords: ["personal info", "my name", "my phone number", "my address", "update my details", "change my phone", "change my name"], roles: ["user"] },
  { path: "/dashboard/user/profile#social", label: "Social Media Links", description: "Add your Facebook, Instagram, TikTok, WhatsApp, or website", keywords: ["social media", "facebook", "instagram", "tiktok", "whatsapp link", "my website", "social links"], roles: ["user"] },
  { path: "/dashboard/user/profile", label: "My Profile & Account", description: "View and edit your account information", keywords: ["profile", "my info", "about me", "account", "settings", "my account"], roles: ["user"] },

  { path: "public-user-profile", label: "My Public Profile", description: "See how your profile looks to dealers and other users", keywords: ["public profile", "how others see me", "my page", "my public info"], roles: ["user"] },

  { path: "/dashboard/partner/find-dealer", label: "Become a Partner", description: "Apply to become a consignor/partner and work with a dealer to sell vehicles", keywords: ["become a partner", "new partner", "consignor", "partner with a dealer", "i am a new partner", "what should i do as partner", "sell for a dealer", "work with dealer", "assign car to me", "link with dealer"], roles: ["user"] },

  // ── Dealer (thoroughly audited: every page + sub-states/modals) ──
  { path: "/dashboard/dealer", label: "Dealer Dashboard", description: "Your dealer dashboard overview and stats", keywords: ["dashboard", "overview", "home page", "main page", "summary"], roles: ["dealer"] },

  { path: "/dashboard/dealer/cars?action=add", label: "Add a Vehicle", description: "Add a new car, motorcycle, tricycle (keke), or other vehicle to your inventory", keywords: ["add car", "add vehicle", "add a car", "i want to add a car", "list a car", "new car", "upload car", "add keke", "add okada", "add motor", "add motorcycle", "add tricycle", "add truck", "add bus", "add van", "post a car", "put up a car"], roles: ["dealer"] },
  { path: "/dashboard/dealer/cars", label: "My Vehicles & Inventory", description: "See, search, and edit all vehicles in your inventory", keywords: ["inventory", "my cars", "my vehicles", "car list", "all my cars", "see my cars", "edit car", "vehicle list", "stock"], roles: ["dealer"] },

  { path: "/dashboard/dealer/sales?action=add", label: "Record a Sale", description: "Record a new vehicle sale", keywords: ["record a sale", "make a sale", "sell a car", "add sale", "manual sale", "i sold a car", "just sold a car", "log a sale"], roles: ["dealer"] },
  { path: "/dashboard/dealer/sales", label: "Sales History", description: "View past sales, receipts, and edit sale records", keywords: ["sales", "sold", "receipt", "who bought", "sales history", "past sales", "invoice"], roles: ["dealer"] },

  { path: "/dashboard/dealer/expenses?action=add", label: "Add an Expense", description: "Log a new expense on a vehicle", keywords: ["add expense", "log expense", "new expense", "record spending", "repair cost", "maintenance cost"], roles: ["dealer"] },
  { path: "/dashboard/dealer/expenses", label: "Expenses", description: "Track and review expenses on your vehicles", keywords: ["expenses", "cost", "spending", "money spent"], roles: ["dealer"] },

  { path: "/dashboard/dealer/staff?action=add", label: "Add a Staff Member", description: "Create a new staff account with a role and permissions", keywords: ["add staff", "new staff", "add employee", "add worker", "create staff account", "hire", "add a staff member"], roles: ["dealer"] },
  { path: "/dashboard/dealer/staff", label: "Staff", description: "Manage staff accounts and permissions", keywords: ["staff", "employee", "manage staff", "workers", "team", "staff permissions", "delete staff", "remove staff"], roles: ["dealer"] },
  { path: "/dashboard/dealer/id-cards", label: "ID Cards", description: "Generate and download professional ID cards for the dealer or staff members", keywords: ["id card", "id cards", "print id card", "staff id card", "generate id card", "identity card", "employee card", "business card"], roles: ["dealer"] },

  { path: "/dashboard/dealer/partners", label: "Partners & Consignors", description: "Manage consignors/partners, assign vehicles, approve partner requests", keywords: ["partner", "consignor", "assign car", "assign vehicle", "approve partner", "partner request", "link partner", "my partners"], roles: ["dealer"] },

  { path: "/dashboard/dealer/requests", label: "Customer Requests", description: "Vehicle requests sent to you by buyers, respond or make a counter offer", keywords: ["request", "customer request", "buyer request", "someone wants a car", "respond to request", "counter offer"], roles: ["dealer"] },

  { path: "/dashboard/dealer/appointments", label: "Appointments", description: "Showroom visits and test drive bookings from buyers", keywords: ["appointment", "test drive", "showroom visit", "booking", "confirm appointment"], roles: ["dealer"] },

  { path: "/dashboard/dealer/movements", label: "Vehicle Movements", description: "Track vehicles taken out for test drives, inspection, or delivery", keywords: ["movement", "car taken out", "test drive log", "who has the car", "track vehicle", "car out"], roles: ["dealer"] },

  { path: "/dashboard/dealer/reports", label: "Financial Reports", description: "Full financial report — revenue, profit, expenses, top brands, staff performance", keywords: ["report", "financial report", "revenue", "profit", "how much did i make", "business summary", "monthly breakdown"], roles: ["dealer"] },

  { path: "/dashboard/dealer/cctv", label: "CCTV", description: "View your showroom security camera feeds", keywords: ["cctv", "camera", "security camera", "watch showroom", "surveillance"], roles: ["dealer"] },

  { path: "/dashboard/dealer/settings#password", label: "Change Password", description: "Update your account password", keywords: ["change password", "change my password", "reset password", "new password", "update password", "forgot password"], roles: ["dealer"] },
  { path: "/dashboard/dealer/settings#profile", label: "Profile Picture & Signature", description: "Update your profile picture or digital signature", keywords: ["profile picture", "change photo", "signature", "digital signature", "my photo"], roles: ["dealer"] },
  { path: "/dashboard/dealer/settings#branding", label: "Branding & Identity", description: "Update your dealership logo and branding", keywords: ["logo", "branding", "change logo", "company logo", "brand identity"], roles: ["dealer"] },
  { path: "/dashboard/dealer/settings", label: "Account Settings", description: "Account info, dealership info, address, socials", keywords: ["settings", "account", "update my details", "change email", "change phone", "dealership information", "address", "facebook", "instagram", "social media"], roles: ["dealer"] },

  { path: "/dashboard/dealer/setup", label: "Business Setup", description: "Set up your dealership profile, CAC certificate, CCTV setup", keywords: ["setup", "business setup", "company info", "dealership profile", "cac certificate", "cctv setup", "getting started"], roles: ["dealer"] },

  { path: "/dashboard/dealer/messages", label: "Messages", description: "Chat with buyers, partners, and staff", keywords: ["message", "chat", "talk to buyer", "contact", "inbox", "reply"], roles: ["dealer"] },

  { path: "public-profile", label: "My Public Profile", description: "See how your dealership looks to customers browsing the app", keywords: ["public profile", "my profile", "how customers see me", "my page", "storefront", "my listing page"], roles: ["dealer"] },

  // ── Staff (thoroughly audited: every page, all permission-gated
  // wrappers around the matching dealer page component) ───────────
  { path: "/dashboard/staff", label: "Staff Dashboard", description: "Your staff dashboard overview", keywords: ["dashboard", "overview", "home page", "main page"], roles: ["staff"] },

  { path: "/dashboard/staff/inventory/add?action=add", label: "Add a Vehicle", description: "Add a new car, motorcycle, tricycle (keke), or other vehicle to inventory (needs add_cars permission)", keywords: ["add car", "add vehicle", "add a car", "i want to add a car", "list a car", "new car", "upload car", "add keke", "add okada", "add motor"], roles: ["staff"] },
  { path: "/dashboard/staff/inventory", label: "Vehicle Inventory", description: "See and manage the dealership's vehicles", keywords: ["inventory", "my cars", "cars", "car list", "vehicle list", "stock"], roles: ["staff"] },

  { path: "/dashboard/staff/sales", label: "Sales", description: "Record a sale, view sales history, receipts", keywords: ["sales", "sold", "record a sale", "make a sale", "sell a car", "receipt", "who bought"], roles: ["staff"] },
  { path: "/dashboard/staff/expenses", label: "Expenses", description: "Track expenses on vehicles", keywords: ["expenses", "cost", "spending", "money spent", "repair cost"], roles: ["staff"] },
  { path: "/dashboard/staff/partners", label: "Partners", description: "Manage consignors/partners, assign vehicles", keywords: ["partner", "consignor", "assign car", "assign vehicle"], roles: ["staff"] },
  { path: "/dashboard/staff/requests", label: "Customer Requests", description: "Vehicle requests from buyers", keywords: ["request", "customer request", "buyer request", "someone wants a car", "somebody wants to buy", "customer wants to buy", "buyer wants"], roles: ["staff"] },
  { path: "/dashboard/staff/appointments", label: "Appointments", description: "Showroom visits and test drive bookings", keywords: ["appointment", "test drive", "showroom visit", "booking"], roles: ["staff"] },
  { path: "/dashboard/staff/movements", label: "Vehicle Movements", description: "Track vehicles taken out for test drives or inspection", keywords: ["movement", "car taken out", "test drive log", "who has the car"], roles: ["staff"] },
  { path: "/dashboard/staff/reports", label: "Reports", description: "Financial reports, revenue, profit", keywords: ["report", "revenue", "profit", "financial report", "how much did we make"], roles: ["staff"] },
  { path: "/dashboard/staff/cctv", label: "CCTV", description: "View the showroom's security camera feeds", keywords: ["cctv", "camera", "security camera", "watch showroom"], roles: ["staff"] },
  { path: "/dashboard/staff/messages", label: "Messages", description: "Chat with buyers, partners, and your dealer", keywords: ["message", "chat", "talk to buyer", "contact", "inbox"], roles: ["staff"] },

  { path: "/dashboard/staff/staff", label: "Staff Management", description: "See or manage other staff accounts (needs view_staff or create_staff permission)", keywords: ["staff", "employee", "manage staff", "other staff", "team", "workers", "add staff", "add worker", "new worker", "add a new staff", "staff accounts"], roles: ["staff"] },
  { path: "/dashboard/staff/id-cards", label: "ID Cards", description: "Generate and download ID cards (needs generate_id_cards permission)", keywords: ["id card", "id cards", "print id card", "generate id card", "identity card", "employee card"], roles: ["staff"] },

  { path: "/dashboard/staff/settings#password", label: "Change Password", description: "Update your account password", keywords: ["change password", "change my password", "reset password", "new password", "update password", "forgot password"], roles: ["staff"] },
  { path: "/dashboard/staff/settings#profile", label: "Profile Picture & Signature", description: "Update your profile picture or digital signature", keywords: ["profile picture", "change photo", "signature", "my photo"], roles: ["staff"] },
  { path: "/dashboard/staff/settings", label: "Account Settings", description: "Your account and profile settings", keywords: ["settings", "account", "update my details"], roles: ["staff"] },

  // ── Partner / consignor (thoroughly audited: every page) ────────
  { path: "/dashboard/partner", label: "Partner Dashboard", description: "Your partner dashboard overview", keywords: ["dashboard", "overview", "home page", "main page"], roles: ["partner"] },

  { path: "/dashboard/partner/cars", label: "My Assigned Vehicles", description: "Vehicles assigned to you by dealers, their status, price, and profit", keywords: ["my cars", "my vehicles", "assigned cars", "assigned vehicles", "vehicles i sell", "vehicles assigned to me", "view details"], roles: ["partner"] },

  { path: "/dashboard/partner/dealers", label: "My Dealers", description: "Dealers you're currently linked and working with", keywords: ["my dealers", "linked dealers", "who i work with", "dealer connections"], roles: ["partner"] },

  { path: "/dashboard/partner/find-dealer", label: "Find a Dealer", description: "Search for a dealer and send a request to link up with them", keywords: ["find dealer", "new dealer", "link with dealer", "partner with dealer", "send request", "join a dealer", "search for dealer", "connect with dealer"], roles: ["partner"] },

  { path: "/dashboard/partner/earnings", label: "My Earnings", description: "Commission, revenue, profit, and recent sales from your assigned vehicles", keywords: ["earnings", "commission", "how much did i earn", "money", "income", "my revenue", "my profit", "how much have i made", "recent sales"], roles: ["partner"] },

  { path: "/dashboard/partner/movements", label: "Vehicle Movements", description: "Track your assigned vehicles taken out for test drives or delivery", keywords: ["movement", "car taken out", "test drive log", "track vehicle"], roles: ["partner"] },

  { path: "/dashboard/partner/messages", label: "Messages", description: "Chat with your dealers", keywords: ["message", "chat", "talk to dealer", "contact dealer", "inbox"], roles: ["partner"] },

  { path: "/dashboard/partner/settings#password", label: "Change Password", description: "Update your account password", keywords: ["change password", "change my password", "reset password", "new password", "update password", "forgot password"], roles: ["partner"] },
  { path: "/dashboard/partner/settings#personal", label: "Personal Information", description: "Update your name, phone, address, city, state", keywords: ["personal info", "my name", "my phone number", "my address", "update my details", "change my phone"], roles: ["partner"] },
  { path: "/dashboard/partner/settings#photo", label: "Profile Photo", description: "Update your profile picture", keywords: ["profile photo", "profile picture", "change my photo", "my picture"], roles: ["partner"] },
  { path: "/dashboard/partner/settings", label: "Partner Account Settings", description: "Your account info, role, and settings", keywords: ["settings", "my account", "account settings", "user id"], roles: ["partner"] },

  // ── Super admin (thoroughly audited: every page) ────────────────
  { path: "/dashboard/super-admin", label: "Admin Dashboard", description: "Platform overview", keywords: ["dashboard", "overview", "home page", "main page"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/dealers", label: "Dealers", description: "Manage all dealers on the platform", keywords: ["dealers", "manage dealers", "all dealers"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/create-dealer", label: "Create Dealer Account", description: "Set up a new dealer's company details and account", keywords: ["create dealer", "new dealer", "add dealer", "onboard dealer", "register a dealer", "company details"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/users", label: "Users", description: "Manage all platform users", keywords: ["users", "manage users", "all users"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/approvals", label: "Approvals", description: "Pending dealer registration approvals — approve or cancel", keywords: ["approvals", "pending approval", "approve dealer", "pending registration", "cancel registration", "wants to be approved", "needs approval", "new dealer waiting"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/cars", label: "All Vehicles", description: "Every vehicle listed on the platform", keywords: ["all cars", "all vehicles", "every car", "every vehicle"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/analytics", label: "Analytics", description: "Platform-wide performance — revenue, new dealer and user registrations", keywords: ["analytics", "stats", "numbers", "platform performance", "revenue summary", "new registrations", "how is the platform doing"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/broadcast", label: "Broadcast", description: "Compose and send an announcement to selected users or everyone", keywords: ["broadcast", "announcement", "send message to everyone", "notify all users", "compose announcement", "message everyone"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/activity", label: "Activity Log", description: "Recent platform-wide activity", keywords: ["activity", "activity log", "recent actions", "audit", "what happened recently", "what happened today", "today"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/messages", label: "Messages", description: "Chat with dealers and users", keywords: ["message", "chat", "talk to dealer", "contact", "inbox"], roles: ["super-admin"] },

  { path: "/dashboard/super-admin/settings#password", label: "Change Password", description: "Update your admin account password", keywords: ["change password", "change my password", "reset password", "new password", "update password", "forgot password"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/settings#app", label: "Application Info", description: "App name, office address, social links shown platform-wide", keywords: ["app name", "office address", "application info", "facebook url", "instagram url", "platform settings"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/settings", label: "Admin Settings", description: "Your admin account and platform application settings", keywords: ["settings", "admin settings", "my account", "account settings"], roles: ["super-admin"] },

];

export interface NavContext {
  role: Role;
  dealerId?: string;   // needed to resolve the dealer's own public profile link
  userId?: string;     // needed to resolve a buyer's own public profile link
}

function resolvePath(path: string, ctx: NavContext): string | null {
  if (path === "public-user-profile") {
    return ctx.userId ? `/users/${ctx.userId}` : null;
  }
  if (path === "public-profile") {
    // Needs the dealer's own ID, which isn't known statically - if
    // it's not available in this context, the caller should drop
    // this entry rather than link somewhere broken.
    return ctx.dealerId ? `/dealers/${ctx.dealerId}` : null;
  }
  return path.replace("{role}", ctx.role);
}

// Very small stemmer, just enough for this app's own vocabulary -
// not a general NLP tool, just strips the common endings that show up
// in how people naturally phrase these requests ("cars" vs "car",
// "vehicles" vs "vehicle", "selling" vs "sell").
function stem(word: string): string {
  return word
    .replace(/(vehicles|cars|motors)$/, (m) => m.slice(0, -1))
    .replace(/(ing|ed)$/, "")
    .replace(/s$/, "");
}

// Cheap edit-distance check (bounded, not full Levenshtein) - catches
// the kind of near-miss a voice engine produces on a noisy line
// ("sale" heard as "sail", "expense" heard as "expence") without the
// cost of comparing every word pair exhaustively.
function isCloseMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  if (a.length < 4 || b.length < 4) return false; // too short to fuzzy-match reliably
  let i = 0, j = 0, mismatches = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    mismatches++;
    if (mismatches > 2) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  mismatches += (a.length - i) + (b.length - j);
  return mismatches <= 2;
}

/**
 * Scores every registry entry (filtered to the person's role) against
 * a free-text query, returning the best matches. Deliberately simple
 * and dependency-free as the fast, always-available path — this is
 * the fallback used if the AI-backed match (see matchNavigationAI)
 * isn't available, and runs instantly client-side either way.
 */
export function matchNavigation(query: string, ctx: NavContext, limit = 5): (NavEntry & { resolvedPath: string; score: number })[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const words = q.split(/\s+/).filter((w) => w.length > 1);
  const stemmedWords = words.map(stem);
  const relevant = ENTRIES.filter((e) => e.roles.includes(ctx.role));

  const scored = relevant.map((entry) => {
    let score = 0;
    const haystack = [entry.label, entry.description, ...entry.keywords].join(" ").toLowerCase();
    const haystackWords = haystack.split(/\s+/).map(stem);

    // Direct substring match against any keyword is the strongest signal
    for (const kw of entry.keywords) {
      if (q.includes(kw) || kw.includes(q)) score += 10;
    }
    // Stemmed word overlap - "cars"/"car", "selling"/"sell" etc. match
    for (const w of stemmedWords) {
      if (haystackWords.includes(w)) score += 2;
    }
    // Fuzzy fallback for words that didn't match exactly or by stem -
    // catches voice-transcription near-misses
    for (const w of stemmedWords) {
      if (haystackWords.includes(w)) continue;
      if (haystackWords.some((hw) => isCloseMatch(w, hw))) score += 1;
    }
    // Small bonus if the query appears in the label itself
    if (entry.label.toLowerCase().includes(q)) score += 5;

    return { entry, score };
  });

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 2) // resolve a few extra in case some drop out (e.g. missing dealerId)
    .map(({ entry, score }) => {
      const resolvedPath = resolvePath(entry.path, ctx);
      return resolvedPath ? { ...entry, resolvedPath, score } : null;
    })
    .filter((e): e is NavEntry & { resolvedPath: string; score: number } => e !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * The distinct, meaningful words used across every entry's keywords
 * and label, for the given role (or every role if none given) -
 * extracted directly from the registry itself rather than maintained
 * as a separate list, so it can never drift out of sync as entries
 * are added or changed. This is what voice correction checks a
 * mis-heard word against.
 */
export function getNavigationVocabulary(role?: Role): string[] {
  const relevant = role ? ENTRIES.filter((e) => e.roles.includes(role)) : ENTRIES;
  const words = new Set<string>();
  for (const entry of relevant) {
    for (const source of [entry.label, ...entry.keywords]) {
      for (const w of source.split(/\s+/)) {
        const clean = w.replace(/[^a-zA-Z]/g, "");
        // Skip tiny filler words ("a", "to", "i") - too short and too
        // common to be meaningful correction targets, and short words
        // are exactly where fuzzy matching produces false positives.
        if (clean.length >= 4) words.add(clean);
      }
    }
  }
  return Array.from(words);
}

/**
 * Every entry available to a role, with paths resolved (dropping any
 * that can't resolve, e.g. the dealer profile link without a
 * dealerId) - this is the candidate list sent to the AI-backed
 * matcher, which needs to see everything available, not just what
 * the local scorer already ranked highest for a given query.
 */
export function getResolvedEntriesForRole(ctx: NavContext): (NavEntry & { resolvedPath: string })[] {
  return ENTRIES
    .filter((e) => e.roles.includes(ctx.role))
    .map((entry) => {
      const resolvedPath = resolvePath(entry.path, ctx);
      return resolvedPath ? { ...entry, resolvedPath } : null;
    })
    .filter((e): e is NavEntry & { resolvedPath: string } => e !== null);
}
