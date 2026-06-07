export default function PrivacyPage() {
  return (
    <div style={{maxWidth:"720px",margin:"0 auto",padding:"3rem 1.5rem",
      fontFamily:"system-ui",lineHeight:1.7,color:"#1A1A1A"}}>
      <h1 style={{fontFamily:"Georgia,serif",color:"#F47B20",
        letterSpacing:"0.1em",marginBottom:"0.5rem"}}>
        CARSTRIMS PRIVACY POLICY
      </h1>
      <p style={{color:"#737373",marginBottom:"2rem",fontSize:"14px"}}>
        Last updated: June 2026 · Built by UASE Tech Studio
      </p>

      {[
        ["Information We Collect",
          "We collect your name, email address, phone number, business information (for dealers), and vehicle listings you create. We also collect usage data to improve the platform."],
        ["How We Use Your Information",
          "Your information is used to operate your account, manage dealership operations, facilitate transactions between buyers and dealers, and send relevant notifications about platform activity."],
        ["Data Storage & Security",
          "All data is stored on secure servers. We use industry-standard encryption for data transmission. We do not store payment card information."],
        ["Sharing Your Information",
          "We do not sell your personal data to third parties. Dealer business information (company name, phone, location) is visible to the public as part of the marketplace. Personal contact details are only shared when you initiate a conversation."],
        ["Push Notifications",
          "We send push notifications for messages, approvals, and platform activity. You can disable these in your device settings or in the app notification preferences."],
        ["Your Rights",
          "You can request deletion of your account and data by contacting support@carstrims.com. You can update your profile information at any time in the dashboard."],
        ["Contact Us",
          "For privacy concerns: support@carstrims.com | UASE Tech Studio | www.carstrims.com"],
      ].map(([title, text]) => (
        <div key={title as string} style={{marginBottom:"1.5rem"}}>
          <h2 style={{fontSize:"1rem",fontWeight:700,color:"#1A1A1A",
            marginBottom:"0.4rem"}}>{title}</h2>
          <p style={{fontSize:"14px",color:"#525252",margin:0}}>{text}</p>
        </div>
      ))}
    </div>
  );
}
