"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const ROLE_GUIDES: Record<string, { title: string; steps: { label: string; desc: string }[] }> = {
  user: {
    title: "As a Buyer, here's how to get around",
    steps: [
      { label: "Browse the feed", desc: "See every vehicle for sale — cars, motorcycles, tricycles (keke), trucks, and more. Filter or sort however you like." },
      { label: "Save what you like", desc: "Tap the save icon on any listing to keep it in your favorites and come back to it later." },
      { label: "Talk to a dealer", desc: "Message a dealer directly from any listing to ask questions or negotiate." },
      { label: "Make a request", desc: "Can't find exactly what you want? Send a request describing it, and dealers can respond with matching vehicles." },
      { label: "Book a visit or test drive", desc: "Schedule an appointment with a dealer straight from their listing." },
      { label: "Want to sell for a dealer?", desc: "You can also become a partner/consignor — link up with a dealer and earn from vehicles you help sell." },
    ],
  },
  dealer: {
    title: "As a Dealer, here's how to get around",
    steps: [
      { label: "Add your vehicles", desc: "List cars, motorcycles, and other vehicles with photos, price, and details — buyers find them on the public feed." },
      { label: "Handle requests & appointments", desc: "Buyers send you requests and book test drives — respond to them from your dashboard." },
      { label: "Record sales", desc: "When a vehicle sells, record it to keep your sales history, receipts, and reports accurate." },
      { label: "Track expenses", desc: "Log repair and maintenance costs against each vehicle to know your real profit." },
      { label: "Add staff", desc: "Give your team their own accounts with specific permissions — they can help manage inventory, sales, and more." },
      { label: "Work with partners", desc: "Approve consignors/partners and assign them vehicles to sell on your behalf." },
    ],
  },
  staff: {
    title: "As Staff, here's how to get around",
    steps: [
      { label: "Check your permissions", desc: "Your dealer gives you specific permissions — you'll only see the sections you're allowed to use." },
      { label: "Manage inventory", desc: "Add or update vehicles in the dealership's inventory, if you have that permission." },
      { label: "Handle sales & requests", desc: "Record sales and respond to customer requests on behalf of your dealership." },
      { label: "Track expenses", desc: "Log costs against vehicles so the dealership's records stay accurate." },
    ],
  },
  partner: {
    title: "As a Partner/Consignor, here's how to get around",
    steps: [
      { label: "Find a dealer", desc: "Search for a dealer and send a request to link up with them." },
      { label: "Get vehicles assigned", desc: "Once approved, a dealer can assign vehicles to you to sell." },
      { label: "Sell and earn", desc: "Help sell your assigned vehicles and track your commission in Earnings." },
      { label: "Work with multiple dealers", desc: "You can link up with more than one dealer at a time." },
    ],
  },
  "super-admin": {
    title: "As an Admin, here's how to get around",
    steps: [
      { label: "Manage dealers", desc: "Approve, create, or manage dealer accounts on the platform." },
      { label: "Oversee everything", desc: "See every vehicle, user, and transaction across the whole platform." },
      { label: "Broadcast announcements", desc: "Send a message to every user on the platform at once." },
    ],
  },
};

export default function HowItWorksPage() {
  const { user, isAuthenticated } = useAuthStore();
  const role = user?.role === "DEALER_ADMIN" ? "dealer"
    : user?.role === "DEALER_STAFF" ? "staff"
    : user?.role === "PARTNER_USER" ? "partner"
    : user?.role === "SUPER_ADMIN" ? "super-admin"
    : "user";
  const guide = isAuthenticated ? ROLE_GUIDES[role] : null;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Is CARSTRIMS free to use?", a: "Yes — browsing, saving vehicles, messaging dealers, and making requests are all free for buyers." },
    { q: "How do I know a dealer is real?", a: "Dealers go through an approval process before they can list vehicles publicly." },
    { q: "Can I sell my own personal car here?", a: "CARSTRIMS is built around dealers and their partners/consignors listing vehicles. If you want to sell a car, the best way in is becoming a partner with a dealer." },
    { q: "What's the difference between a Partner and Staff?", a: "Staff work directly for one dealership with an account that dealer controls. A Partner (consignor) is more independent — you can link with one or several dealers and earn commission on vehicles they assign to you." },
    { q: "I typed what I wanted in search but nothing happened — what do I do?", a: "Try rephrasing it more simply, or just say the page name directly, like \"settings\" or \"my cars\". You can also just browse the menu instead." },
  ];

  return (
    <div style={{minHeight: "100dvh", background: "#FAFAFA"}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.25rem",background:"#fff",borderBottom:"1.5px solid #E5E5E5",position:"sticky",top:0,zIndex:20}}>
        <Link href="/feed" style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.15em",color:"#F47B20",textDecoration:"none"}}>CARSTRIMS</Link>
        <Link href="/feed" style={{fontSize:"0.85rem",color:"#525252",textDecoration:"none",fontWeight:600}}>Back to Feed</Link>
      </header>

      <div style={{maxWidth:"720px",margin:"0 auto",padding:"2rem 1.25rem 4rem"}}>
        {/* Hero */}
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"0.5rem"}}>👋</div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"1.8rem",letterSpacing:"0.03em",color:"#1A1A1A",margin:"0 0 0.75rem"}}>New here? Let's get you started.</h1>
          <p style={{fontSize:"0.95rem",color:"#737373",lineHeight:1.6,maxWidth:"480px",margin:"0 auto"}}>
            CARSTRIMS is Nigeria's vehicle marketplace — buy, sell, or partner with dealers on cars, motorcycles, tricycles (keke), trucks, and more.
          </p>
        </div>

        {/* What is this app */}
        <section style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.5rem",marginBottom:"1.5rem"}}>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.15rem",letterSpacing:"0.03em",color:"#1A1A1A",margin:"0 0 0.75rem"}}>What can I actually do here?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"1rem"}}>
            {[
              {icon:"🚗",title:"Browse & Buy",desc:"See every vehicle for sale, from any dealer, in one place."},
              {icon:"💬",title:"Talk to Dealers",desc:"Message directly, ask questions, negotiate."},
              {icon:"📋",title:"Make Requests",desc:"Can't find it? Ask, and dealers respond with matches."},
              {icon:"🤝",title:"Partner & Earn",desc:"Sell vehicles for a dealer and earn commission."},
              {icon:"🏪",title:"Run a Dealership",desc:"List inventory, manage sales, staff, and reports."},
              {icon:"📅",title:"Book Test Drives",desc:"Schedule a showroom visit straight from a listing."},
            ].map((f) => (
              <div key={f.title} style={{padding:"0.875rem",background:"#FAFAFA",borderRadius:"10px"}}>
                <div style={{fontSize:"1.4rem",marginBottom:"0.4rem"}}>{f.icon}</div>
                <div style={{fontWeight:700,fontSize:"0.88rem",color:"#1A1A1A",marginBottom:"0.2rem"}}>{f.title}</div>
                <div style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.4}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Search hint */}
        <section style={{background:"#FFF7ED",border:"1.5px solid #FDBA74",borderRadius:"14px",padding:"1.5rem",marginBottom:"1.5rem",textAlign:"center"}}>
          <div style={{fontSize:"1.6rem",marginBottom:"0.5rem"}}>🔍</div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",letterSpacing:"0.03em",color:"#1A1A1A",margin:"0 0 0.5rem"}}>Not sure where something is?</h2>
          <p style={{fontSize:"0.88rem",color:"#737373",lineHeight:1.6,margin:"0 0 0.5rem"}}>
            Tap the search icon anywhere in the app and just type or say what you want — like <em>"I want to add a car"</em> or <em>"change my password"</em> — and it takes you straight there. No need to know the menu.
          </p>
        </section>

        {/* Role-specific guide, only if logged in */}
        {guide && (
          <section style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.5rem",marginBottom:"1.5rem"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.15rem",letterSpacing:"0.03em",color:"#1A1A1A",margin:"0 0 1rem"}}>{guide.title}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
              {guide.steps.map((s, i) => (
                <div key={i} style={{display:"flex",gap:"0.75rem"}}>
                  <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"#F47B20",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:700,flexShrink:0}}>{i+1}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.88rem",color:"#1A1A1A"}}>{s.label}</div>
                    <div style={{fontSize:"0.8rem",color:"#737373",lineHeight:1.5,marginTop:"0.15rem"}}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.5rem"}}>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.15rem",letterSpacing:"0.03em",color:"#1A1A1A",margin:"0 0 1rem"}}>Common Questions</h2>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {faqs.map((f, i) => (
              <div key={i} style={{border:"1px solid #F0F0F0",borderRadius:"8px",overflow:"hidden"}}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{width:"100%",textAlign:"left",padding:"0.75rem 1rem",background:openFaq===i?"#FAFAFA":"#fff",border:"none",cursor:"pointer",fontSize:"0.85rem",fontWeight:600,color:"#1A1A1A",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  {f.q}
                  <span style={{color:"#F47B20",fontSize:"1rem"}}>{openFaq===i?"−":"+"}</span>
                </button>
                {openFaq === i && (
                  <div style={{padding:"0 1rem 0.875rem",fontSize:"0.82rem",color:"#737373",lineHeight:1.6}}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div style={{textAlign:"center",marginTop:"2rem"}}>
          <Link href="/feed" style={{display:"inline-block",background:"#F47B20",color:"#fff",textDecoration:"none",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",padding:"0.875rem 2rem",borderRadius:"10px",fontWeight:700}}>
            Start Browsing →
          </Link>
        </div>
      </div>
    </div>
  );
}
