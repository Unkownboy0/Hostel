import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity, AlertCircle, AlertTriangle, ArrowDownLeft, ArrowLeft, ArrowRight,
  BadgeCheck, Bell, Building2, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, Clock3, DoorOpen, Download, Fingerprint, FileBarChart2, FileClock,
  FileText, Filter, GraduationCap, History, Home, LayoutDashboard, ListChecks,
  LockKeyhole, LogOut, MapPin, Menu, Moon, MoreHorizontal, Plus, QrCode, Radio,
  ScanLine, Search, Settings, Shield, ShieldAlert, ShieldCheck, Sun, User,
  UserCheck, Users, X, Zap,
} from "lucide-react";
import "./hostelflow.css";

type Role = "Student" | "Parent" | "Security" | "Mentor" | "HOD" | "Warden" | "Admin";
type Screen = string;
type MoveType = "Short Outing" | "Local Permission" | "Outstation Leave" | "Emergency";
type MoveStatus = "none" | "pending" | "approved" | "outside" | "completed" | "rejected";
type Movement = {
  id: string; type: MoveType; purpose: string; destination: string; reason: string;
  exit: string; expected: string; status: MoveStatus; mentor: boolean; hod: boolean; warden: boolean;
  createdAt: string; note?: string;
};
type Notice = { title: string; body: string; time: string; kind: "movement" | "security" | "system" | "critical" };
type GateEvent = { time: string; student: string; action: "EXIT" | "RETURN" | "DENIED"; status: string; gate: string };
const ROLES: Role[] = ["Student", "Parent", "Security", "Mentor", "HOD", "Warden", "Admin"];
const MAIN_STUDENT = { name: "Arun Kumar", initials: "AK", dept: "CSE", year: "III Year", hostel: "Hostel A", room: "204" };
const PEOPLE = [
  { name: "Arun Kumar", initials: "AK", dept: "CSE", year: "III Year", hostel: "Hostel A", room: "204", status: "Inside" },
  { name: "Priya S", initials: "PS", dept: "ECE", year: "II Year", hostel: "Hostel B", room: "312", status: "Inside" },
  { name: "Rahul K", initials: "RK", dept: "Mechanical", year: "III Year", hostel: "Hostel A", room: "108", status: "Overdue" },
];
const NAV: Record<Role, { label: string; icon: typeof Home; screen: Screen }[]> = {
  Student: [
    { label: "Home", icon: Home, screen: "home" }, { label: "Movement", icon: FileText, screen: "movement" },
    { label: "Approval status", icon: ListChecks, screen: "status" }, { label: "Exit pass", icon: QrCode, screen: "qr" },
    { label: "History", icon: History, screen: "history" }, { label: "Notifications", icon: Bell, screen: "notifications" },
    { label: "My profile", icon: User, screen: "profile" },
  ],
  Parent: [
    { label: "Child overview", icon: Home, screen: "home" }, { label: "Movement details", icon: FileText, screen: "details" },
    { label: "History", icon: History, screen: "history" }, { label: "Notifications", icon: Bell, screen: "notifications" },
    { label: "Profile", icon: User, screen: "profile" },
  ],
  Security: [
    { label: "Gate overview", icon: Home, screen: "home" }, { label: "Scan movement", icon: ScanLine, screen: "scan" },
    { label: "Gate activity", icon: Activity, screen: "activity" }, { label: "Profile", icon: User, screen: "profile" },
  ],
  Mentor: [
    { label: "Dashboard", icon: LayoutDashboard, screen: "dashboard" }, { label: "My mentees", icon: Users, screen: "mentees" },
    { label: "Approval queue", icon: ListChecks, screen: "queue" }, { label: "Notifications", icon: Bell, screen: "notifications" },
  ],
  HOD: [
    { label: "Department", icon: LayoutDashboard, screen: "dashboard" }, { label: "Movements", icon: Activity, screen: "movements" },
    { label: "Approvals", icon: ListChecks, screen: "queue" }, { label: "Reports", icon: FileBarChart2, screen: "reports" },
    { label: "Notifications", icon: Bell, screen: "notifications" },
  ],
  Warden: [
    { label: "Dashboard", icon: LayoutDashboard, screen: "dashboard" }, { label: "Live operations", icon: Radio, screen: "live" },
    { label: "Approvals", icon: ListChecks, screen: "approvals" }, { label: "Outside now", icon: ArrowRight, screen: "outside" },
    { label: "Overdue", icon: AlertTriangle, screen: "overdue" }, { label: "Hostels", icon: Building2, screen: "hostels" },
    { label: "Gates", icon: DoorOpen, screen: "gates" }, { label: "Devices", icon: Fingerprint, screen: "devices" },
    { label: "Reports", icon: FileBarChart2, screen: "reports" }, { label: "Notifications", icon: Bell, screen: "notifications" },
  ],
  Admin: [
    { label: "Institution overview", icon: LayoutDashboard, screen: "dashboard" }, { label: "Live operations", icon: Radio, screen: "live" },
    { label: "Users & students", icon: Users, screen: "users" }, { label: "Hostels", icon: Building2, screen: "hostels" },
    { label: "Gates", icon: DoorOpen, screen: "gates" }, { label: "Devices", icon: Fingerprint, screen: "devices" },
    { label: "Movement policies", icon: ShieldCheck, screen: "policies" }, { label: "Approval workflow", icon: ListChecks, screen: "workflow" },
    { label: "Notification policies", icon: Bell, screen: "notificationPolicies" }, { label: "Reports", icon: FileBarChart2, screen: "reports" },
    { label: "Audit logs", icon: FileClock, screen: "audit" }, { label: "Notifications", icon: AlertCircle, screen: "notifications" },
    { label: "Settings", icon: Settings, screen: "settings" },
  ],
};
const moveTypes: { type: MoveType; desc: string; icon: typeof MapPin }[] = [
  { type: "Short Outing", desc: "Food, ATM, shopping, nearby work", icon: MapPin },
  { type: "Local Permission", desc: "Town, hospital, market, personal work", icon: Building2 },
  { type: "Outstation Leave", desc: "Home town, family function, vacation", icon: ArrowDownLeft },
  { type: "Emergency", desc: "Urgent medical or family situation", icon: Zap },
];

function initials(name: string) { return name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase(); }
function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`hf-status ${tone}`}>{children}</span>;
}
function Button({ children, onClick, variant = "outline", small = false, disabled = false, type = "button", style }: {
  children: ReactNode; onClick?: () => void; variant?: string; small?: boolean; disabled?: boolean; type?: "button" | "submit"; style?: CSSProperties;
}) {
  return <button type={type} disabled={disabled} className={`hf-btn ${variant} ${small ? "small" : ""}`} style={style} onClick={onClick}>{children}</button>;
}
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return <div className={`hf-avatar ${small ? "small" : ""}`}>{initials(name)}</div>;
}
function PageHead({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="hf-page-head"><div><div className="hf-eyebrow">{eyebrow || "HOSTELFLOW · OPERATIONS"}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="hf-page-actions">{actions}</div>}</div>;
}
function Stat({ label, value, note, icon: Icon, tone = "blue" }: { label: string; value: string | number; note?: string; icon: typeof Home; tone?: string }) {
  return <div className="hf-card hf-stat"><div className="hf-stat-top"><span>{label}</span><span className="hf-stat-icon" style={tone === "red" ? { color: "var(--red)" } : tone === "green" ? { color: "var(--green)" } : tone === "amber" ? { color: "#b77908" } : undefined}><Icon /></span></div><div className="hf-stat-value">{value}</div><div className="hf-stat-hint">{note}</div></div>;
}
function Empty({ title, body, icon: Icon = FileText, action }: { title: string; body: string; icon?: typeof Home; action?: ReactNode }) {
  return <div className="hf-empty"><div className="hf-empty-icon"><Icon /></div><h3>{title}</h3><p>{body}</p>{action}</div>;
}
function Brand() {
  return <div className="hf-brand"><div className="hf-brand-mark"><ShieldCheck /></div><div><div className="hf-brand-name">HostelFlow</div><div className="hf-brand-sub">Smart Hostel Movement &amp; Security</div></div></div>;
}
function makeQR(seed: string) {
  return Array.from({ length: 441 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const finder = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7 &&
      (x === ox || x === ox + 6 || y === oy || y === oy + 6 || (x >= ox + 2 && x <= ox + 4 && y >= oy + 2 && y <= oy + 4));
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true;
    const n = ((i * 31 + seed.length * 19 + seed.charCodeAt(i % seed.length)) * 17) % 101;
    return n > 48;
  });
}
function QRVisual({ seed }: { seed: string }) {
  const cells = useMemo(() => makeQR(seed), [seed]);
  return <div className="hf-qr-art" aria-label="Illustrative movement QR code"><div className="hf-qr-grid">{cells.map((on, i) => <i key={i} className={`hf-qr-cell ${on ? "on" : ""}`} />)}</div></div>;
}
function Modal({ title, subtitle, children, close }: { title: string; subtitle?: string; children: ReactNode; close: () => void }) {
  return <div className="hf-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><div className="hf-modal"><div className="hf-modal-head"><div><h2>{title}</h2>{subtitle && <div className="hf-muted hf-sm">{subtitle}</div>}</div><button className="hf-icon-btn" onClick={close} aria-label="Close"><X /></button></div>{children}</div></div>;
}

export function HostelFlowPrototype() {
  const [role, setRole] = useState<Role>("Student");
  const [screen, setScreen] = useState<Screen>("login");
  const [dark, setDark] = useState(false);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [moveType, setMoveType] = useState<MoveType>("Short Outing");
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({ purpose: "Food", destination: "Town", reason: "Dinner with friends", exit: "Today · 5:30 PM", expected: "Today · 8:00 PM" });
  const [notices, setNotices] = useState<Notice[]>([
    { title: "Movement reminder", body: "Your expected return time is approaching.", time: "Today · 4:32 PM", kind: "movement" },
    { title: "Campus notice", body: "Hostel A west entrance maintenance begins at 9:00 PM.", time: "Yesterday · 6:10 PM", kind: "system" },
  ]);
  const [gateEvents, setGateEvents] = useState<GateEvent[]>([
    { time: "5:31 PM", student: "Priya S", action: "DENIED", status: "QR expired", gate: "Main Gate" },
    { time: "5:15 PM", student: "Rahul K", action: "RETURN", status: "Verified", gate: "Hostel A Gate" },
  ]);
  const [verifyMode, setVerifyMode] = useState<"exit" | "return">("exit");
  const [failure, setFailure] = useState<string | null>(null);
  const [bioMatched, setBioMatched] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"edit" | "create" | "request" | "help" | null>(null);
  const [modalText, setModalText] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [reportRange, setReportRange] = useState("Last 7 days");
  const [reportDepartment, setReportDepartment] = useState("All departments");
  const [reportHostel, setReportHostel] = useState("All hostels");
  const [reportType, setReportType] = useState("All movement types");
  const [reportGate, setReportGate] = useState("All gates");
  const [userRoleFilter, setUserRoleFilter] = useState("All roles");
  const [userDepartmentFilter, setUserDepartmentFilter] = useState("All departments");
  const [auditRoleFilter, setAuditRoleFilter] = useState("All roles");
  const [auditStatusFilter, setAuditStatusFilter] = useState("All statuses");
  const [liveHostel, setLiveHostel] = useState("All hostels");
  const [healthChecking, setHealthChecking] = useState(false);
  const [switches, setSwitches] = useState<Record<string, boolean>>({ Parent: true, Mentor: true, HOD: true, Warden: true, Security: true, Admin: false, Push: true, SMS: true, WhatsApp: false, Email: true, "In-App": true });
  const [extraRows, setExtraRows] = useState<string[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState(["Mentor", "HOD", "Warden"]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const nav = NAV[role];
  const outside = movement?.status === "outside";
  const approved = movement?.status === "approved" || outside || movement?.status === "completed";
  const notify = (title: string, body: string, kind: Notice["kind"] = "movement") => {
    setNotices((prev) => [{ title, body, time: "Just now", kind }, ...prev]);
  };
  const enterRole = (nextRole: Role) => {
    setRole(nextRole);
    const first: Record<Role, Screen> = { Student: "home", Parent: "home", Security: "home", Mentor: "dashboard", HOD: "dashboard", Warden: "dashboard", Admin: "dashboard" };
    setScreen(first[nextRole]);
    setShowMenu(false);
  };
  const setRoleAndPage = (nextRole: Role, nextScreen: Screen) => { setRole(nextRole); setScreen(nextScreen); setShowMenu(false); };
  const submitMovement = () => {
    const newMove: Movement = {
      id: "MV-2026-004821", type: moveType, ...form, status: "pending",
      mentor: moveType !== "Short Outing", hod: moveType !== "Short Outing", warden: false, createdAt: "Today · 5:18 PM",
    };
    setMovement(newMove);
    notify("Request submitted", "Your movement request is now in the approval queue.");
    setScreen("submitted");
    setToast("Movement request submitted · MV-2026-004821");
  };
  const decideApproval = (decision: "approve" | "reject", roleLabel: Role = role) => {
    if (!movement) {
      setToast("Demo request updated. Arun’s movement will appear here after he submits.");
      return;
    }
    if (decision === "reject") {
      setMovement({ ...movement, status: "rejected", note: `${roleLabel} declined this request` });
      notify("Request declined", `${roleLabel} declined your movement request.`, "critical");
      setToast("Request declined. Student and approvers were notified.");
      return;
    }
    const updated = { ...movement };
    if (roleLabel === "Mentor") updated.mentor = true;
    if (roleLabel === "HOD") updated.hod = true;
    updated.warden = true;
    updated.status = "approved";
    setMovement(updated);
    notify("Movement approved", "Your movement is approved. Your exit pass is now active.");
    setToast("Approved · QR exit pass is active");
  };
  const startScan = () => {
    setFailure(null); setBioMatched(false); setVerifyMode(outside ? "return" : "exit");
    if (!movement) { setFailure("expired"); setScreen("denied"); return; }
    if (movement.status === "outside") { setVerifyMode("return"); setScreen("validated"); return; }
    if (movement.status === "completed") { setFailure("alreadyOutside"); setScreen("denied"); return; }
    if (movement.status !== "approved") { setFailure("notApproved"); setScreen("denied"); return; }
    setScreen("validated");
  };
  const beginBiometric = () => { setBioMatched(false); setScreen("biometric"); };
  const matchBiometric = (match: boolean) => {
    if (match) { setBioMatched(true); setToast("Fingerprint match confirmed. Confirm the movement below."); }
    else { setFailure("biometric"); setScreen("denied"); setToast("Biometric mismatch · movement denied"); }
  };
  const confirmGateAction = () => {
    if (!movement || !bioMatched) return;
    const time = verifyMode === "exit" ? "5:42 PM" : "7:54 PM";
    if (verifyMode === "exit") {
      setMovement({ ...movement, status: "outside" });
      setGateEvents((prev) => [{ time, student: "Arun Kumar", action: "EXIT", status: "Verified", gate: "Main Gate" }, ...prev]);
      notify("Exit confirmed", "Arun Kumar exited the hostel through Main Gate. Parent, mentor, HOD and warden updated.", "security");
      setScreen("exitConfirmed");
      setToast("Exit verified · parent and campus team notified");
    } else {
      setMovement({ ...movement, status: "completed" });
      setGateEvents((prev) => [{ time, student: "Arun Kumar", action: "RETURN", status: "Verified", gate: "Main Gate" }, ...prev]);
      notify("Return confirmed", "Arun Kumar has safely returned to the hostel.", "movement");
      setScreen("returnConfirmed");
      setToast("Return verified · Arun is now inside");
    }
  };
  const denyPath = (reason: string) => {
    setFailure(reason);
    setGateEvents((prev) => [{ time: "5:44 PM", student: "Arun Kumar", action: "DENIED", status: reason, gate: reason === "wrongGate" ? "Hostel B Gate" : "Main Gate" }, ...prev]);
    notify("Movement verification denied", `${failureText(reason)}. No gate movement was recorded.`, "critical");
    setScreen("denied");
  };
  const startRequest = (type: MoveType = "Short Outing") => {
    setMoveType(type); setFormStep(1); setScreen("request");
  };
  const editItem = (name: string) => { setModalText(name); setModal("edit"); };
  const makeItem = (name: string) => { setModalText(name); setModal("create"); };
  const isMobileNav = role === "Student" || role === "Parent" || role === "Security";

  function failureText(key: string) {
    const map: Record<string, string> = { expired: "QR expired", notApproved: "Required approval is incomplete", biometric: "Biometric mismatch", wrongGate: "Gate not authorized", alreadyOutside: "Student is already outside" };
    return map[key] || "Movement could not be verified";
  }
  function go(screenName: string) { setScreen(screenName); setFilter("All"); setSearch(""); }
  function pageName() { return nav.find((n) => n.screen === screen)?.label || ({
    request: "Request movement", submitted: "Request submitted", status: "Approval status", qr: "Exit pass",
    validated: verifyMode === "exit" ? "Movement verified" : "Return verification", biometric: "Identity verification",
    exitConfirmed: "Exit confirmed", returnConfirmed: "Return confirmed", denied: "Verification denied", details: "Movement details",
    notificationPolicies: "Notification policies", policies: "Movement policies", workflow: "Approval workflow",
  } as Record<string, string>)[screen] || "HostelFlow";
  }

  if (screen === "login") return (
    <div className={`hf-root ${dark ? "dark" : ""}`}>
      <div className="hf-login">
        <main className="hf-login-panel">
          <div className="hf-between"><Brand /><button className="hf-icon-btn" title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button></div>
          <div className="hf-eyebrow" style={{ marginTop: 22 }}>SECURE INSTITUTIONAL ACCESS</div>
          <h1 style={{ fontSize: 34, margin: "3px 0 8px" }}>Welcome back</h1>
          <p className="hf-muted" style={{ fontSize: 13, marginBottom: 24 }}>Sign in to your secure campus movement portal.</p>
          <form onSubmit={(e) => { e.preventDefault(); enterRole("Student"); setToast("Signed in to the Student demo."); }}>
            <label className="hf-field">Email / Student ID<input className="hf-input" placeholder="name@campus.edu" defaultValue="arun.kumar@campus.edu" /></label>
            <label className="hf-field" style={{ marginTop: 13 }}>Password<input className="hf-input" type="password" placeholder="Enter your password" defaultValue="hostelflow" /></label>
          <div className="hf-between" style={{ margin: "13px 0 20px", fontSize: 11 }}><span className="hf-muted"><LockKeyhole size={12} style={{ verticalAlign: "-2px" }} /> Encrypted institutional access</span><button type="button" className="hf-btn ghost small" onClick={() => setModal("help")}>Forgot password?</button></div>
            <Button variant="primary" type="submit">Sign in <ArrowRight /></Button>
          </form>
          <div className="hf-divider" />
          <div className="hf-between"><strong style={{ fontSize: 12 }}>Explore a role demo</strong><span className="hf-muted hf-sm">Prototype access</span></div>
          <div className="hf-role-grid">{ROLES.map((r) => {
            const Icon = r === "Student" ? GraduationCap : r === "Parent" ? User : r === "Security" ? ShieldCheck : r === "Admin" ? Settings : r === "Warden" ? Building2 : Users;
            return <button className="hf-role-card" key={r} onClick={() => enterRole(r)}><Icon />{r} demo</button>;
          })}</div>
          <p className="hf-muted hf-sm" style={{ marginTop: 20, textAlign: "center" }}><ShieldCheck size={13} style={{ verticalAlign: "-3px", color: "var(--green)" }} /> Secure institutional access · Demo data only</p>
          <button className="hf-btn ghost small" style={{ alignSelf: "center", marginTop: 2 }} onClick={() => setModal("help")}>Need help?</button>
        </main>
        <aside className="hf-login-art">
          <Brand />
          <div className="hf-orbit" /><div className="hf-login-mark"><ScanLine /></div>
          <div><h2>Every movement.<br />Accounted for.</h2><p>One clear chain of approval, identity verification and live campus visibility—from request to safe return.</p></div>
          <div className="hf-row" style={{ color: "#a8b5c9", fontSize: 11 }}><div className="hf-live-pulse">SYSTEM SECURE</div><span>·</span><span>Campus movement, with confidence</span></div>
        </aside>
      </div>
      {toast && <div className="hf-toast">{toast}</div>}
      {modal === "help" && <Modal title="Account support" subtitle="This demonstration uses local-only role access." close={() => setModal(null)}><p className="hf-muted">Choose one of the demo roles to explore HostelFlow. No account or password is required.</p><Button variant="primary" onClick={() => { setModal(null); enterRole("Student"); }}>Open student demo</Button></Modal>}
    </div>
  );

  const roleLabel = role === "Student" ? "Arun Kumar" : role === "Parent" ? "Arun’s Parent" : role === "Security" ? "Security · Main Gate" : role === "Mentor" ? "Dr. Meera Nair" : role === "HOD" ? "Prof. K. Suresh" : role === "Warden" ? "Warden · Hostel A" : "Institution admin";
  const mobileTabs = role === "Student"
    ? [{ label: "Home", screen: "home", icon: Home }, { label: "Movement", screen: "movement", icon: FileText }, { label: "QR", screen: "qr", icon: QrCode }, { label: "Alerts", screen: "notifications", icon: Bell }, { label: "Profile", screen: "profile", icon: User }]
    : role === "Parent"
      ? [{ label: "Home", screen: "home", icon: Home }, { label: "Movement", screen: "details", icon: Activity }, { label: "History", screen: "history", icon: History }, { label: "Alerts", screen: "notifications", icon: Bell }, { label: "Profile", screen: "profile", icon: User }]
      : [{ label: "Home", screen: "home", icon: Home }, { label: "Scan", screen: "scan", icon: ScanLine }, { label: "Activity", screen: "activity", icon: Activity }, { label: "Profile", screen: "profile", icon: User }];

  const renderPage = () => {
    if (role === "Student") {
      if (screen === "home") return <StudentHome />;
      if (screen === "request") return <RequestFlow />;
      if (screen === "submitted") return <Submitted />;
      if (screen === "movement") return <StudentMovement />;
      if (screen === "status") return <ApprovalStatus />;
      if (screen === "qr") return <QRPage />;
      if (screen === "history") return <HistoryPage />;
      if (screen === "notifications") return <NotificationPage />;
      if (screen === "profile") return <ProfilePage />;
    }
    if (role === "Parent") {
      if (screen === "home") return <ParentHome />;
      if (screen === "details") return <ParentDetails />;
      if (screen === "history") return <ParentHistory />;
      if (screen === "notifications") return <NotificationPage parent />;
      if (screen === "profile") return <ProfilePage parent />;
    }
    if (role === "Security") {
      if (screen === "home") return <SecurityHome />;
      if (screen === "scan") return <Scanner />;
      if (screen === "validated") return <Validation />;
      if (screen === "biometric") return <Biometric />;
      if (screen === "exitConfirmed" || screen === "returnConfirmed") return <GateConfirmed returning={screen === "returnConfirmed"} />;
      if (screen === "denied") return <Denied />;
      if (screen === "activity") return <SecurityActivity />;
      if (screen === "profile") return <ProfilePage />;
    }
    if (role === "Mentor") {
      if (screen === "dashboard") return <MentorDashboard />;
      if (screen === "mentees") return <PeoplePage />;
      if (screen === "queue" || screen === "details") return <ApprovalsPage roleName="Mentor" />;
      if (screen === "notifications") return <NotificationPage />;
    }
    if (role === "HOD") {
      if (screen === "dashboard") return <HodDashboard />;
      if (screen === "movements") return <PeoplePage departmentOnly />;
      if (screen === "queue" || screen === "details") return <ApprovalsPage roleName="HOD" />;
      if (screen === "reports") return <ReportsPage />;
      if (screen === "notifications") return <NotificationPage />;
    }
    if (role === "Warden") {
      if (screen === "dashboard") return <WardenDashboard />;
      if (screen === "live") return <LivePage />;
      if (screen === "approvals" || screen === "details") return <ApprovalsPage roleName="Warden" />;
      if (screen === "outside") return <PeoplePage outsideOnly />;
      if (screen === "overdue") return <OverduePage />;
      if (screen === "hostels") return <HostelsPage />;
      if (screen === "gates") return <GatesPage />;
      if (screen === "devices") return <DevicesPage />;
      if (screen === "reports") return <ReportsPage />;
      if (screen === "notifications") return <NotificationPage />;
    }
    if (role === "Admin") {
      if (screen === "dashboard") return <AdminDashboard />;
      if (screen === "live") return <LivePage />;
      if (screen === "users" || screen === "students") return <UsersPage />;
      if (screen === "hostels") return <HostelsPage />;
      if (screen === "gates") return <GatesPage />;
      if (screen === "devices") return <DevicesPage />;
      if (screen === "policies") return <PoliciesPage />;
      if (screen === "workflow") return <WorkflowPage />;
      if (screen === "notificationPolicies") return <NotificationPoliciesPage />;
      if (screen === "reports") return <ReportsPage />;
      if (screen === "audit") return <AuditPage />;
      if (screen === "notifications") return <NotificationPage />;
      if (screen === "settings") return <SettingsPage />;
    }
    return <div className="hf-card hf-panel"><Empty title="Screen unavailable" body="Choose a module from the navigation." action={<Button onClick={() => go(nav[0].screen)}>Go to dashboard</Button>} /></div>;
  };

  function StudentHome() {
    return <>
      <PageHead eyebrow="TUESDAY, OCTOBER 6 · 5:18 PM" title="Good evening, Arun" subtitle="CSE · III Year · Hostel A, Room 204" actions={<Button variant="primary" onClick={() => startRequest()}><Plus /> Request movement</Button>} />
      <div className="hf-home-hero">
        <div className="hf-card hf-status-card">
          <div className="hf-eyebrow">HOSTEL STATUS</div>
          <div className="hf-between" style={{ position: "relative", zIndex: 1 }}><h2>{outside ? "Outside campus" : "Inside hostel"}</h2><Status tone={outside ? "warning" : "success"}>{outside ? "Outside" : "Inside"}</Status></div>
          <p>{MAIN_STUDENT.hostel} · Room {MAIN_STUDENT.room}{outside && movement ? ` · ${movement.destination}` : ""}</p>
          <div className="hf-status-line"><i />{outside ? `Expected back by ${movement?.expected}` : "All clear · last verified at 4:58 PM"}</div>
        </div>
        <div className="hf-quick-grid">
          {moveTypes.map(({ type, desc, icon: Icon }) => <button key={type} className="hf-quick" onClick={() => startRequest(type)}><span className="hf-quick-icon"><Icon /></span><b>{type.replace("Outstation ", "")}</b><span>{type === "Short Outing" ? "Up to 4 hours" : desc.split(",")[0]}</span></button>)}
        </div>
      </div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1.2fr .8fr", marginTop: 18 }}>
        <section className="hf-card hf-panel">
          <div className="hf-section-title"><h2>{movement && movement.status !== "completed" ? "Active movement" : "Movement at a glance"}</h2><Button small onClick={() => go("history")}>View history <ChevronRight /></Button></div>
          {movement && movement.status !== "completed" ? <div className="hf-movement-card" style={{ padding: 0 }}>
            <div className="hf-between"><div><strong>{movement.type}</strong><div className="hf-muted hf-sm" style={{ marginTop: 5 }}>{movement.destination} · {movement.purpose}</div></div><Status tone={movement.status === "approved" ? "success" : movement.status === "outside" ? "warning" : movement.status === "rejected" ? "danger" : "info"}>{movement.status}</Status></div>
            <div className="hf-divider" /><div className="hf-between hf-sm"><span className="hf-muted">Expected exit</span><strong>{movement.exit}</strong></div><div className="hf-between hf-sm" style={{ marginTop: 10 }}><span className="hf-muted">Expected return</span><strong>{movement.expected}</strong></div>
            <div className="hf-row" style={{ marginTop: 17 }}>{movement.status === "approved" && <Button variant="primary" onClick={() => go("qr")}>View exit pass <QrCode /></Button>}<Button onClick={() => go("status")}>Approval timeline</Button></div>
          </div> : <Empty title="No active movement" body="When you leave the hostel, your verified movement will appear here." icon={Activity} action={<Button variant="primary" onClick={() => startRequest()}>Request a movement</Button>} />}
        </section>
        <section className="hf-card hf-panel">
          <div className="hf-section-title"><h2>Before you go</h2><span>SECURITY CHECK</span></div>
          <div className="hf-list">
            <div className="hf-list-item"><span className="hf-stat-icon"><BadgeCheck /></span><div className="hf-list-copy"><strong>Approval comes first</strong><span>Your pass activates after required approval.</span></div></div>
            <div className="hf-list-item"><span className="hf-stat-icon"><QrCode /></span><div className="hf-list-copy"><strong>QR identifies your movement</strong><span>Present it at the gate while it is active.</span></div></div>
            <div className="hf-list-item"><span className="hf-stat-icon"><Fingerprint /></span><div className="hf-list-copy"><strong>Fingerprint confirms identity</strong><span>A separate biometric check is required.</span></div></div>
          </div>
        </section>
      </div>
    </>;
  }
  function RequestFlow() {
    const next = () => {
      if (formStep === 1) setFormStep(2);
      else if (formStep === 2) setFormStep(3);
      else submitMovement();
    };
    return <>
      <PageHead title="Request movement" subtitle="A clear, secure path from permission to verified return." actions={<Button onClick={() => go("home")}><ArrowLeft /> Back to home</Button>} />
      <div className="hf-card hf-panel" style={{ maxWidth: 850, margin: "0 auto" }}>
        <div className="hf-stepper">{["Type", "Details", "Review"].map((s, i) => <><div className={`hf-step ${formStep >= i + 1 ? "active" : ""} ${formStep > i + 1 ? "done" : ""}`} key={s}><b>{formStep > i + 1 ? <Check size={13} /> : i + 1}</b>{s}</div>{i < 2 && <i className="hf-step-line" key={`${s}-line`} />}</>)}</div>
        {formStep === 1 && <><h2 style={{ fontSize: 20 }}>What kind of movement?</h2><p className="hf-muted hf-sm" style={{ marginBottom: 16 }}>Choose the permission that best matches your plan.</p><div className="hf-type-grid">{moveTypes.map(({ type, desc, icon: Icon }) => <button onClick={() => setMoveType(type)} className={`hf-type-option ${moveType === type ? "chosen" : ""}`} key={type}><Icon /><strong>{type}</strong><span>{desc}</span></button>)}</div></>}
        {formStep === 2 && <><h2 style={{ fontSize: 20 }}>Movement details</h2><p className="hf-muted hf-sm" style={{ marginBottom: 17 }}>Add the details approvers and gate staff need.</p><div className="hf-form-grid">
          <label className="hf-field">Purpose<input className="hf-input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></label>
          <label className="hf-field">Destination<input className="hf-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></label>
          <label className="hf-field" style={{ gridColumn: "1/-1" }}>Reason<textarea className="hf-textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
          <label className="hf-field">Expected exit<input className="hf-input" value={form.exit} onChange={(e) => setForm({ ...form, exit: e.target.value })} /></label>
          <label className="hf-field">Expected return<input className="hf-input" value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} /></label>
          {moveType === "Outstation Leave" && <label className="hf-field" style={{ gridColumn: "1/-1" }}>Travel details<input className="hf-input" placeholder="Train / bus, departure details" /></label>}
        </div></>}
        {formStep === 3 && <><h2 style={{ fontSize: 20 }}>Review your request</h2><p className="hf-muted hf-sm" style={{ marginBottom: 17 }}>Check the details before sending to your approval team.</p>
          <div className="hf-card hf-panel" style={{ boxShadow: "none" }}><div className="hf-between"><strong>{moveType}</strong><Status tone="info">Approval required</Status></div><div className="hf-divider" />
            {[["Purpose", form.purpose], ["Destination", form.destination], ["Reason", form.reason], ["Exit", form.exit], ["Expected return", form.expected]].map(([k, v]) => <div className="hf-between hf-sm" key={k} style={{ margin: "12px 0" }}><span className="hf-muted">{k}</span><strong>{v}</strong></div>)}
          </div><div className="hf-banner" style={{ marginTop: 15 }}><ShieldCheck /> Approval is required before your QR exit pass is activated. QR scan identifies this movement; fingerprint verification confirms you at the gate.</div>
        </>}
        <div className="hf-between" style={{ marginTop: 22 }}><Button onClick={() => formStep > 1 ? setFormStep(formStep - 1) : go("home")}><ArrowLeft /> {formStep > 1 ? "Previous" : "Cancel"}</Button><Button variant="primary" onClick={next}>{formStep === 3 ? "Submit request" : "Continue"} <ArrowRight /></Button></div>
      </div>
    </>;
  }
  function Submitted() {
    return <><PageHead title="Request submitted" subtitle="Your request is in the approval queue." /><div className="hf-card hf-panel" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="hf-row"><span className="hf-stat-icon" style={{ width: 46, height: 46, background: "rgba(22,163,74,.12)", color: "var(--green)" }}><CheckCircle2 /></span><div><h2 style={{ fontSize: 21, margin: 0 }}>You’re all set, Arun</h2><span className="hf-muted hf-sm">Request ID · {movement?.id || "MV-2026-004821"}</span></div></div>
      <div className="hf-divider" /><ApprovalRail /><div className="hf-banner"><Clock3 /> QR activation will appear automatically when your required approver confirms this movement.</div>
      <div className="hf-row" style={{ marginTop: 20 }}><Button variant="primary" onClick={() => go("status")}>View request <ArrowRight /></Button><Button onClick={() => setRoleAndPage("Warden", "approvals")}>Switch to warden demo</Button></div>
    </div></>;
  }
  function ApprovalRail() {
    const needsAcademicApproval = movement?.type === "Outstation Leave";
    const nodes = [
      { name: "Request submitted", done: !!movement, role: "Arun Kumar · Submitted" },
      ...(needsAcademicApproval ? [
        { name: "Mentor review", done: !!movement?.mentor, role: movement?.mentor ? "Dr. Meera Nair · Approved" : "Pending review" },
        { name: "HOD review", done: !!movement?.hod, role: movement?.hod ? "Prof. K. Suresh · Approved" : "Pending review" },
      ] : []),
      { name: "Warden approval", done: !!movement?.warden || movement?.status === "approved" || outside, role: movement?.warden ? "Warden · Approved" : movement?.status === "approved" || outside ? "Warden · Approved" : "Awaiting decision" },
      { name: "QR pass activation", done: approved, role: approved ? "Dynamic exit pass active" : "Available after approval" },
      { name: "Gate identity verification", done: outside || movement?.status === "completed", role: outside || movement?.status === "completed" ? "BIO-001 · Match confirmed" : "Awaiting gate scan + fingerprint" },
      { name: "Exit confirmed", done: outside || movement?.status === "completed", role: outside || movement?.status === "completed" ? "Main Gate · 5:42 PM" : "Not yet recorded" },
      { name: "Return confirmed", done: movement?.status === "completed", role: movement?.status === "completed" ? "Main Gate · 7:54 PM" : "Awaiting return verification" },
    ];
    return <div style={{ margin: "18px 0 20px" }}>{nodes.map((n, i) => <div className="hf-approval-line" key={n.name}><div className={`hf-approval-dot ${n.done ? "done" : i === nodes.findIndex((x) => !x.done) ? "current" : ""}`}>{n.done ? <Check size={13} /> : i + 1}</div><div><div className="hf-between"><strong style={{ fontSize: 12 }}>{n.name}</strong><span className="hf-muted hf-sm">{n.role}</span></div>{i === 0 && movement && <span className="hf-muted hf-sm">{movement.createdAt}</span>}</div></div>)}</div>;
  }
  function StudentMovement() {
    return <><PageHead title="Movement requests" subtitle="Manage requests and follow each step to a safe return." actions={<Button variant="primary" onClick={() => startRequest()}><Plus /> New request</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "minmax(0,1.2fr) minmax(270px,.8fr)" }}>
        <section className="hf-card hf-panel"><div className="hf-section-title"><h2>Your latest request</h2><Status tone={movement?.status === "approved" ? "success" : movement?.status === "rejected" ? "danger" : "info"}>{movement?.status || "No request"}</Status></div>
          {movement ? <><div className="hf-between"><div><strong>{movement.type}</strong><p className="hf-muted hf-sm" style={{ margin: "5px 0" }}>{movement.destination} · {movement.purpose}</p></div><span className="hf-muted hf-sm">{movement.id}</span></div><div className="hf-divider" /><ApprovalRail />
            <div className="hf-row"><Button onClick={() => go("status")}>Full timeline</Button>{approved && <Button variant="primary" onClick={() => go("qr")}>Open QR pass <QrCode /></Button>}</div></>
            : <Empty title="No movement requests yet" body="Start a request for a short outing, local permission, leave or emergency." action={<Button variant="primary" onClick={() => startRequest()}>Create request</Button>} />}
        </section><section className="hf-card hf-panel"><div className="hf-section-title"><h2>Quick request</h2></div><div className="hf-list">{moveTypes.map((item) => <button className="hf-list-item" key={item.type} onClick={() => startRequest(item.type)} style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, color: "inherit" }}><span className="hf-stat-icon"><item.icon /></span><div className="hf-list-copy"><strong>{item.type}</strong><span>{item.desc}</span></div><ChevronRight size={16} /></button>)}</div></section>
      </div>
    </>;
  }
  function ApprovalStatus() {
    return <><PageHead title="Approval status" subtitle="Every decision is visible, time-stamped and accountable." actions={<Button onClick={() => go("movement")}><ArrowLeft /> Requests</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "1fr .82fr" }}>
        <div className="hf-card hf-panel"><div className="hf-between"><div><div className="hf-eyebrow">MOVEMENT REQUEST</div><h2 style={{ fontSize: 21, margin: "0 0 5px" }}>{movement?.type || "No request yet"}</h2><span className="hf-muted hf-sm">{movement?.destination || "Submit a request to see your timeline"} · {movement?.id || "—"}</span></div><Status tone={approved ? "success" : movement?.status === "rejected" ? "danger" : "info"}>{movement?.status || "Not submitted"}</Status></div>
          <div className="hf-divider" /><ApprovalRail />
        </div><div className="hf-card hf-panel"><h2 style={{ fontSize: 17 }}>What happens next?</h2><div className="hf-list">
          {[["01", "Request", "Your details are submitted securely."], ["02", "Approval", "Mentor, HOD or warden reviews the request."], ["03", "QR activated", "A pass becomes available only after approval."], ["04", "Gate verification", "QR identification + fingerprint identity check."], ["05", "Return confirmed", "Security verifies your return at the gate."]].map(([n, title, desc]) => <div className="hf-list-item" key={n}><span className="hf-stat-icon">{n}</span><div className="hf-list-copy"><strong>{title}</strong><span>{desc}</span></div></div>)}
        </div></div>
      </div></>;
  }
  function QRPage() {
    const qrState = movement?.status === "approved" ? "QR ACTIVE" : movement?.status === "outside" ? "MOVEMENT IN PROGRESS" : movement?.status === "completed" ? "MOVEMENT COMPLETED" : movement?.status === "rejected" ? "QR REVOKED" : "QR NOT AVAILABLE";
    const tone = movement?.status === "approved" ? "success" : movement?.status === "outside" ? "warning" : movement?.status === "rejected" ? "danger" : "info";
    return <><PageHead title="Exit pass" subtitle="Movement identification only. Gate exit is never approved by QR scan alone." actions={<Button onClick={() => go("status")}><ListChecks /> Approval timeline</Button>} />
      <div className="hf-qr-layout"><div className="hf-card hf-qr-card">
        <div><div className="hf-between"><div><div className="hf-eyebrow">HOSTELFLOW · SECURE PASS</div><h2 style={{ fontSize: 24, margin: "0 0 8px" }}>{qrState}</h2></div><Status tone={tone}>{movement?.status || "Pending"}</Status></div>
          <div className="hf-row" style={{ marginTop: 19 }}><Avatar name="Arun Kumar" /><div><strong>Arun Kumar</strong><div className="hf-muted hf-sm">CSE · III Year · Reg. 21CS104</div></div></div>
          <div className="hf-divider" /><div className="hf-between"><span className="hf-muted hf-sm">Movement</span><strong>{movement?.type || "Short Outing"}</strong></div><div className="hf-between" style={{ marginTop: 11 }}><span className="hf-muted hf-sm">Destination</span><strong>{movement?.destination || "Town"}</strong></div><div className="hf-between" style={{ marginTop: 11 }}><span className="hf-muted hf-sm">Expected return</span><strong>{movement?.expected || "Today · 8:00 PM"}</strong></div>
          <div className="hf-banner" style={{ marginTop: 20 }}><Fingerprint /> Show this pass at an authorized gate. Fingerprint verification is required separately.</div>
          {!approved && movement?.status !== "outside" && <div className="hf-muted hf-sm" style={{ marginTop: 13 }}>{movement?.status === "rejected" ? movement.note : "Waiting for approval. Your QR is unavailable until approval is complete."}</div>}
          {movement?.status === "approved" && <div className="hf-row" style={{ marginTop: 17 }}><span className="hf-live-pulse">PASS ACTIVE</span><span className="hf-muted hf-sm">Refreshes automatically · expires in 00:42</span></div>}
        </div>
        {movement?.status === "approved" ? <div><QRVisual seed={`${movement.id}-${new Date().getMinutes()}`} /><div className="hf-qr-expiry"><span className="hf-live-pulse">Dynamic pass</span><br />Movement ID: {movement.id}</div></div> :
          <div className="hf-empty"><div className="hf-empty-icon"><QrCode /></div><h3>{movement?.status === "completed" ? "Pass completed" : "Pass unavailable"}</h3><p>{movement?.status === "completed" ? "Your return was verified. This pass can no longer be used." : "Approval is needed before a valid movement QR can be issued."}</p>{movement?.status === "outside" && <Button variant="primary" onClick={() => setRoleAndPage("Security", "scan")}>Open security return scan</Button>}</div>}
      </div><div className="hf-flow-equation" style={{ marginTop: 14 }}><b>QR</b><span>= movement identification</span><b>+</b><b>Fingerprint</b><span>= identity verification</span></div></div>
    </>;
  }
  function HistoryPage({ parent = false }: { parent?: boolean }) {
    const entries = [
      ...(movement ? [{ type: movement.type, dest: movement.destination, time: movement.status === "completed" ? "5:42 PM → 7:54 PM" : movement.status === "outside" ? "5:42 PM → In progress" : movement.status === "approved" ? "Approved · not yet exited" : "Today · 5:18 PM", status: movement.status }] : []),
      { type: "Local Permission", dest: "City Hospital", time: "10:10 AM → 12:05 PM", status: "completed" as MoveStatus },
      { type: "Short Outing", dest: "Town", time: "5:30 PM → 7:52 PM", status: "completed" as MoveStatus },
      { type: "Outstation Leave", dest: "Home town", time: "Sep 28 – Oct 1", status: "completed" as MoveStatus },
    ];
    const filtered = entries.filter((e) => (filter === "All" || e.type.toLowerCase().includes(filter.toLowerCase())) && `${e.type} ${e.dest}`.toLowerCase().includes(search.toLowerCase()));
    return <><PageHead title={parent ? "Movement history" : "Movement history"} subtitle={parent ? "A private record of Arun’s hostel movements." : "Your verified movement record."} />
      <div className="hf-card hf-panel"><div className="hf-filterbar">{["All", "Outing", "Permission", "Leave", "Emergency"].map((f) => <button key={f} className={`hf-pill ${filter === f ? "selected" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}<input className="hf-search" placeholder="Search movements" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {filtered.length ? <div className="hf-list">{filtered.map((e, i) => <div className="hf-list-item" key={`${e.type}${i}`}><span className="hf-stat-icon"><CalendarDays /></span><div className="hf-list-copy"><strong>{e.type}</strong><span>{e.dest} · {e.time}</span></div><Status tone={e.status === "completed" ? "success" : e.status === "rejected" ? "danger" : e.status === "outside" ? "warning" : e.status === "approved" ? "success" : "info"}>{e.status}</Status></div>)}</div> : <Empty title="No movements match" body="Try a different filter or search term." />}</div>
    </>;
  }
  function NotificationPage({ parent = false }: { parent?: boolean }) {
    const visible = parent ? notices.filter((n) => n.kind === "movement" || n.kind === "security") : notices;
    return <><PageHead title="Notifications" subtitle={parent ? "Movement updates for Arun only. This portal cannot approve or reject." : "Important movement and security updates."} actions={<Button small onClick={() => { setNotices([]); setToast("Notifications marked as read."); }}>Mark all read</Button>} />
      {visible.length ? <div className="hf-card hf-panel"><div className="hf-section-title"><h2>Today</h2><span>{visible.length} updates</span></div><div className="hf-list">{visible.map((n, i) => <div className="hf-notice" key={`${n.title}${i}`} style={{ marginBottom: 10 }}><span className="hf-notice-icon" style={n.kind === "critical" ? { color: "var(--red)", background: "rgba(220,38,38,.09)" } : n.kind === "security" ? { color: "var(--green)", background: "rgba(22,163,74,.1)" } : undefined}>{n.kind === "critical" ? <AlertTriangle /> : n.kind === "security" ? <ShieldCheck /> : <Bell />}</span><div style={{ flex: 1 }}><div className="hf-between"><strong>{n.title}</strong><span className="hf-muted hf-sm">{n.time}</span></div><p>{parent ? n.body.replace("your", "Arun’s") : n.body}</p></div></div>)}</div></div> : <div className="hf-card hf-panel"><Empty title="You’re all caught up" body="New movement and gate updates will appear here." icon={Bell} /></div>}
    </>;
  }
  function ProfilePage({ parent = false }: { parent?: boolean }) {
    return <><PageHead title={parent ? "Parent profile" : "My profile"} subtitle="Your personal and campus details." />
      <div className="hf-grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(250px,.7fr)" }}><div className="hf-card hf-panel"><div className="hf-row"><Avatar name={parent ? "Arun’s Parent" : "Arun Kumar"} /><div><h2 style={{ margin: 0, fontSize: 20 }}>{parent ? "Arun’s Parent" : "Arun Kumar"}</h2><span className="hf-muted hf-sm">{parent ? "Parent portal · linked account" : "21CS104 · CSE · III Year"}</span></div></div><div className="hf-divider" />
        {Object.entries(parent ? { "Linked student": "Arun Kumar", "Department": "CSE", "Hostel": "Hostel A", "Room": "204", "Relationship": "Parent / Guardian", "Alerts": "Movement and return updates" } : { "Register number": "21CS104", Department: "CSE", Year: "III Year", Hostel: "Hostel A", Room: "204", Mentor: "Dr. Meera Nair", Parent: "S. Kumar", Status: outside ? "Outside campus" : "Inside hostel" }).map(([k, v]) => <div className="hf-between hf-sm" key={k} style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}><span className="hf-muted">{k}</span><strong>{v}</strong></div>)}<Button style={{ marginTop: 17 }} onClick={() => editItem("Profile details")}>Edit profile</Button></div>
        <div className="hf-card hf-panel"><div className="hf-eyebrow">ACCOUNT SECURITY</div><h2 style={{ fontSize: 17 }}>Protected access</h2><div className="hf-list"><div className="hf-list-item"><ShieldCheck color="var(--green)" /><div className="hf-list-copy"><strong>Secure institutional access</strong><span>Profile is linked to campus identity records.</span></div></div><div className="hf-list-item"><Bell /><div className="hf-list-copy"><strong>Movement alerts enabled</strong><span>Important updates are delivered in-app.</span></div></div></div></div></div>
    </>;
  }
  function ParentHome() {
    return <><PageHead eyebrow="PARENT PORTAL · TUESDAY, OCTOBER 6" title="Good evening" subtitle="A clear view of your child’s campus movement." />
      <div className="hf-grid" style={{ gridTemplateColumns: "1.15fr .85fr" }}><div className="hf-card hf-panel">
        <div className="hf-between"><div className="hf-row"><Avatar name="Arun Kumar" /><div><h2 style={{ margin: 0, fontSize: 19 }}>Arun Kumar</h2><span className="hf-muted hf-sm">CSE · III Year</span></div></div><Status tone={outside ? "warning" : "success"}>{outside ? "Outside" : "Inside"}</Status></div>
        <div className="hf-divider" /><div className="hf-between hf-sm"><span className="hf-muted">Residence</span><strong>Hostel A · Room 204</strong></div>
        {movement && <><div className="hf-divider" /><div className="hf-eyebrow">CURRENT MOVEMENT</div><div className="hf-between"><strong>{movement.type}</strong><Status tone={outside ? "warning" : approved ? "success" : "info"}>{movement.status}</Status></div><p className="hf-muted hf-sm" style={{ margin: "6px 0 15px" }}>{movement.destination} · {movement.purpose}</p><div className="hf-between hf-sm"><span className="hf-muted">Exited</span><strong>{outside || movement.status === "completed" ? "5:42 PM" : "Not exited"}</strong></div><div className="hf-between hf-sm" style={{ marginTop: 9 }}><span className="hf-muted">Expected return</span><strong>{movement.expected}</strong></div></>}
        {!movement && <div className="hf-empty" style={{ paddingBottom: 10 }}><div className="hf-empty-icon"><Home /></div><h3>Arun is inside the hostel</h3><p>No active movement is currently underway.</p></div>}
        <Button style={{ marginTop: 15 }} onClick={() => go("details")}>View movement details <ChevronRight /></Button>
      </div><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Peace of mind, in real time</h2><Status tone="success">CONNECTED</Status></div>
        <div className="hf-list">{[["Parent notified", "When an exit is verified"], ["Expected return", movement?.expected || "No movement planned"], ["Gate verification", "QR plus fingerprint required"]].map(([a, b]) => <div className="hf-list-item" key={a}><span className="hf-stat-icon"><ShieldCheck /></span><div className="hf-list-copy"><strong>{a}</strong><span>{b}</span></div></div>)}</div>
        <div className="hf-banner" style={{ marginTop: 12 }}><LockKeyhole /> You can view updates for Arun only. Parent accounts cannot approve or reject movements.</div></div></div>
    </>;
  }
  function ParentDetails() {
    return <><PageHead title="Movement details" subtitle="Live status and movement details for Arun Kumar." />
      {movement ? <div className="hf-card hf-panel" style={{ maxWidth: 750 }}><div className="hf-between"><div className="hf-row"><Avatar name="Arun Kumar" /><div><strong>Arun Kumar</strong><div className="hf-muted hf-sm">CSE · III Year · Hostel A · Room 204</div></div></div><Status tone={outside ? "warning" : approved ? "success" : "info"}>{movement.status}</Status></div><div className="hf-divider" />
        {[["Movement type", movement.type], ["Destination", movement.destination], ["Purpose", movement.purpose], ["Exit time", outside || movement.status === "completed" ? "5:42 PM · Main Gate" : movement.exit], ["Expected return", movement.expected], ["Return verification", movement.status === "completed" ? "Confirmed · 7:54 PM" : outside ? "Awaiting gate verification" : "Not yet exited"]].map(([a, b]) => <div key={a} className="hf-between hf-sm" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}><span className="hf-muted">{a}</span><strong>{b}</strong></div>)}
        <div className="hf-banner" style={{ marginTop: 16 }}><Bell /> {outside ? "Exit confirmed. Parent, mentor, HOD and warden were notified." : "You will receive a notification when the movement status changes."}</div>
      </div> : <div className="hf-card hf-panel"><Empty title="No active movement" body="Arun is currently inside the hostel." icon={Home} /></div>}</>;
  }
  function ParentHistory() { return <HistoryPage parent />; }
  function SecurityHome() {
    return <><PageHead eyebrow="GATE OPERATIONS · MAIN GATE" title="Good evening, Security" subtitle="Every exit and return requires movement approval and an identity match." actions={<span className="hf-live-pulse">DEVICE ONLINE</span>} />
      <div className="hf-grid hf-stats"><Stat label="Exits today" value={gateEvents.filter((e) => e.action === "EXIT").length + 42} note="At Main Gate" icon={ArrowRight} /><Stat label="Returns today" value={gateEvents.filter((e) => e.action === "RETURN").length + 37} note="Verified returns" icon={ArrowDownLeft} tone="green" /><Stat label="Denied" value={gateEvents.filter((e) => e.action === "DENIED").length + 2} note="No access granted" icon={ShieldAlert} tone="red" /><Stat label="Biometric" value="Online" note="BIO-001 · 12 sec ago" icon={Fingerprint} tone="green" /></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1fr .8fr" }}><div className="hf-card hf-panel" style={{ background: "var(--ink)", color: "white" }}><div className="hf-eyebrow" style={{ color: "#a8b5c9" }}>MAIN GATE · BIO-001</div><h2 style={{ fontSize: 26, margin: "0 0 9px" }}>Verify a movement</h2><p style={{ color: "#afbdd0", fontSize: 12, maxWidth: 390, lineHeight: 1.55 }}>Scan the movement QR, confirm student details, then complete fingerprint verification before recording a gate event.</p>
        <Button variant="primary" onClick={() => go("scan")}><ScanLine /> Scan movement QR</Button>
        <div className="hf-flow-equation" style={{ marginTop: 20, color: "var(--ink)" }}><b>QR scan</b><span>identifies movement</span><b>→</b><b>Fingerprint</b><span>verifies identity</span></div>
      </div><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Today’s gate activity</h2><Button small onClick={() => go("activity")}>View all</Button></div><GateEventList limit={3} /></div></div>
      <div className="hf-section hf-card hf-panel"><div className="hf-section-title"><h2>Verification outcomes</h2><span>DEMO EXCEPTIONS</span></div><p className="hf-muted hf-sm">Exercise clear denial states; a QR alone never grants movement.</p><div className="hf-row" style={{ flexWrap: "wrap" }}>{[["expired", "Expired QR"], ["notApproved", "Incomplete approval"], ["biometric", "Biometric mismatch"], ["wrongGate", "Wrong gate"], ["alreadyOutside", "Already outside"]].map(([k, v]) => <Button key={k} small onClick={() => denyPath(k)}><AlertCircle />{v}</Button>)}</div></div>
    </>;
  }
  function Scanner() {
    return <><PageHead title="Scan movement QR" subtitle="Main Gate · Device SEC-012" actions={<Button onClick={() => go("home")}><ArrowLeft /> Gate overview</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(270px,.75fr)", maxWidth: 980 }}>
        <div className="hf-card hf-panel"><div className="hf-scanner"><div className="hf-scan-frame"><ScanLine /></div></div><p className="hf-muted hf-sm" style={{ textAlign: "center", margin: "14px 0 18px" }}>Align the student’s dynamic QR inside the frame.</p><Button variant="primary" onClick={startScan} style={{ width: "100%" }}><ScanLine /> Scan demo movement</Button><div className="hf-row" style={{ marginTop: 11 }}><Button small onClick={() => denyPath("expired")}>Test expired QR</Button><Button small onClick={() => denyPath("wrongGate")}>Test wrong gate</Button></div></div>
        <div className="hf-card hf-panel"><div className="hf-eyebrow">GATE CHECKLIST</div><h2 style={{ fontSize: 18 }}>Verification sequence</h2><div className="hf-list">{[["01", "Scan QR", "Identify the movement pass"], ["02", "Check approval", "Ensure status is approved"], ["03", "Match identity", "Use fingerprint device"], ["04", "Confirm action", "Record exit or return"]].map(([n, a, b], i) => <div className="hf-list-item" key={n}><span className="hf-stat-icon">{n}</span><div className="hf-list-copy"><strong>{a}</strong><span>{b}</span></div>{i === 0 && <CheckCircle2 color="var(--green)" size={16} />}</div>)}</div>
          <div className="hf-banner"><Fingerprint /> Biometric data is not stored in the QR. Identity confirmation is a separate device check.</div></div>
      </div>
    </>;
  }
  function Validation() {
    const isReturn = verifyMode === "return";
    return <><PageHead title={isReturn ? "Return verification" : "Movement verified"} subtitle={isReturn ? "Confirm this student’s return to campus." : "Movement identity found. Exit is not yet approved."} actions={<Button onClick={() => go("scan")}><ArrowLeft /> Scanner</Button>} />
      <div className="hf-card hf-panel" style={{ maxWidth: 680 }}><div className="hf-between"><div className="hf-row"><span className="hf-stat-icon" style={{ color: "var(--green)", background: "rgba(22,163,74,.1)" }}><QrCode /></span><div><div className="hf-eyebrow">QR VERIFIED · MOVEMENT ID</div><h2 style={{ margin: 0, fontSize: 22 }}>{isReturn ? "Return verification" : "Movement identified"}</h2></div></div><Status tone="success">Valid pass</Status></div>
        <div className="hf-divider" /><div className="hf-row"><Avatar name="Arun Kumar" /><div><strong>Arun Kumar</strong><div className="hf-muted hf-sm">CSE · III Year · 21CS104</div></div></div>
        <div className="hf-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", marginTop: 18 }}>{[["Movement", movement?.type || "Short Outing"], ["Destination", movement?.destination || "Town"], ["Gate", "Main Gate"], ["Expected return", movement?.expected || "Today · 8:00 PM"]].map(([a, b]) => <div className="hf-card hf-panel" style={{ boxShadow: "none", padding: 13 }} key={a}><div className="hf-muted hf-sm">{a}</div><strong style={{ display: "block", marginTop: 5, fontSize: 12 }}>{b}</strong></div>)}</div>
        <div className="hf-banner" style={{ marginTop: 16, background: "rgba(245,158,11,.12)", color: "#b77908" }}><AlertTriangle /> QR scan identifies an approved movement. It does not authorize exit or confirm identity.</div>
        <div className="hf-row" style={{ marginTop: 18 }}><Button variant="primary" onClick={beginBiometric}><Fingerprint /> Verify biometric</Button><Button onClick={() => denyPath("wrongGate")}>Deny · wrong gate</Button></div>
      </div>
    </>;
  }
  function Biometric() {
    return <><PageHead title="Identity verification" subtitle={verifyMode === "exit" ? "Complete identity verification before confirming exit." : "Confirm identity before recording the student’s return."} actions={<Button onClick={() => go("validated")}><ArrowLeft /> Movement details</Button>} />
      <div className="hf-card hf-panel" style={{ maxWidth: 660 }}><div className="hf-between"><div><div className="hf-eyebrow">QR VERIFIED ✓</div><h2 style={{ fontSize: 21, margin: 0 }}>Arun Kumar</h2><span className="hf-muted hf-sm">CSE · III Year · {movement?.type || "Short Outing"}</span></div><Status tone="info">Fingerprint check</Status></div>
        <div className="hf-bio-orb"><Fingerprint /></div><div style={{ textAlign: "center" }}><strong>{bioMatched ? "Biometric match confirmed" : "Waiting for fingerprint…"}</strong><p className="hf-muted hf-sm" style={{ margin: "6px 0 16px" }}>{bioMatched ? "Identity verified successfully at BIO-001." : "Ask the student to place a finger on the biometric reader."}</p></div>
        <div className="hf-flow-equation"><b>QR verified</b><span>+</span><b style={{ color: bioMatched ? "var(--green)" : "var(--muted)" }}>Biometric {bioMatched ? "matched" : "pending"}</b><span>=</span><b style={{ color: bioMatched ? "var(--green)" : "var(--muted)" }}>Identity {bioMatched ? "confirmed" : "not confirmed"}</b></div>
        <div className="hf-row" style={{ justifyContent: "center", marginTop: 18 }}>{!bioMatched ? <><Button variant="primary" onClick={() => matchBiometric(true)}><Fingerprint /> Simulate match</Button><Button variant="danger" onClick={() => matchBiometric(false)}>Simulate mismatch <X /></Button></> : <Button variant="positive" onClick={confirmGateAction}><CheckCircle2 /> Confirm {verifyMode === "exit" ? "exit" : "return"}</Button>}</div>
        <p className="hf-muted hf-sm" style={{ textAlign: "center", margin: "15px 0 0" }}>A successful match is required. No action is recorded until security confirms.</p>
      </div>
    </>;
  }
  function GateConfirmed({ returning }: { returning: boolean }) {
    return <><PageHead title={returning ? "Return confirmed" : "Exit confirmed"} subtitle="Gate event recorded and campus stakeholders updated." />
      <div className="hf-card hf-panel" style={{ maxWidth: 670, textAlign: "center", padding: 34 }}>
        <span className="hf-stat-icon" style={{ width: 60, height: 60, margin: "0 auto 15px", color: "var(--green)", background: "rgba(22,163,74,.12)", borderRadius: 19 }}><CheckCircle2 size={27} /></span>
        <div className="hf-eyebrow">{returning ? "RETURN VERIFIED" : "EXIT VERIFIED"}</div><h2 style={{ fontSize: 29, margin: "0 0 8px" }}>{returning ? "Return confirmed" : "Exit confirmed"}</h2><p className="hf-muted">{returning ? "Arun Kumar is now INSIDE the hostel." : "Arun Kumar is now OUTSIDE the hostel."}</p>
        <div className="hf-card hf-panel" style={{ textAlign: "left", boxShadow: "none", marginTop: 21 }}><div className="hf-between"><strong>Arun Kumar</strong><Status tone={returning ? "success" : "warning"}>{returning ? "Inside" : "Outside"}</Status></div><div className="hf-between hf-sm" style={{ marginTop: 13 }}><span className="hf-muted">Gate · Main Gate</span><strong>{returning ? "7:54 PM" : "5:42 PM"}</strong></div><div className="hf-between hf-sm" style={{ marginTop: 9 }}><span className="hf-muted">{movement?.type} · {movement?.destination}</span><span className="hf-muted">BIO-001 · match verified</span></div></div>
        <div className="hf-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 15 }}>{["Parent notified", "Mentor updated", "Warden updated"].map((x) => <div className="hf-card hf-panel" key={x} style={{ boxShadow: "none", padding: 12, fontSize: 10, color: "var(--green)", fontWeight: 700 }}><Check size={13} /> {x}</div>)}</div>
        <div className="hf-row" style={{ justifyContent: "center", marginTop: 19 }}><Button variant="primary" onClick={() => go("home")}>Done</Button><Button onClick={() => setRoleAndPage("Parent", "home")}>View parent update</Button><Button onClick={() => setRoleAndPage("Warden", "live")}>View live operations</Button></div>
      </div>
    </>;
  }
  function Denied() {
    const key = failure || "notApproved";
    const wrongGate = key === "wrongGate";
    const title = key === "expired" ? "QR expired" : key === "notApproved" ? "Movement not approved" : key === "biometric" ? "Biometric mismatch" : wrongGate ? "Gate not authorized" : "Invalid movement state";
    const copy = key === "expired" ? "This QR is no longer valid. Ask the student to generate a new pass." : key === "notApproved" ? "Required approval is incomplete. No exit was granted." : key === "biometric" ? "Identity could not be verified. No movement was recorded." : wrongGate ? "This movement cannot be processed at this gate." : "Student is already marked outside. Exit cannot be repeated.";
    return <><PageHead title="Verification denied" subtitle="Movement is blocked until the issue is resolved." actions={<Button onClick={() => go("scan")}><ArrowLeft /> Return to scanner</Button>} />
      <div className="hf-card hf-panel" style={{ maxWidth: 650, textAlign: "center", padding: 34, borderColor: "rgba(220,38,38,.3)" }}>
        <span className="hf-stat-icon" style={{ width: 58, height: 58, margin: "0 auto 15px", background: "rgba(220,38,38,.1)", color: "var(--red)", borderRadius: 18 }}><ShieldAlert size={26} /></span>
        <Status tone="danger">EXIT DENIED</Status><h2 style={{ fontSize: 27, margin: "12px 0 8px" }}>{title}</h2><p className="hf-muted" style={{ maxWidth: 420, margin: "0 auto" }}>{copy}</p>
        <div className="hf-card hf-panel" style={{ textAlign: "left", boxShadow: "none", marginTop: 21 }}><div className="hf-between"><strong>Arun Kumar · Main Gate</strong><Status tone="danger">Not recorded</Status></div><p className="hf-muted hf-sm" style={{ margin: "9px 0 0" }}>QR identifies a movement; only a verified fingerprint plus explicit security confirmation can authorize the gate event.</p></div>
        <div className="hf-row" style={{ justifyContent: "center", marginTop: 18 }}><Button variant="primary" onClick={() => go("scan")}>Try another scan</Button>{key === "expired" && <Button onClick={() => { if (movement?.status === "approved") { go("scan"); setToast("A fresh dynamic QR is ready to scan."); } else setRoleAndPage("Warden", "approvals"); }}>Generate fresh QR</Button>}{key === "notApproved" && <Button onClick={() => setRoleAndPage("Warden", "approvals")}>Open approval queue</Button>}</div>
      </div>
    </>;
  }
  function GateEventList({ limit }: { limit?: number }) {
    const events = gateEvents.filter((e) => filter === "All" || (filter === "Denied" ? e.action === "DENIED" : e.action.toLowerCase() === filter.toLowerCase())).filter((e) => `${e.student} ${e.action} ${e.status}`.toLowerCase().includes(search.toLowerCase())).slice(0, limit || 20);
    return <div className="hf-list">{events.map((e, i) => <div className="hf-list-item" key={`${e.time}${i}`}><span className="hf-stat-icon" style={e.action === "DENIED" ? { color: "var(--red)" } : { color: "var(--green)" }}>{e.action === "DENIED" ? <X /> : e.action === "EXIT" ? <ArrowRight /> : <ArrowDownLeft />}</span><div className="hf-list-copy"><strong>{e.student} · {e.action}</strong><span>{e.time} · {e.gate}</span></div><Status tone={e.action === "DENIED" ? "danger" : "success"}>{e.status}</Status></div>)}</div>;
  }
  function SecurityActivity() {
    return <><PageHead title="Today’s gate activity" subtitle="Verified exits, returns and denied attempts at Main Gate." /><div className="hf-card hf-panel"><div className="hf-filterbar">{["All", "Exit", "Return", "Denied"].map((f) => <button className={`hf-pill ${filter === f ? "selected" : ""}`} key={f} onClick={() => setFilter(f)}>{f}</button>)}<input className="hf-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a student" /></div><GateEventList /></div></>;
  }
  function MentorDashboard() {
    return <><PageHead title="Good evening, Dr. Meera" subtitle="Your mentees and their movement approvals." actions={<Button onClick={() => go("mentees")}>View mentees <ChevronRight /></Button>} />
      <div className="hf-grid hf-stats"><Stat label="My mentees" value="42" note="CSE · III Year" icon={Users} /><Stat label="Outside" value={outside ? 4 : 3} note="Movement in progress" icon={ArrowRight} tone="amber" /><Stat label="Pending approval" value={movement?.status === "pending" ? 1 : 2} note="Awaiting your review" icon={Clock3} tone="blue" /><Stat label="Overdue" value="1" note="Needs follow-up" icon={AlertTriangle} tone="red" /></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1fr .8fr" }}><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Approval queue</h2><Button small onClick={() => go("queue")}>View queue</Button></div><ApprovalCards roleName="Mentor" /></div><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Mentee movement</h2><span>CSE · III YEAR</span></div><PeopleMini people={PEOPLE} /></div></div>
    </>;
  }
  function HodDashboard() {
    return <><PageHead eyebrow="DEPARTMENT OPERATIONS" title="CSE Department" subtitle="Movement overview · Tuesday, October 6" />
      <div className="hf-grid hf-stats"><Stat label="Students" value="620" note="Across all year groups" icon={GraduationCap} /><Stat label="Outside" value={outside ? "29" : "28"} note="Currently in movement" icon={ArrowRight} tone="amber" /><Stat label="Pending approval" value={movement?.status === "pending" ? "8" : "7"} note="Department queue" icon={Clock3} /><Stat label="Overdue" value="2" note="Follow-up required" icon={AlertTriangle} tone="red" /></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1.1fr .9fr" }}><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Department movements</h2><Button small onClick={() => go("movements")}>View list</Button></div><PeopleMini people={PEOPLE.filter((p) => p.dept === "CSE" || p.name === "Rahul K")} /></div><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Approvals</h2><Button small onClick={() => go("queue")}>Open queue</Button></div><ApprovalCards roleName="HOD" /></div></div>
    </>;
  }
  function WardenDashboard() {
    return <><PageHead title="Good evening, Warden" subtitle="Hostel operations · Tuesday, October 6 · 5:18 PM" actions={<span className="hf-live-pulse">LIVE OPERATIONS</span>} />
      <div className="hf-grid hf-stats"><Stat label="Students outside" value={outside ? "125" : "124"} note="Across all hostels" icon={ArrowRight} tone="amber" /><Stat label="Inside" value="1,876" note="Presence confirmed" icon={Home} tone="green" /><Stat label="Pending approvals" value={movement?.status === "pending" ? 19 : 18} note="Across approval queues" icon={Clock3} /><Stat label="Overdue" value="7" note="2 require follow-up" icon={AlertTriangle} tone="red" /></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1.2fr .8fr" }}><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Live hostel operations</h2><Button small onClick={() => go("live")}>Open board</Button></div><PeopleMini people={PEOPLE} /></div><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Pending decisions</h2><Button small onClick={() => go("approvals")}>View all</Button></div><ApprovalCards roleName="Warden" /><div className="hf-divider" /><div className="hf-between"><span className="hf-muted hf-sm">Gate & biometric devices</span><Status tone="success">All systems online</Status></div></div></div>
      <div className="hf-section hf-card hf-panel"><div className="hf-section-title"><h2>Operational shortcuts</h2><span>WARDEN CONTROL</span></div><div className="hf-row" style={{ flexWrap: "wrap" }}>{[["Live board", "live"], ["Approvals", "approvals"], ["Outside now", "outside"], ["Overdue", "overdue"], ["Hostels", "hostels"], ["Gate devices", "devices"]].map(([x, s]) => <Button key={x} onClick={() => go(s)}>{x} <ChevronRight /></Button>)}</div></div>
    </>;
  }
  function ApprovalCards({ roleName }: { roleName: Role }) {
    const records: { name: string; type: string; dest: string; dept: string; state: string; isArun: boolean }[] = [];
    if (movement?.status === "pending") records.push({ name: "Arun Kumar", type: movement.type, dest: movement.destination, dept: "CSE · III Year", state: roleName === "Warden" ? movement.warden ? "Approved" : "Pending" : roleName === "HOD" ? movement.hod ? "Approved" : "Pending" : movement.mentor ? "Approved" : "Pending", isArun: true });
    records.push({ name: "Priya S", type: "Outstation Leave", dest: "Chennai", dept: "ECE · II Year", state: "Pending", isArun: false });
    records.push({ name: "Rahul K", type: "Local Permission", dest: "City Hospital", dept: "Mechanical · III Year", state: "Pending", isArun: false });
    return <div className="hf-list">{records.map((r) => <div className="hf-list-item" key={r.name}><Avatar name={r.name} small /><div className="hf-list-copy"><strong>{r.name}</strong><span>{r.type} · {r.dest} · {r.dept}</span></div><Status tone={r.state === "Approved" ? "success" : "warning"}>{r.state}</Status><div className="hf-row">{r.isArun && <Button small variant="positive" onClick={() => decideApproval("approve", roleName)}>Approve</Button>}<Button small onClick={() => { setModalText(`${r.name} · ${r.type} · ${r.dest}`); setModal("edit"); }}>Details</Button></div></div>)}</div>;
  }
  function ApprovalsPage({ roleName }: { roleName: Role }) {
    const all = [
      ...(movement?.status === "pending" ? [{ name: "Arun Kumar", dept: "CSE · III Year", type: movement.type, dest: movement.destination, reason: movement.reason, mine: true }] : []),
      { name: "Priya S", dept: "ECE · II Year", type: "Outstation Leave", dest: "Chennai", reason: "Family function · Oct 6 – Oct 8", mine: false },
      { name: "Rahul K", dept: "Mechanical · III Year", type: "Emergency", dest: "City Hospital", reason: "Urgent medical appointment", mine: false },
    ].filter((r) => filter === "All" || r.type.toLowerCase().includes(filter.toLowerCase()) || (filter === "Urgent" && r.type === "Emergency"));
    return <><PageHead title={roleName === "Warden" ? "Movement approvals" : "Approval queue"} subtitle={`Review requests routed to ${roleName === "Warden" ? "the warden’s desk" : `the ${roleName.toLowerCase()}`}.`} actions={<Button onClick={() => setFilter("All")}><Filter /> Clear filters</Button>} />
      <div className="hf-card hf-panel"><div className="hf-filterbar">{["All", "Pending", "Urgent", "Outstation", "Emergency"].map((f) => <button key={f} className={`hf-pill ${filter === f ? "selected" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}<input className="hf-search" placeholder="Search requests" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {all.length ? all.filter((r) => `${r.name} ${r.type} ${r.dest}`.toLowerCase().includes(search.toLowerCase())).map((r) => <div className="hf-card hf-panel" key={r.name} style={{ boxShadow: "none", marginBottom: 12 }}>
          <div className="hf-between"><div className="hf-row"><Avatar name={r.name} /><div><strong>{r.name}</strong><div className="hf-muted hf-sm">{r.dept}</div></div></div><Status tone="warning">Pending review</Status></div>
          <div className="hf-divider" /><div className="hf-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>{[["Movement", r.type], ["Destination", r.dest], ["Reason", r.reason]].map(([a, b]) => <div key={a}><div className="hf-muted hf-sm">{a}</div><strong style={{ display: "block", fontSize: 12, marginTop: 5 }}>{b}</strong></div>)}</div>
          <div className="hf-between" style={{ marginTop: 16 }}><span className="hf-muted hf-sm">{r.type === "Outstation Leave" ? `Mentor ${movement?.mentor ? "✓ Approved" : "· Pending"}　 HOD ${movement?.hod ? "✓ Approved" : "· Pending"}　 Warden ${movement?.warden ? "✓ Approved" : "· Pending"}` : `Approval path · ${roleName} review`}</span><div className="hf-row"><Button small onClick={() => { setModalText(`${r.name} · ${r.type} · ${r.dest} · ${r.reason}`); setModal("edit"); }}>View details</Button><Button small variant="danger" onClick={() => r.mine ? decideApproval("reject", roleName) : setToast(`${r.name}’s request declined in demo state.`)}>Reject</Button><Button small variant="positive" onClick={() => r.mine ? decideApproval("approve", roleName) : setToast(`${r.name}’s request approved in demo state.`)}>Approve</Button></div></div>
        </div>) : <Empty title="No requests in this view" body="Adjust filters or return when a request enters your queue." icon={ListChecks} />}
      </div></>;
  }
  function PeopleMini({ people }: { people: typeof PEOPLE }) {
    return <div className="hf-list">{people.map((p) => <div key={p.name} className="hf-list-item"><Avatar name={p.name} small /><div className="hf-list-copy"><strong>{p.name}</strong><span>{p.dept} · {p.year} · {p.hostel}</span></div><Status tone={p.name === "Arun Kumar" && outside || p.status === "Overdue" ? "warning" : "success"}>{p.name === "Arun Kumar" ? (outside ? "Outside" : "Inside") : p.status}</Status></div>)}</div>;
  }
  function PeoplePage({ outsideOnly = false, departmentOnly = false }: { outsideOnly?: boolean; departmentOnly?: boolean }) {
    const people = PEOPLE.filter((p) => (!outsideOnly || (p.name === "Arun Kumar" && outside) || p.status === "Overdue") && (!departmentOnly || p.dept === "CSE"));
    const filtered = people.filter((p) => `${p.name} ${p.dept} ${p.hostel}`.toLowerCase().includes(search.toLowerCase()));
    const title = outsideOnly ? "Students outside" : departmentOnly ? "CSE movements" : "My mentees";
    return <><PageHead title={title} subtitle={outsideOnly ? "Live presence by hostel and expected return." : departmentOnly ? "Department-level movement activity." : "Students assigned to Dr. Meera Nair."} actions={<input className="hf-search" placeholder="Search students" value={search} onChange={(e) => setSearch(e.target.value)} />} />
      <div className="hf-card hf-panel">{filtered.length ? <div className="hf-list">{filtered.map((p) => <div className="hf-list-item" key={p.name}><Avatar name={p.name} /><div className="hf-list-copy"><strong>{p.name}</strong><span>{p.dept} · {p.year} · {p.hostel}, Room {p.room}</span></div><Status tone={p.name === "Arun Kumar" && outside || p.status === "Overdue" ? "warning" : "success"}>{p.name === "Arun Kumar" ? outside ? "Outside" : "Inside" : p.status}</Status><Button small onClick={() => editItem(`${p.name} · ${p.dept} · ${p.hostel} ${p.room}`)}>Details</Button></div>)}</div> : <Empty title="No matching students" body="Try a different name or department." />}</div></>;
  }
  function WardenPeople() { return <PeoplePage outsideOnly />; }
  function OverduePage() {
    return <><PageHead title="Overdue returns" subtitle="Students past their expected return time." actions={<Button onClick={() => setToast("Overdue summary exported to CSV.")}><Download /> Export list</Button>} />
      <div className="hf-banner" style={{ marginBottom: 14, color: "#a16207", background: "rgba(245,158,11,.12)" }}><AlertTriangle /> 7 students are overdue across campus. 2 require immediate follow-up.</div><div className="hf-card hf-panel"><div className="hf-list">{[{ name: "Rahul K", dept: "Mechanical · III Year", dest: "City Hospital", expected: "7:30 PM", current: "8:15 PM", hostel: "Hostel A" }, { name: "Nithya R", dept: "ECE · II Year", dest: "Town", expected: "7:00 PM", current: "7:36 PM", hostel: "Hostel B" }, { name: "Sanjay P", dept: "IT · IV Year", dest: "Market", expected: "6:45 PM", current: "7:09 PM", hostel: "Hostel C" }].map((x) => <div className="hf-list-item" key={x.name}><Avatar name={x.name} /><div className="hf-list-copy"><strong>{x.name} <Status tone="danger">Overdue</Status></strong><span>{x.dept} · {x.hostel} · {x.dest}</span></div><div className="hf-muted hf-sm">Expected {x.expected}<br /><b style={{ color: "var(--red)" }}>Now {x.current}</b></div><Button small onClick={() => setToast(`Follow-up reminder sent for ${x.name}.`)}>Notify</Button></div>)}</div></div></>;
  }
  function LivePage() {
    return <><PageHead title="Live hostel operations" subtitle="A real-time view of campus movement and gate events." actions={<span className="hf-live-pulse">LIVE · UPDATED NOW</span>} />
      <div className="hf-grid hf-stats"><Stat label="Outside" value={outside ? 125 : 124} note="Verified exits" icon={ArrowRight} tone="amber" /><Stat label="Inside" value="1,876" note="Current hostel presence" icon={Home} tone="green" /><Stat label="Overdue" value="7" note="Return expected has passed" icon={AlertTriangle} tone="red" /><Stat label="Emergency" value="3" note="Active urgent movements" icon={Zap} tone="red" /></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1.05fr .95fr" }}><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Movement board</h2><div className="hf-row"><Status tone="success">Live</Status><select className="hf-select" style={{ width: 130, padding: 8 }} value={liveHostel} onChange={(e) => setLiveHostel(e.target.value)}><option>All hostels</option><option>Hostel A</option><option>Hostel B</option><option>Hostel C</option></select></div></div><div className="hf-filterbar">{["All", "Inside", "Outside", "Return due", "Overdue", "Emergency"].map((f) => <button key={f} onClick={() => setFilter(f)} className={`hf-pill ${filter === f ? "selected" : ""}`}>{f}</button>)}</div><PeopleMini people={PEOPLE.filter((p) => (liveHostel === "All hostels" || p.hostel === liveHostel) && (filter === "All" || (filter === "Outside" && p.name === "Arun Kumar" && outside) || (filter === "Overdue" && p.status === "Overdue") || (filter === "Inside" && p.name !== "Rahul K")))} /></div>
        <div className="hf-card hf-panel"><div className="hf-section-title"><h2>Live activity feed</h2><span>GATE EVENTS</span></div><GateEventList limit={5} /></div></div>
    </>;
  }
  function AdminDashboard() {
    return <><PageHead title="Institution overview" subtitle="HostelFlow · campus movement and security command center" actions={<span className="hf-live-pulse">SYSTEM OPERATIONAL</span>} />
      <div className="hf-grid hf-stats five"><Stat label="Total students" value="2,000" note="6 departments" icon={GraduationCap} /><Stat label="Currently outside" value={outside ? "125" : "124"} note="+12 in last hour" icon={ArrowRight} tone="amber" /><Stat label="Pending approvals" value={movement?.status === "pending" ? 19 : 18} note="Across campus" icon={Clock3} /><Stat label="Overdue" value="7" note="2 need follow-up" icon={AlertTriangle} tone="red" /><Stat label="Today’s movements" value="342" note="241 exits · 101 returns" icon={Activity} tone="green" /></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "1.2fr .8fr" }}><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Movement trends</h2><select className="hf-select" style={{ width: 132, padding: 8 }} value={reportRange} onChange={(e) => setReportRange(e.target.value)}><option>Last 7 days</option><option>Last 30 days</option></select></div><div className="hf-between hf-sm"><span className="hf-muted">Verified gate events</span><strong>2,184 this week</strong></div><div className="hf-bar-chart">{[58, 77, 50, 90, 69, 82, 100].map((v, i) => <div className="hf-bar-col" key={i}><div className={`hf-bar ${i === 6 ? "dark" : ""}`} style={{ height: `${v}%` }} /><span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span></div>)}</div></div>
        <div className="hf-card hf-panel"><div className="hf-section-title"><h2>Department distribution</h2><Button small onClick={() => go("reports")}>Full reports</Button></div>{[["CSE", "620", 84], ["ECE", "410", 64], ["Mechanical", "356", 58], ["IT", "284", 48], ["EEE + Civil", "330", 54]].map(([x, v, p]) => <div key={x} style={{ margin: "17px 0" }}><div className="hf-between hf-sm"><strong>{x}</strong><span className="hf-muted">{v} students</span></div><div style={{ height: 6, borderRadius: 9, background: "var(--surface-2)", marginTop: 8 }}><div style={{ width: `${p}%`, height: "100%", background: "var(--blue)", borderRadius: 9 }} /></div></div>)}</div></div>
      <div className="hf-section hf-card hf-panel"><div className="hf-section-title"><h2>Command center</h2><span>ADMINISTRATION</span></div><div className="hf-row" style={{ flexWrap: "wrap" }}>{["Live operations", "Users & students", "Hostels", "Gates", "Devices", "Movement policies", "Approval workflow", "Audit logs"].map((x, i) => <Button key={x} onClick={() => go(["live", "users", "hostels", "gates", "devices", "policies", "workflow", "audit"][i])}>{x} <ChevronRight /></Button>)}</div></div>
    </>;
  }
  function ReportsPage() {
    return <><PageHead title="Reports & analytics" subtitle="Operational snapshots across movement, gates and hostels." actions={<div className="hf-row"><Button onClick={() => setToast("CSV export is ready · 342 movement rows.")}><Download /> Export CSV</Button><Button onClick={() => setToast("Excel report prepared for this demo.")}>Export Excel</Button><Button onClick={() => setToast("PDF report prepared for this demo.")}>Export PDF</Button></div>} />
      <div className="hf-filterbar"><select className="hf-select" style={{ width: 140 }} value={reportRange} onChange={(e) => setReportRange(e.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This month</option></select><select className="hf-select" style={{ width: 140 }} value={reportDepartment} onChange={(e) => setReportDepartment(e.target.value)}><option>All departments</option>{["CSE", "ECE", "EEE", "Mechanical", "Civil", "IT"].map((x) => <option key={x}>{x}</option>)}</select><select className="hf-select" style={{ width: 140 }} value={reportHostel} onChange={(e) => setReportHostel(e.target.value)}><option>All hostels</option><option>Hostel A</option><option>Hostel B</option><option>Hostel C</option></select><select className="hf-select" style={{ width: 170 }} value={reportType} onChange={(e) => setReportType(e.target.value)}><option>All movement types</option>{moveTypes.map((x) => <option key={x.type}>{x.type}</option>)}</select><select className="hf-select" style={{ width: 125 }} value={reportGate} onChange={(e) => setReportGate(e.target.value)}><option>All gates</option><option>Main Gate</option><option>Hostel A Gate</option><option>Hostel B Gate</option></select></div>
      <div className="hf-muted hf-sm" style={{ margin: "-3px 0 13px" }}>Showing {reportRange.toLowerCase()} · {reportDepartment} · {reportHostel} · {reportType} · {reportGate}</div>
      <div className="hf-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>{[["Daily movement", "342 movements today", "Movement Trends"], ["Weekly movement", "2,184 gate events", "Exit vs Return"], ["Monthly movement", "8,641 total", "Late Return Trend"], ["Late returns", "7 currently overdue", "Return patterns"], ["Gate activity", "241 exits · 101 returns", "Gate performance"], ["Department statistics", "6 departments", "Department Distribution"], ["Hostel statistics", "3 hostels · 1,876 inside", "Hostel Distribution"]].map(([title, stat, chart], i) => <div className="hf-card hf-panel" key={title}><div className="hf-between"><span className="hf-stat-icon"><FileBarChart2 /></span><button className="hf-icon-btn" onClick={() => editItem(title)}><MoreHorizontal /></button></div><h2 style={{ fontSize: 16, margin: "15px 0 5px" }}>{title}</h2><span className="hf-muted hf-sm">{stat}</span><div style={{ marginTop: 16, height: 44, display: "flex", alignItems: "end", gap: 5 }}>{[30, 50, 37, 70, 58, 90, 61, 76, 50].map((x, n) => <i key={n} style={{ height: `${x}%`, flex: 1, background: i === 3 ? "#fbbf24" : "#93c5fd", borderRadius: "4px 4px 0 0" }} />)}</div><div className="hf-muted hf-sm" style={{ marginTop: 8 }}>{chart} · {reportRange}</div></div>)}</div>
    </>;
  }
  function HostelsPage() {
    const hostels = [{ name: "Hostel A", cap: 500, occupied: 482, blocks: ["A Block · 194 / 200", "B Block · 288 / 300"] }, { name: "Hostel B", cap: 620, occupied: 594, blocks: ["A Block · 301 / 315", "B Block · 293 / 305"] }, { name: "Hostel C", cap: 420, occupied: 389, blocks: ["A Block · 185 / 200", "B Block · 204 / 220"] }, ...extraRows.map((x) => ({ name: x, cap: 300, occupied: 0, blocks: ["New block · 0 / 300"] }))];
    return <><PageHead title="Hostel management" subtitle="Hostels, blocks and room occupancy across campus." actions={<Button variant="primary" onClick={() => makeItem("New hostel")}><Plus /> Add hostel</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>{hostels.map((x) => <div className="hf-card hf-panel" key={x.name}><div className="hf-between"><span className="hf-stat-icon"><Building2 /></span><button className="hf-icon-btn" onClick={() => editItem(x.name)}><MoreHorizontal /></button></div><h2 style={{ fontSize: 19, margin: "15px 0 5px" }}>{x.name}</h2><div className="hf-muted hf-sm">Residence operations</div><div className="hf-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", margin: "18px 0" }}><div><div className="hf-muted hf-sm">Capacity</div><strong>{x.cap}</strong></div><div><div className="hf-muted hf-sm">Occupied</div><strong>{x.occupied}</strong></div><div><div className="hf-muted hf-sm">Available</div><strong>{x.cap - x.occupied}</strong></div></div><div className="hf-list">{x.blocks.map((b) => <div key={b} className="hf-between hf-sm" style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }}><span>{b.split(" · ")[0]}</span><span className="hf-muted">{b.split(" · ")[1]} beds</span></div>)}</div><Button small onClick={() => editItem(`${x.name} blocks, rooms and beds`)}>Manage rooms <ChevronRight /></Button></div>)}</div>
    </>;
  }
  function GatesPage() {
    const gates = [{ name: "Main Gate", location: "East entrance", sec: "SEC-012", bio: "BIO-001", online: true }, { name: "Hostel A Gate", location: "Hostel A · North", sec: "SEC-018", bio: "BIO-004", online: true }, { name: "Hostel B Gate", location: "Hostel B · South", sec: "SEC-021", bio: "BIO-008", online: false }, ...extraRows.map((x) => ({ name: x, location: "Campus entrance", sec: "SEC-NEW", bio: "BIO-NEW", online: true }))];
    return <><PageHead title="Gates" subtitle="Gate locations, assigned devices and connection health." actions={<Button variant="primary" onClick={() => makeItem("New gate")}><Plus /> Add gate</Button>} />
      <div className="hf-card hf-panel"><div className="hf-table-wrap"><table className="hf-table"><thead><tr><th>Gate name</th><th>Location</th><th>Security device</th><th>Biometric device</th><th>Status</th><th>Last heartbeat</th><th /></tr></thead><tbody>{gates.map((g) => <tr key={g.name}><td><strong>{g.name}</strong></td><td>{g.location}</td><td>{g.sec}</td><td>{g.bio}</td><td><Status tone={g.online ? "success" : "danger"}>{g.online ? "Online" : "Offline"}</Status></td><td>{g.online ? "12 sec ago" : "8 min ago"}</td><td><button className="hf-icon-btn" onClick={() => editItem(g.name)}><MoreHorizontal /></button></td></tr>)}</tbody></table></div></div>
      <div className="hf-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 15 }}>{gates.map((g) => <div className="hf-card hf-panel" key={`${g.name}-card`}><div className="hf-between"><strong>{g.name}</strong><Status tone={g.online ? "success" : "danger"}>{g.online ? "Online" : "Offline"}</Status></div><div className="hf-muted hf-sm" style={{ marginTop: 9 }}>{g.location} · {g.sec} · {g.bio}</div><Button small style={{ marginTop: 13 }} onClick={() => editItem(`${g.name} device assignment`)}>Configure</Button></div>)}</div>
    </>;
  }
  function DevicesPage() {
    const data: [string, string, string, boolean, string][] = [["Main Gate Biometric", "BIO-001", "Biometric", true, "12 seconds ago"], ["Main Gate Security Terminal", "SEC-012", "Security", true, "12 seconds ago"], ["Hostel A Biometric", "BIO-004", "Biometric", true, "25 seconds ago"], ["Hostel B Biometric", "BIO-008", "Biometric", false, "8 minutes ago"]];
    const runCheck = () => { setHealthChecking(true); window.setTimeout(() => { setHealthChecking(false); setToast("Health check completed · 3 online, 1 offline."); }, 950); };
    return <><PageHead title="Device health" subtitle="Biometric readers and gate security terminals." actions={<Button onClick={runCheck} disabled={healthChecking}><Activity /> {healthChecking ? "Checking devices…" : "Run health check"}</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>{healthChecking ? data.map(([, id]) => <div className="hf-card hf-panel" key={id}><div className="hf-row"><div className="hf-skeleton" style={{ width: 38, height: 38, borderRadius: 11 }} /><div style={{ flex: 1 }}><div className="hf-skeleton" style={{ width: "58%" }} /><div className="hf-skeleton" style={{ width: "34%", marginTop: 9 }} /></div></div><div className="hf-skeleton" style={{ width: "70%", marginTop: 25 }} /></div>) : data.map(([name, id, type, online, seen]) => <div className="hf-card hf-panel" key={id}><div className="hf-between"><div className="hf-row"><span className="hf-stat-icon"><Fingerprint /></span><div><strong>{name}</strong><div className="hf-muted hf-sm">{type} · {id}</div></div></div><Status tone={online ? "success" : "danger"}>{online ? "Online" : "Offline"}</Status></div><div className="hf-between hf-sm" style={{ marginTop: 18 }}><span className="hf-muted">Last heartbeat</span><strong>{seen}</strong></div><div className="hf-row" style={{ marginTop: 15 }}><Button small onClick={() => editItem(`${name} settings`)}>Device details</Button>{!online && <Button small variant="primary" onClick={() => setToast(`${name} is reconnecting in demo state.`)}>Retry connection</Button>}</div></div>)}</div>
      {!healthChecking && <div className="hf-banner" style={{ marginTop: 15, color: "#a16207", background: "rgba(245,158,11,.12)" }}><AlertTriangle /> Hostel B Gate biometric has been offline for 8 minutes. Gate verification is unavailable there.</div>}
    </>;
  }
  function UsersPage() {
    const list = [...PEOPLE, ...extraRows.map((name) => ({ name, initials: initials(name), dept: "CSE", year: "I Year", hostel: "Hostel C", room: "—", status: "Inside" }))];
    const shown = list.filter((p) => `${p.name} ${p.dept} ${p.hostel}`.toLowerCase().includes(search.toLowerCase()));
    return <><PageHead title="Users & students" subtitle="Institutional identities, access roles and student records." actions={<Button variant="primary" onClick={() => makeItem("New student")}><Plus /> Add user</Button>} />
      <div className="hf-filterbar"><input className="hf-search" placeholder="Search name, department, hostel" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="hf-select" style={{ width: 150 }} value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}><option>All roles</option>{ROLES.map((x) => <option key={x}>{x}</option>)}</select><select className="hf-select" style={{ width: 160 }} value={userDepartmentFilter} onChange={(e) => setUserDepartmentFilter(e.target.value)}><option>All departments</option>{["CSE", "ECE", "EEE", "Mechanical", "Civil", "IT"].map((x) => <option key={x}>{x}</option>)}</select></div>
      <div className="hf-card hf-panel"><div className="hf-table-wrap"><table className="hf-table"><thead><tr><th>Student</th><th>Register number</th><th>Department</th><th>Hostel / room</th><th>Mentor</th><th>Status</th><th>Actions</th></tr></thead><tbody>{shown.filter((p) => (userDepartmentFilter === "All departments" || p.dept === userDepartmentFilter) && (userRoleFilter === "All roles" || userRoleFilter === "Student")).map((p, i) => <tr key={p.name}><td><div className="hf-row"><Avatar name={p.name} small /><strong>{p.name}</strong></div></td><td>21{p.dept.slice(0, 2).toUpperCase()}{104 + i}</td><td>{p.dept} · {p.year}</td><td>{p.hostel} · {p.room}</td><td>{p.name === "Arun Kumar" ? "Dr. Meera Nair" : "Faculty mentor"}</td><td><Status tone={p.name === "Rahul K" ? "warning" : "success"}>{p.status}</Status></td><td><button className="hf-btn small" onClick={() => editItem(`${p.name} student record`)}>Edit</button></td></tr>)}</tbody></table></div>{!shown.length && <Empty title="No users found" body="Try a different search." />}</div>
    </>;
  }
  function PoliciesPage() {
    const policies = [["Short Outing", "Auto / warden demo approval", "4 hours", "60 seconds"], ["Local Permission", "Deputy Warden", "8 hours", "60 seconds"], ["Outstation Leave", "Mentor → HOD → Warden", "Per dates", "60 seconds"], ["Emergency", "Emergency Warden", "As required", "60 seconds"]];
    return <><PageHead title="Movement policies" subtitle="Configure approval requirements, duration limits and QR validity." actions={<Button variant="primary" onClick={() => makeItem("Movement policy")}><Plus /> Add policy</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>{policies.map(([name, approval, duration, expiry]) => <div className="hf-card hf-panel" key={name}><div className="hf-between"><div><div className="hf-eyebrow">MOVEMENT POLICY</div><h2 style={{ fontSize: 18, margin: 0 }}>{name}</h2></div><button className="hf-icon-btn" onClick={() => editItem(`${name} policy`)}><Settings /></button></div><div className="hf-divider" /><div className="hf-between hf-sm"><span className="hf-muted">Approval</span><strong>{approval}</strong></div><div className="hf-between hf-sm" style={{ marginTop: 11 }}><span className="hf-muted">Maximum duration</span><strong>{duration}</strong></div><div className="hf-between hf-sm" style={{ marginTop: 11 }}><span className="hf-muted">QR expiry</span><strong>{expiry}</strong></div><Button small style={{ marginTop: 17 }} onClick={() => editItem(`${name} policy`)}>Edit policy</Button></div>)}</div>
    </>;
  }
  function WorkflowPage() {
    const [selected, setSelected] = useState("Outstation Leave");
    return <><PageHead title="Approval workflow" subtitle="Create clear, auditable approval routes for every movement type." actions={<Button variant="primary" onClick={() => { setWorkflowSteps([...workflowSteps, "Deputy Warden"]); setToast("Approval step added."); }}><Plus /> Add step</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: ".65fr 1.35fr" }}><div className="hf-card hf-panel"><div className="hf-section-title"><h2>Movement types</h2></div>{moveTypes.map((x) => <button onClick={() => setSelected(x.type)} className={`hf-list-item ${selected === x.type ? "selected" : ""}`} key={x.type} style={{ border: 0, background: selected === x.type ? "var(--soft-blue)" : "transparent", width: "100%", borderRadius: 10, padding: 12, color: "inherit" }}><x.icon /><div className="hf-list-copy"><strong>{x.type}</strong><span>{selected === x.type ? "Workflow selected" : "Configure approvals"}</span></div><ChevronRight size={16} /></button>)}</div>
        <div className="hf-card hf-panel"><div className="hf-between"><div><div className="hf-eyebrow">WORKFLOW DESIGNER</div><h2 style={{ fontSize: 20, margin: 0 }}>{selected}</h2></div><Button small onClick={() => { setWorkflowSteps([...workflowSteps].reverse()); setToast("Approval steps reordered."); }}>Reorder steps <ArrowDownLeft /></Button></div>
          <div style={{ maxWidth: 390, margin: "25px auto" }}><div className="hf-card hf-panel" style={{ textAlign: "center", boxShadow: "none", background: "var(--surface-2)" }}><strong>Student submits request</strong></div>{workflowSteps.map((x, i) => <div key={`${x}${i}`} style={{ textAlign: "center" }}><div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 auto" }} /><div className="hf-card hf-panel hf-between" style={{ boxShadow: "none", padding: "12px 14px" }}><strong>{x}</strong><div className="hf-row"><button className="hf-icon-btn" onClick={() => editItem(`${x} approval step`)}><Settings /></button><button className="hf-icon-btn" onClick={() => { setWorkflowSteps(workflowSteps.filter((_, j) => j !== i)); setToast(`${x} step removed.`); }}><X /></button></div></div></div>)}<div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 auto" }} /><div className="hf-card hf-panel" style={{ textAlign: "center", boxShadow: "none", background: "rgba(22,163,74,.1)", color: "var(--green)" }}><strong>APPROVED · QR ACTIVATED</strong></div></div>
          <Button onClick={() => { setWorkflowSteps([...workflowSteps, "Warden"]); setToast("Approval step added."); }}><Plus /> Add approval step</Button>
        </div></div>
    </>;
  }
  function NotificationPoliciesPage() {
    return <><PageHead title="Notification policies" subtitle="Manage who receives operational alerts and through which channels." actions={<Button variant="primary" onClick={() => makeItem("Notification rule")}><Plus /> Add rule</Button>} />
      <div className="hf-card hf-panel"><div className="hf-between"><div><div className="hf-eyebrow">EVENT POLICY</div><h2 style={{ fontSize: 19, margin: "0 0 5px" }}>EXIT_CONFIRMED</h2><span className="hf-muted hf-sm">When security records a verified student exit</span></div><Status tone="success">Active</Status></div>
        <div className="hf-divider" /><div className="hf-grid" style={{ gridTemplateColumns: "1fr 1fr" }}><div><div className="hf-eyebrow">RECIPIENTS</div>{["Parent", "Mentor", "HOD", "Warden", "Security", "Admin"].map((x) => <div className="hf-between" key={x} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}><span>{x}</span><button className={`hf-toggle ${switches[x] ? "on" : ""}`} onClick={() => setSwitches({ ...switches, [x]: !switches[x] })} aria-label={`Toggle ${x}`} /></div>)}</div><div><div className="hf-eyebrow">DELIVERY CHANNELS</div>{["Push", "SMS", "WhatsApp", "Email", "In-App"].map((x) => <div className="hf-between" key={x} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}><span>{x}</span><button className={`hf-toggle ${switches[x] ? "on" : ""}`} onClick={() => setSwitches({ ...switches, [x]: !switches[x] })} aria-label={`Toggle ${x}`} /></div>)}</div></div><Button variant="primary" style={{ marginTop: 18 }} onClick={() => setToast("Notification policy saved.")}>Save policy</Button>
      </div>
    </>;
  }
  function AuditPage() {
    const rows = [...gateEvents.map((e) => [e.time, "Security #12", "Security", e.action === "EXIT" ? "EXIT_CONFIRMED" : e.action === "RETURN" ? "RETURN_CONFIRMED" : "VERIFICATION_FAILED", e.student, e.gate, "BIO-001", e.action === "DENIED" ? "Failed" : "Success"]), ["5:39 PM", "Security #12", "Security", "BIOMETRIC_FAILED", "Rahul K", "Main Gate", "BIO-001", "Failed"], ["5:26 PM", "Warden #04", "Warden", "MOVEMENT_APPROVED", "Priya S", "—", "—", "Success"]];
    return <><PageHead title="Audit logs" subtitle="Time-stamped and attributable security actions." actions={<Button onClick={() => setToast("Audit log CSV exported.")}><Download /> Export log</Button>} />
      <div className="hf-filterbar"><input className="hf-search" placeholder="Search actor, student, action" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="hf-select" style={{ width: 140 }} value={auditStatusFilter} onChange={(e) => setAuditStatusFilter(e.target.value)}><option>All statuses</option><option>Success</option><option>Failed</option></select><select className="hf-select" style={{ width: 140 }} value={auditRoleFilter} onChange={(e) => setAuditRoleFilter(e.target.value)}><option>All roles</option>{ROLES.map((x) => <option key={x}>{x}</option>)}</select><Button small onClick={() => setToast("Audit events filtered to today.")}><CalendarDays /> Today</Button></div>
      <div className="hf-card hf-panel"><div className="hf-table-wrap"><table className="hf-table"><thead><tr>{["Time", "Actor", "Role", "Action", "Student", "Gate", "Device", "Status"].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.filter((r) => r.join(" ").toLowerCase().includes(search.toLowerCase()) && (auditStatusFilter === "All statuses" || r[7] === auditStatusFilter) && (auditRoleFilter === "All roles" || r[2] === auditRoleFilter)).map((r, i) => <tr key={`${r[0]}${i}`}>{r.map((v, j) => <td key={j}>{j === 7 ? <Status tone={v === "Success" ? "success" : "danger"}>{v}</Status> : v}</td>)}</tr>)}</tbody></table></div></div>
    </>;
  }
  function SettingsPage() {
    return <><PageHead title="Institution settings" subtitle="General campus, security and account preferences." actions={<Button variant="primary" onClick={() => setToast("Settings saved successfully.")}>Save settings</Button>} />
      <div className="hf-grid" style={{ gridTemplateColumns: "1fr 1fr" }}><div className="hf-card hf-panel"><div className="hf-eyebrow">INSTITUTION</div><h2 style={{ fontSize: 18 }}>Campus configuration</h2><div className="hf-grid" style={{ gridTemplateColumns: "1fr 1fr" }}><label className="hf-field">Institution name<input className="hf-input" defaultValue="Northfield Engineering College" /></label><label className="hf-field">Timezone<select className="hf-select"><option>Asia/Kolkata (IST)</option><option>UTC</option></select></label><label className="hf-field">Academic year<input className="hf-input" defaultValue="2025 – 2026" /></label><label className="hf-field">QR validity<select className="hf-select"><option>60 seconds</option><option>90 seconds</option></select></label></div></div><div className="hf-card hf-panel"><div className="hf-eyebrow">ACCESS & SECURITY</div><h2 style={{ fontSize: 18 }}>Platform controls</h2>{["Enforce biometric at all gates", "Require approval before QR activation", "Notify parent on exit and return", "Audit all administrator changes"].map((x) => <div className="hf-between" key={x} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 12 }}>{x}</span><button className={`hf-toggle ${switches[x] !== false ? "on" : ""}`} onClick={() => setSwitches({ ...switches, [x]: switches[x] === false })} /></div>)}</div></div>
    </>;
  }

  const renderWithRoleScope = renderPage();
  return <div className={`hf-root ${dark ? "dark" : ""}`} onClick={() => showMenu && setShowMenu(false)}>
    <div className="hf-shell">
      <aside className="hf-sidebar" onClick={(e) => e.stopPropagation()}>
        <Brand /><div className="hf-nav-label">{role === "Student" || role === "Parent" || role === "Security" ? `${role} workspace` : `${role} workspace`}</div>
        <nav className="hf-nav">{nav.map(({ label, icon: Icon, screen: target }) => <button key={target} className={screen === target ? "active" : ""} onClick={() => go(target)}><Icon />{label}{label === "Approvals" && movement?.status === "pending" && <span className="hf-nav-count">1</span>}</button>)}</nav>
        <div className="hf-sidebar-bottom"><div className="hf-secure-note"><ShieldCheck /><span>Movement verification is protected by approval + biometric identity checks.</span></div><div className="hf-user-chip"><Avatar name={roleLabel} small /><div><div className="hf-user-name">{roleLabel}</div><div className="hf-user-role">{role} · Demo workspace</div></div><button className="hf-icon-btn" style={{ marginLeft: "auto" }} onClick={() => { setScreen("login"); setRole("Student"); }} title="Sign out"><LogOut /></button></div></div>
      </aside>
      <main className="hf-main">
        <header className="hf-topbar" onClick={(e) => e.stopPropagation()}>
          <div className="hf-breadcrumb">HostelFlow <ChevronRight size={13} style={{ verticalAlign: "-2px", margin: "0 5px" }} /> {role} <ChevronRight size={13} style={{ verticalAlign: "-2px", margin: "0 5px" }} /> <strong style={{ color: "var(--ink)" }}>{pageName()}</strong></div>
          <div className="hf-top-actions">
            <button className="hf-icon-btn" title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
            <button className="hf-icon-btn" title="Notifications" onClick={() => go("notifications")}><Bell /></button>
            <select className="hf-role-select" value={role} onChange={(e) => enterRole(e.target.value as Role)} aria-label="Switch demo role">{ROLES.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
        </header>
        <div className="hf-content" key={`${role}-${screen}`}>{renderWithRoleScope}</div>
      </main>
    </div>
    {isMobileNav && <nav className="hf-mobile-tabs">{mobileTabs.map(({ label, screen: target, icon: Icon }) => <button className={screen === target ? "active" : ""} key={target} onClick={() => target === "scan" ? go("scan") : go(target)}><Icon /><span>{label}</span></button>)}</nav>}
    {toast && <div className="hf-toast">{toast}</div>}
    {modal && modal !== "help" && <Modal title={modal === "create" ? `Create ${modalText.toLowerCase()}` : `Edit ${modalText}`} subtitle="Changes are local to this interactive prototype." close={() => setModal(null)}>
      <div className="hf-grid" style={{ gap: 12 }}><label className="hf-field">Name / label<input className="hf-input" value={modalText} onChange={(e) => setModalText(e.target.value)} /></label><label className="hf-field">Status<select className="hf-select"><option>Active</option><option>Draft</option><option>Paused</option></select></label><label className="hf-field">Notes<textarea className="hf-textarea" defaultValue="Configured for campus demonstration." /></label></div>
      <div className="hf-row" style={{ justifyContent: "space-between", marginTop: 17 }}><Button variant="danger" onClick={() => { setModal(null); setToast(`${modalText} removed from this demo view.`); }}>Delete</Button><div className="hf-row"><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" onClick={() => { if (modal === "create") setExtraRows([...extraRows, modalText || "New record"]); setModal(null); setToast(`${modalText} saved successfully.`); }}>Save changes</Button></div></div>
    </Modal>}
  </div>;
}

export default HostelFlowPrototype;
