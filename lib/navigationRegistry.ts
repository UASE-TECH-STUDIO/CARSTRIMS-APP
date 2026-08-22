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
  { path: "/feed", label: "Browse Vehicles", description: "See all cars, motorcycles, and other vehicles for sale", keywords: ["browse", "see cars", "look at cars", "feed", "home", "vehicles", "shop"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/messages", label: "Messages", description: "Talk to a dealer, buyer, or send a message", keywords: ["message", "chat", "talk to dealer", "talk to buyer", "contact", "text someone", "reply", "inbox"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/notifications", label: "Notifications", description: "See your alerts and updates", keywords: ["notification", "alert", "updates", "what happened"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/settings", label: "Settings", description: "Change your password, profile picture, or account details", keywords: ["settings", "change password", "change my password", "reset password", "profile picture", "edit profile", "account", "update my details", "change email", "change phone"], roles: ["user","dealer","staff","partner","super-admin"] },
  { path: "/dashboard/{role}/appointments", label: "Appointments", description: "Book or manage a showroom visit or test drive", keywords: ["appointment", "test drive", "visit", "showroom", "book a visit", "schedule"], roles: ["user","dealer","staff"] },

  // ── Buyer / user ────────────────────────────────────────────────
  { path: "/dashboard/user", label: "My Dashboard", description: "Your buyer dashboard overview", keywords: ["dashboard", "my account", "overview", "home page"], roles: ["user"] },
  { path: "/dashboard/user/favorites", label: "Saved Vehicles", description: "Cars and vehicles you've saved to look at later", keywords: ["saved", "favorites", "favourite", "wishlist", "bookmarked", "cars i liked"], roles: ["user"] },
  { path: "/dashboard/user/requests", label: "My Requests", description: "Vehicle requests you've sent to dealers, make a request", keywords: ["request", "make a request", "send a request", "ask for a car", "custom request", "find me a car"], roles: ["user"] },
  { path: "/dashboard/user/profile", label: "My Profile", description: "View and edit your public profile", keywords: ["profile", "my info", "about me"], roles: ["user"] },
  { path: "/dashboard/partner/find-dealer", label: "Become a Partner", description: "Apply to become a consignor/partner and work with a dealer to sell vehicles", keywords: ["become a partner", "new partner", "consignor", "partner with a dealer", "i am a new partner", "what should i do as partner", "sell for a dealer", "work with dealer", "assign car to me", "link with dealer"], roles: ["user"] },

  // ── Dealer ──────────────────────────────────────────────────────
  { path: "/dashboard/dealer", label: "Dealer Dashboard", description: "Your dealer dashboard overview", keywords: ["dashboard", "overview", "home page"], roles: ["dealer"] },
  { path: "/dashboard/dealer/cars", label: "Add a Vehicle", description: "Add a new car, motorcycle, tricycle (keke), or other vehicle to your inventory", keywords: ["add car", "add vehicle", "add a car", "i want to add a car", "list a car", "new car", "upload car", "add keke", "add okada", "add motor", "add motorcycle", "add tricycle", "inventory", "my cars", "my vehicles", "car list"], roles: ["dealer"] },
  { path: "/dashboard/dealer/sales", label: "Sales", description: "Record a sale, view sales history, receipts", keywords: ["sales", "sold", "record a sale", "make a sale", "receipt", "sell a car", "who bought"], roles: ["dealer"] },
  { path: "/dashboard/dealer/expenses", label: "Expenses", description: "Track expenses on your vehicles", keywords: ["expenses", "cost", "spending", "money spent", "repair cost"], roles: ["dealer"] },
  { path: "/dashboard/dealer/staff", label: "Staff", description: "Add or manage staff accounts, staff ID cards", keywords: ["staff", "employee", "add staff", "manage staff", "workers", "team", "staff id card"], roles: ["dealer"] },
  { path: "/dashboard/dealer/partners", label: "Partners", description: "Manage consignors/partners, assign vehicles to a partner, approve partner requests", keywords: ["partner", "consignor", "assign car", "assign vehicle", "approve partner", "partner request", "link partner"], roles: ["dealer"] },
  { path: "/dashboard/dealer/requests", label: "Customer Requests", description: "Vehicle requests from buyers", keywords: ["request", "customer request", "buyer request", "someone wants a car"], roles: ["dealer"] },
  { path: "/dashboard/dealer/movements", label: "Vehicle Movements", description: "Track vehicles taken out for test drives or inspection", keywords: ["movement", "car taken out", "test drive log", "who has the car", "track vehicle"], roles: ["dealer"] },
  { path: "/dashboard/dealer/reports", label: "Financial Reports", description: "Full financial report, revenue, profit", keywords: ["report", "financial report", "revenue", "profit", "how much did i make", "business summary"], roles: ["dealer"] },
  { path: "/dashboard/dealer/cctv", label: "CCTV", description: "View your showroom camera feeds", keywords: ["cctv", "camera", "security camera", "watch showroom"], roles: ["dealer"] },
  { path: "/dashboard/dealer/setup", label: "Business Setup", description: "Set up your dealership profile, logo, address", keywords: ["setup", "business setup", "company info", "dealership profile", "logo", "address"], roles: ["dealer"] },

  // ── Staff ───────────────────────────────────────────────────────
  { path: "/dashboard/staff", label: "Staff Dashboard", description: "Your staff dashboard overview", keywords: ["dashboard", "overview", "home page"], roles: ["staff"] },
  { path: "/dashboard/staff/inventory", label: "Vehicle Inventory", description: "Add or manage the dealership's vehicles", keywords: ["add car", "add vehicle", "inventory", "list a car", "cars"], roles: ["staff"] },
  { path: "/dashboard/staff/sales", label: "Sales", description: "Record a sale, view sales history", keywords: ["sales", "sold", "record a sale", "receipt"], roles: ["staff"] },
  { path: "/dashboard/staff/expenses", label: "Expenses", description: "Track expenses on vehicles", keywords: ["expenses", "cost", "spending"], roles: ["staff"] },
  { path: "/dashboard/staff/partners", label: "Partners", description: "Manage consignors/partners, assign vehicles", keywords: ["partner", "consignor", "assign car"], roles: ["staff"] },
  { path: "/dashboard/staff/requests", label: "Customer Requests", description: "Vehicle requests from buyers", keywords: ["request", "customer request", "buyer request"], roles: ["staff"] },
  { path: "/dashboard/staff/movements", label: "Vehicle Movements", description: "Track vehicles taken out", keywords: ["movement", "car taken out", "test drive log"], roles: ["staff"] },
  { path: "/dashboard/staff/reports", label: "Reports", description: "Financial reports", keywords: ["report", "revenue", "profit"], roles: ["staff"] },
  { path: "/dashboard/staff/cctv", label: "CCTV", description: "View showroom camera feeds", keywords: ["cctv", "camera", "security"], roles: ["staff"] },

  // ── Partner / consignor ────────────────────────────────────────
  { path: "/dashboard/partner", label: "Partner Dashboard", description: "Your partner dashboard overview", keywords: ["dashboard", "overview", "home page"], roles: ["partner"] },
  { path: "/dashboard/partner/cars", label: "My Assigned Vehicles", description: "Vehicles assigned to you by dealers", keywords: ["my cars", "assigned cars", "assigned vehicles", "vehicles i sell"], roles: ["partner"] },
  { path: "/dashboard/partner/dealers", label: "My Dealers", description: "Dealers you're linked with", keywords: ["my dealers", "linked dealers", "who i work with"], roles: ["partner"] },
  { path: "/dashboard/partner/find-dealer", label: "Find a Dealer", description: "Find and request to partner with a new dealer", keywords: ["find dealer", "new dealer", "link with dealer", "partner with dealer", "send request", "join a dealer"], roles: ["partner"] },
  { path: "/dashboard/partner/earnings", label: "My Earnings", description: "Commission and earnings from sales", keywords: ["earnings", "commission", "how much did i earn", "money", "income"], roles: ["partner"] },
  { path: "/dashboard/partner/movements", label: "Vehicle Movements", description: "Track vehicle movements", keywords: ["movement", "car taken out"], roles: ["partner"] },

  // ── Super admin ─────────────────────────────────────────────────
  { path: "/dashboard/super-admin", label: "Admin Dashboard", description: "Platform overview", keywords: ["dashboard", "overview", "home page"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/dealers", label: "Dealers", description: "Manage all dealers on the platform", keywords: ["dealers", "manage dealers", "all dealers"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/create-dealer", label: "Create Dealer Account", description: "Set up a new dealer account", keywords: ["create dealer", "new dealer", "add dealer", "onboard dealer"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/users", label: "Users", description: "Manage all platform users", keywords: ["users", "manage users", "all users"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/approvals", label: "Approvals", description: "Pending dealer or account approvals", keywords: ["approvals", "pending approval", "approve dealer"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/cars", label: "All Vehicles", description: "Every vehicle listed on the platform", keywords: ["all cars", "all vehicles", "every car"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/analytics", label: "Analytics", description: "Platform-wide analytics and stats", keywords: ["analytics", "stats", "numbers", "platform performance"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/broadcast", label: "Broadcast", description: "Send an announcement to all users", keywords: ["broadcast", "announcement", "send message to everyone", "notify all users"], roles: ["super-admin"] },
  { path: "/dashboard/super-admin/activity", label: "Activity Log", description: "Recent platform activity", keywords: ["activity", "activity log", "recent actions", "audit"], roles: ["super-admin"] },
];

function resolvePath(path: string, role: Role): string {
  return path.replace("{role}", role);
}

/**
 * Scores every registry entry (filtered to the person's role) against
 * a free-text query, returning the best matches. Deliberately simple
 * and dependency-free (no AI call needed) — this only has to match
 * against a few dozen known entries, not open-ended car listings, so
 * keyword overlap scoring is fast, reliable, and works offline.
 */
export function matchNavigation(query: string, role: Role, limit = 5): (NavEntry & { resolvedPath: string; score: number })[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const words = q.split(/\s+/).filter((w) => w.length > 1);
  const relevant = ENTRIES.filter((e) => e.roles.includes(role));

  const scored = relevant.map((entry) => {
    let score = 0;
    const haystack = [entry.label, entry.description, ...entry.keywords].join(" ").toLowerCase();

    // Direct substring match against any keyword is the strongest signal
    for (const kw of entry.keywords) {
      if (q.includes(kw) || kw.includes(q)) score += 10;
    }
    // Otherwise, score by how many of the query's words appear anywhere
    // in this entry's label/description/keywords
    for (const w of words) {
      if (haystack.includes(w)) score += 2;
    }
    // Small bonus if the query appears in the label itself
    if (entry.label.toLowerCase().includes(q)) score += 5;

    return { ...entry, resolvedPath: resolvePath(entry.path, role), score };
  });

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
