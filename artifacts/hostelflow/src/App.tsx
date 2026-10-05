import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Route, Switch, Router as WouterRouter, Link, Redirect, useLocation } from 'wouter';
import {
  Activity, AlertTriangle, ArrowDownLeft, ArrowRight, BadgeCheck, Bell, Building2, CalendarDays, Check, CheckCircle2,
  ChevronRight, Clock3, DoorOpen, FileBarChart2, FileClock, FileText, Fingerprint, Home,
  LayoutDashboard, ListChecks, LogOut, Radio, ScanLine, Settings2, Shield, ShieldCheck, Users, X,
} from 'lucide-react';
import {
  AccountStatus, DecisionInputDecision, GateVerificationInputAction, MovementStatus, MovementType, Role,
  useCreateMovement, useDecideMovement, useGetCurrentUser, useGetDashboard, useGetMovement, useGetReports,
  useHealthCheck, useLinkUser, useListAuditLogs, useListDevices, useListGates, useListHostels, useListMovements,
  useListNotifications, useListPolicies, useListUsers, useMarkNotificationRead, useRefreshMovementQr, useUpdateCurrentUser,
  useUpdateDevice, useUpdateGate, useUpdatePolicy, useUpdateUser, useVerifyMovement,
  getGetCurrentUserQueryKey, getGetDashboardQueryKey, getGetMovementQueryKey, getGetReportsQueryKey, getHealthCheckQueryKey,
  getListAuditLogsQueryKey, getListDevicesQueryKey, getListGatesQueryKey, getListHostelsQueryKey,
  getListMovementsQueryKey, getListNotificationsQueryKey, getListPoliciesQueryKey, getListUsersQueryKey,
} from '@workspace/api-client-react';
import type { Movement, MovementType as MovementTypeValue, Role as RoleValue } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const clerkAppearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#28634f', colorForeground: '#25322e', colorMutedForeground: '#737b76', colorDanger: '#a9443e', colorBackground: '#fbfaf6', colorInput: '#fffefa', colorInputForeground: '#25322e', colorNeutral: '#dedbd2', fontFamily: 'DM Sans', borderRadius: '0.7rem' },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fbfaf6] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#25322e] font-semibold', headerSubtitle: 'text-[#737b76]', socialButtonsBlockButtonText: 'text-[#25322e]',
    formFieldLabel: 'text-[#25322e]', footerActionLink: 'text-[#28634f]', footerActionText: 'text-[#737b76]',
    dividerText: 'text-[#737b76]', identityPreviewEditButton: 'text-[#28634f]', formFieldSuccessText: 'text-[#28634f]',
    alertText: 'text-[#a9443e]', logoBox: 'rounded-xl', logoImage: 'max-h-10', socialButtonsBlockButton: 'border-[#dedbd2]',
    formButtonPrimary: 'bg-[#28634f] hover:bg-[#204f3f]', formFieldInput: 'border-[#dedbd2] bg-[#fffefa] text-[#25322e]',
    footerAction: 'text-[#737b76]', dividerLine: 'bg-[#dedbd2]', alert: 'border-[#a9443e]',
    otpCodeFieldInput: 'border-[#dedbd2]', formFieldRow: 'gap-2', main: 'gap-4',
  },
};
function stripBase(path: string) { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
const fmt = (value?: string | null) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const shortDate = (value?: string | null) => value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—';
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || 'HF';
const titleCase = (s: string) => s.replace(/([A-Z])/g, ' $1');

const mainNav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['Student','Parent','Security','Mentor','HOD','Warden','Admin'] },
  { label: 'Movements', href: '/movements', icon: FileText, roles: ['Student','Parent','Security','Mentor','HOD','Warden','Admin'] },
  { label: 'New request', href: '/movements/new', icon: ArrowDownLeft, roles: ['Student'] },
  { label: 'Approvals', href: '/approvals', icon: ListChecks, roles: ['Mentor','HOD','Warden','Admin'] },
  { label: 'Gate desk', href: '/gate', icon: ScanLine, roles: ['Security','Warden','Admin'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['Student','Parent','Security','Mentor','HOD','Warden','Admin'] },
  { label: 'Users & links', href: '/users', icon: Users, roles: ['Admin'] },
  { label: 'Operations', href: '/operations', icon: Radio, roles: ['Warden','Admin'] },
  { label: 'Policies', href: '/policies', icon: Shield, roles: ['Admin'] },
  { label: 'Reports', href: '/reports', icon: FileBarChart2, roles: ['HOD','Warden','Admin'] },
  { label: 'Audit log', href: '/audit', icon: FileClock, roles: ['Admin'] },
  { label: 'Profile', href: '/profile', icon: Settings2, roles: ['Student','Parent','Security','Mentor','HOD','Warden','Admin'] },
];

function Brand({ light = false }: { light?: boolean }) {
  return <div className="brand"><span className="brand-mark"><ShieldCheck /></span><span><strong className="brand-word">HostelFlow</strong><span className="brand-tag" style={light ? { color: '#adbbb4' } : undefined}>AEC · campus movement</span></span></div>;
}
function Button({ children, onClick, href, variant = '', type = 'button', disabled, className = '' }: { children: ReactNode; onClick?: () => void; href?: string; variant?: string; type?: 'button'|'submit'; disabled?: boolean; className?: string }) {
  if (href) return <Link href={href} className={`btn ${variant} ${className}`} data-testid={`link-${href.replaceAll('/','-')}`}>{children}</Link>;
  return <button className={`btn ${variant} ${className}`} type={type} onClick={onClick} disabled={disabled} data-testid="button-action">{children}</button>;
}
function PageHead({ title, sub, eyebrow = 'HOSTELFLOW · AEC', actions }: { title: string; sub?: string; eyebrow?: string; actions?: ReactNode }) {
  return <div className="head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{actions && <div className="head-actions">{actions}</div>}</div>;
}
function Empty({ title, body, icon: Icon = FileText, action }: { title: string; body: string; icon?: typeof FileText; action?: ReactNode }) {
  return <div className="empty"><div className="empty-mark"><Icon /></div><h3>{title}</h3><p>{body}</p>{action}</div>;
}
function QueryState({ loading, error, retry, children }: { loading: boolean; error: boolean; retry?: () => void; children: ReactNode }) {
  if (loading) return <div className="card loading"><div style={{ maxWidth: 270, margin: 'auto' }}><div className="eyebrow">Loading secure campus data</div><div className="card" style={{ height: 12, margin: '12px 0', background: 'hsl(var(--muted))' }} /><div className="card" style={{ height: 12, width: '72%', margin: '12px auto', background: 'hsl(var(--muted))' }} /></div></div>;
  if (error) return <div className="card error"><AlertTriangle size={20} style={{ display: 'block', margin: '0 auto 9px' }} />Data could not be loaded. Server permissions and availability remain authoritative.<br /><button className="btn" style={{ marginTop: 12 }} onClick={retry}>Retry</button></div>;
  return <>{children}</>;
}
function Status({ value }: { value: string }) { return <span className={`status ${value.toLowerCase().replaceAll(' ','_')}`}>{value}</span>; }

function Landing() {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  return <div className="hf landing">
    <header className="landing-nav"><Brand /><div className="top-actions"><Button href="/sign-in">Sign in <ArrowRight /></Button><Button href="/sign-up" variant="primary">Create account</Button></div></header>
    <main>
      <section className="landing-hero"><div><div className="eyebrow">A secure campus, in motion</div><h1>Movement, with a <em>clear chain.</em></h1><p>HostelFlow connects student leave requests, the people who approve them, parent visibility and gate checks in one accountable campus workflow.</p><div className="head-actions" style={{ marginTop: 23 }}><Button href="/sign-in" variant="primary">Open your portal <ArrowRight /></Button><Button href="/sign-up">Request access</Button></div></div><div className="landing-art"><div className="landing-seal"><ScanLine /></div><span className="landing-caption">AEC · Student movement & security</span></div></section>
      <div className="landing-band"><span>ONE CONTINUOUS RECORD</span><span>REQUEST → APPROVAL → GATE CHECK → RETURN</span><span>{health.isLoading ? 'Checking service…' : health.isError ? 'Service status unavailable' : 'Portal services ready'}</span></div>
      <section className="landing-section"><div className="eyebrow">One coordinated journey</div><h2>From the first request to a safe return.</h2><p style={{ maxWidth: 600, color: 'hsl(var(--muted-foreground))', fontSize: 13, lineHeight: 1.65 }}>A shared, role-scoped view keeps students, families, approvers and gate staff aligned—without putting operational controls in the wrong hands.</p>
        <div className="feature-grid">{[
          [FileText, 'A request with context', 'Students submit purpose, destination, reason and expected timings. The record travels through the institution’s configured approval path.'],
          [Users, 'Approvals with boundaries', 'Mentor, HOD and warden decisions stay attached to the request. Every role sees the work assigned to its access.'],
          [ScanLine, 'Gate checks, kept distinct', 'A QR identifies a movement. Simulated biometric matching and explicit gate confirmation are separate checks.'],
        ].map(([Icon, name, copy]: any) => <article className="feature" key={name}><Icon /><h3>{name}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section className="cta-band"><div><div className="eyebrow" style={{ color: '#d8c69f' }}>Institutional access</div><h2>Start with your AEC account.</h2></div><Button href="/sign-in" variant="primary">Sign in to HostelFlow <ArrowRight /></Button></section>
    </main><footer className="footer"><span>HostelFlow · AEC</span><span>Campus movement and security operations</span></footer>
  </div>;
}
function AuthPage({ kind }: { kind: 'in'|'up' }) {
  return <div className="hf auth-page"><aside className="auth-side"><Brand light /><div><div className="eyebrow" style={{ color: '#c4d0c8' }}>AEC · SECURE CAMPUS ACCESS</div><h1>{kind === 'in' ? 'The campus, in clear view.' : 'One campus. One accountable flow.'}</h1><p>HostelFlow keeps movement requests and decisions visible to the right people, at the right moment.</p></div><span style={{ color: '#afbbb4', fontSize: 10 }}>Protected institutional access</span></aside><main className="auth-form"><div style={{ width: 'min(440px,100%)' }}><Link href="/" className="btn ghost" style={{ marginBottom: 16 }}><ArrowDownLeft size={15} /> Back to HostelFlow</Link>{kind === 'in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></main></div>;
}
function AuthRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="hf"><div className="pending card loading">Loading public access…</div></div>;
  if (isSignedIn) return <Redirect to="/portal" />;
  return <Landing />;
}
function ClerkCacheClear() {
  const { addListener } = useClerk(); const qc = useQueryClient();
  useEffect(() => { let previous: string | null | undefined; const off = addListener(({ user }) => { const id = user?.id ?? null; if (previous !== undefined && id !== previous) qc.clear(); previous = id; }); return off; }, [addListener, qc]);
  return null;
}

function Workspace() {
  const [path, setPath] = useLocation();
  const { signOut } = useClerk();
  const qc = useQueryClient();
  const userQ = useGetCurrentUser();
  const user = userQ.data;
  const pathParts = path.split('?')[0].split('/').filter(Boolean);
  const route = pathParts[0] || 'dashboard';
  const moveId = route === 'movements' && pathParts[1] && pathParts[1] !== 'new' ? Number(pathParts[1]) : 0;
  const searchParams = new URLSearchParams(window.location.search);
  const search = searchParams.get('search') || '';
  const movementParams = useMemo(() => ({ search: search || undefined, limit: 100 }), [search]);
  const enable = (names: string[]) => names.includes(route);
  const dashQ = useGetDashboard({ query: { enabled: enable(['dashboard','portal']), queryKey: getGetDashboardQueryKey() } });
  const movementsQ = useListMovements(movementParams, { query: { enabled: enable(['movements','approvals','gate','dashboard']), queryKey: getListMovementsQueryKey(movementParams) } });
  const detailQ = useGetMovement(moveId, { query: { enabled: !!moveId, queryKey: getGetMovementQueryKey(moveId) } });
  const noticesQ = useListNotifications({ query: { enabled: enable(['notifications']), queryKey: getListNotificationsQueryKey() } });
  const usersQ = useListUsers(undefined, { query: { enabled: enable(['users','pending-access']), queryKey: getListUsersQueryKey() } });
  const hostelsQ = useListHostels({ query: { enabled: enable(['operations']), queryKey: getListHostelsQueryKey() } });
  const gatesQ = useListGates({ query: { enabled: enable(['operations','gate']), queryKey: getListGatesQueryKey() } });
  const devicesQ = useListDevices({ query: { enabled: enable(['operations']), queryKey: getListDevicesQueryKey() } });
  const policiesQ = useListPolicies({ query: { enabled: enable(['policies']), queryKey: getListPoliciesQueryKey() } });
  const auditQ = useListAuditLogs({ limit: 100 }, { query: { enabled: enable(['audit']), queryKey: getListAuditLogsQueryKey({ limit: 100 }) } });
  const reportsQ = useGetReports({ query: { enabled: enable(['reports']), queryKey: getGetReportsQueryKey() } });
  const createMove = useCreateMovement(); const decideMove = useDecideMovement(); const refreshQr = useRefreshMovementQr(); const verifyMove = useVerifyMovement();
  const markRead = useMarkNotificationRead(); const updateUser = useUpdateUser(); const linkUser = useLinkUser();
  const updateMe = useUpdateCurrentUser(); const updateGate = useUpdateGate(); const updateDevice = useUpdateDevice(); const updatePolicy = useUpdatePolicy();
  const [qrToken, setQrToken] = useState(''); const [tokenCache, setTokenCache] = useState(''); const [bio, setBio] = useState(false); const [gateConfirm, setGateConfirm] = useState(false);
  const [gateId, setGateId] = useState<number | ''>(''); const [action, setAction] = useState<'EXIT'|'RETURN'>('EXIT');
  const [feedback, setFeedback] = useState(''); const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ type: 'Short Outing' as MovementTypeValue, purpose: '', destination: '', reason: '', exitAt: '', expectedReturnAt: '', travelDetails: '' });
  const [profile, setProfile] = useState({ displayName: '', department: '', year: '', hostel: '', room: '', phone: '' });
  const [linkInput, setLinkInput] = useState({ userId: '', studentId: '', relationship: 'parent_of' });
  const [decisionNotes, setDecisionNotes] = useState<Record<number,string>>({});
  const role = user?.role;
  const routesForRole = mainNav.filter((item) => !!role && item.roles.includes(role));
  const retry = () => { void userQ.refetch(); };
  useEffect(() => { if (route === 'portal' && user) setPath(user.accountStatus === 'pending' ? '/pending-access' : '/dashboard'); }, [route,user?.id,user?.accountStatus,setPath]);
  useEffect(() => { if (user) setProfile({ displayName:user.displayName,department:user.department||'',year:user.year?.toString()||'',hostel:user.hostel||'',room:user.room||'',phone:user.phone||'' }); }, [user?.id]);
  useEffect(() => { if (route === 'gate' && gatesQ.data?.length && gateId === '') setGateId(gatesQ.data[0].id); }, [route,gatesQ.data,gateId]);
  if (userQ.isLoading) return <div className="hf"><div className="pending card loading">Checking institutional access…</div></div>;
  if (userQ.isError || !user) return <div className="hf"><div className="pending card"><Empty title="Could not confirm your account" body="HostelFlow uses your signed-in institutional profile to decide what you can access. Try again, or sign in again." action={<><Button onClick={retry}>Retry</Button><Button onClick={() => signOut({ redirectUrl: basePath || '/' })}>Sign out</Button></>} /></div></div>;
  if (user.accountStatus === 'pending' || route === 'pending-access') return <div className="hf"><div className="pending card"><Brand /><div className="eyebrow" style={{ marginTop: 24 }}>ACCOUNT STATUS</div><h1>Access assignment pending</h1><p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, lineHeight: 1.7 }}>Your account is registered, but an administrator has not assigned your HostelFlow role yet. Workspace access remains unavailable until the server profile changes.</p><div className="callout">Signed in as <strong>{user.displayName}</strong> · {user.email}<br />Institution: {user.institutionName}</div><Button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-5"><LogOut /> Sign out</Button></div></div>;
  const activePath = route === 'movements' && pathParts[1] && pathParts[1] !== 'new' ? `/movements/${pathParts[1]}` : `/${route}`;
  const invalidateMoves = () => { void qc.invalidateQueries({ queryKey: getListMovementsQueryKey(movementParams) }); void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); if (moveId) void qc.invalidateQueries({ queryKey: getGetMovementQueryKey(moveId) }); };
  const submitMovement = (e: FormEvent) => { e.preventDefault(); setFeedback(''); createMove.mutate({ data: { ...form, travelDetails: form.travelDetails || null, year: undefined } as any }, { onSuccess: (m) => { void qc.invalidateQueries({ queryKey:getListMovementsQueryKey(movementParams) }); setFeedback('Request submitted to the server.'); setPath(`/movements/${m.id}`); }, onError: () => setFeedback('Request was not submitted. Review the fields and try again.') }); };
  const headingFor = () => ({ dashboard:'Overview', movements:'Movements', approvals:'Approval queue', gate:'Gate desk', notifications:'Notifications', users:'Users & relationship links', operations:'Live operations', policies:'Movement policies', reports:'Reports', audit:'Audit log', profile:'My profile' } as Record<string,string>)[route] || 'HostelFlow';
  const fmtMovement = (m: Movement) => <tr key={m.id} data-testid={`row-movement-${m.id}`}><td><Link href={`/movements/${m.id}`} style={{ color:'hsl(var(--primary))',fontWeight:700 }}>{m.requestCode}</Link><div style={{ marginTop:4,color:'hsl(var(--muted-foreground))' }}>{m.studentName}</div></td><td>{m.type}</td><td>{m.destination}<div style={{ marginTop:4,color:'hsl(var(--muted-foreground))' }}>{m.purpose}</div></td><td>{fmt(m.exitAt)}</td><td>{fmt(m.expectedReturnAt)}</td><td><Status value={m.status} /></td><td><Link href={`/movements/${m.id}`} className="btn">Details <ChevronRight /></Link></td></tr>;
  const movementTable = (list: Movement[], loading = false, error = false) => <QueryState loading={loading} error={error} retry={() => void movementsQ.refetch()}><div className="card table-wrap"><table className="table"><thead><tr><th>Request / student</th><th>Type</th><th>Destination</th><th>Exit</th><th>Expected return</th><th>Status</th><th></th></tr></thead><tbody>{list.length ? list.map(fmtMovement) : <tr><td colSpan={7}><Empty title="No movements to show" body="No matching records are currently visible to this account." /></td></tr>}</tbody></table></div></QueryState>;
  const metric = (name: string, val: number | string, Icon: typeof Home, note = 'From role-scoped campus data') => <article className="card stat" key={name}><div className="stat-title">{name}<span className="stat-icon"><Icon /></span></div><div className="stat-val">{val}</div><div className="stat-note">{note}</div></article>;
  const renderDashboard = () => {
    const d = dashQ.data;
    const displayName = d?.user?.displayName || user.displayName;
    return <><PageHead title={`Welcome, ${displayName.split(' ')[0]}`} sub={`${user.institutionName}${user.department ? ` · ${user.department}` : ''}${user.hostel ? ` · ${user.hostel}` : ''}`} actions={role === 'Student' ? <Button href="/movements/new" variant="primary"><ArrowDownLeft /> Request movement</Button> : undefined} />
      <QueryState loading={dashQ.isLoading} error={dashQ.isError} retry={() => void dashQ.refetch()}>{d && <>
        <div className="grid stats">{metric('Pending approvals',d.pendingApprovals,ListChecks)}{metric('Pending requests',d.pendingRequests,Clock3)}{metric('Students outside',d.studentsOutside,ArrowRight)}{metric('Overdue returns',d.overdue,AlertTriangle)}</div>
        <div className="split"><section className="card panel"><div className="section-title"><h2>Recent campus activity</h2><span>{d.todayMovements} movement records today</span></div>{d.recentActivity.length ? d.recentActivity.map((item) => <div className="event" key={item.id}><span>{shortDate(item.createdAt)}</span><div><strong>{item.action}</strong><div style={{ color:'hsl(var(--muted-foreground))',marginTop:3 }}>{item.message} · {item.actorName}</div></div><Status value={item.outcome} /></div>) : <Empty title="No recent activity" body="Activity will appear here as the server records campus events." icon={Activity} />}</section>
          <section className="hero-card"><div className="eyebrow">YOUR WORKSPACE</div><h2>{role} view</h2><p>Data and actions on this page are scoped by your server-assigned role and permissions.</p><div style={{ position:'relative',zIndex:1,marginTop:20 }}><Button href={role === 'Security' ? '/gate' : role === 'Student' ? '/movements' : '/approvals'}>{role === 'Security' ? 'Open gate desk' : role === 'Student' ? 'View movements' : 'Review assigned approvals'} <ArrowRight /></Button></div></section></div>
      </>}</QueryState>
      <section style={{ marginTop:16 }}><div className="section-title"><h2>Movement activity</h2><Button href="/movements">All movements <ChevronRight /></Button></div>{movementTable(movementsQ.data || [],movementsQ.isLoading,movementsQ.isError)}</section>
    </>;
  };
  const renderMovements = () => {
    const list = movementsQ.data || [];
    const visible = filter ? list.filter((m) => m.status.toLowerCase() === filter.toLowerCase()) : list;
    return <><PageHead title="Movements" sub="Search and review the movement records visible to your account." actions={role === 'Student' ? <Button href="/movements/new" variant="primary"><ArrowDownLeft /> New request</Button> : undefined} />
      <div className="toolbar"><form onSubmit={(e)=>{e.preventDefault();const input=(e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;setPath(`/movements${input?`?search=${encodeURIComponent(input)}`:''}`)}}><input className="search" name="search" defaultValue={search} placeholder="Search request or destination" aria-label="Search movements" data-testid="input-movement-search" /></form><select className="search" style={{ maxWidth:180 }} value={filter} onChange={(e)=>setFilter(e.target.value)} aria-label="Filter movement status"><option value="">All statuses</option>{Object.values(MovementStatus).map((s)=><option key={s}>{s}</option>)}</select><Button onClick={()=>{setFilter('');setPath('/movements')}}>Clear filters</Button></div>{movementTable(visible,movementsQ.isLoading,movementsQ.isError)}</>;
  };
  const renderNew = () => <><PageHead title="Request movement" sub="Submit your request for review. Server policy determines the approval path." /><div className="card panel" style={{ maxWidth:850 }}><form onSubmit={submitMovement}><div className="form-grid">
    <label className="field">Movement type<select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value as MovementTypeValue})}>{Object.values(MovementType).map((v)=><option key={v}>{v}</option>)}</select></label>
    <label className="field">Purpose<input required minLength={2} maxLength={240} value={form.purpose} onChange={(e)=>setForm({...form,purpose:e.target.value})} placeholder="Reason for this movement" /></label>
    <label className="field">Destination<input required minLength={2} maxLength={240} value={form.destination} onChange={(e)=>setForm({...form,destination:e.target.value})} placeholder="Where are you going?" /></label>
    <label className="field">Exit time<input type="datetime-local" required value={form.exitAt} onChange={(e)=>setForm({...form,exitAt:new Date(e.target.value).toISOString()})} /></label>
    <label className="field">Expected return<input type="datetime-local" required value={form.expectedReturnAt} onChange={(e)=>setForm({...form,expectedReturnAt:new Date(e.target.value).toISOString()})} /></label>
    <label className="field" style={{ gridColumn:'1 / -1' }}>Reason<textarea required minLength={2} maxLength={1000} value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})} placeholder="Add context for the approvers" /></label>
    <label className="field" style={{ gridColumn:'1 / -1' }}>Travel details <span style={{ fontWeight:400 }}>(optional)</span><textarea maxLength={1000} value={form.travelDetails} onChange={(e)=>setForm({...form,travelDetails:e.target.value})} /></label>
    </div><div className="callout" style={{ marginTop:16 }}>Submitting creates a server record. Approval and pass availability depend on policy and assigned approvers.</div>{feedback && <p role="status" style={{ color:'hsl(var(--primary))',fontSize:12 }}>{feedback}</p>}<div style={{ marginTop:16 }}><Button type="submit" variant="primary" disabled={createMove.isPending}>{createMove.isPending?'Submitting…':'Submit request'} <ArrowRight /></Button></div></form></div></>;
  const renderDetail = () => {
    const m = detailQ.data;
    return <><PageHead title={m ? m.requestCode : 'Movement details'} sub="Approval decisions and movement history recorded by the server." actions={<Button href="/movements"><ArrowDownLeft /> Back to movements</Button>} />
      <QueryState loading={detailQ.isLoading} error={detailQ.isError} retry={()=>void detailQ.refetch()}>{m && <div className="split"><div className="card panel"><div className="section-title"><h2>{m.type}</h2><Status value={m.status} /></div><div className="grid form-grid">{[['Student',m.studentName],['Department / year',[m.department,m.year].filter(Boolean).join(' · ')||'—'],['Hostel / room',[m.hostel,m.room].filter(Boolean).join(' · ')||'—'],['Purpose',m.purpose],['Destination',m.destination],['Exit time',fmt(m.exitAt)],['Expected return',fmt(m.expectedReturnAt)],['Reason',m.reason],['Travel details',m.travelDetails||'—']].map(([k,v])=><div key={k as string}><div className="eyebrow">{k}</div><div style={{ fontSize:12,lineHeight:1.55 }}>{v}</div></div>)}</div>
        {m.status === 'Approved' && (role === 'Student') && <div className="callout" style={{ marginTop:16 }}>A QR token identifies this movement only. Identity matching and gate confirmation are separate checks performed at the gate desk.</div>}
        {m.status === 'Approved' && role === 'Student' && <div style={{ marginTop:12 }}><Button variant="primary" disabled={refreshQr.isPending} onClick={()=>refreshQr.mutate({id:m.id},{onSuccess:(token)=>{setTokenCache(token.token);setFeedback(`Simulated ${token.purpose} token issued · expires ${fmt(token.expiresAt)}.`)},onError:()=>setFeedback('A movement token could not be issued.')})}>{refreshQr.isPending?'Issuing…':'Issue simulated movement QR'} <ScanLine /></Button>{feedback&&<p role="status" style={{fontSize:11,marginTop:9}}>{feedback}</p>}{tokenCache&&<div className="callout" style={{marginTop:9,overflowWrap:'anywhere'}}>Simulated token · {tokenCache}</div>}</div>}
        </div>
      <section className="card panel"><div className="section-title"><h2>Approval trail</h2></div>{m.approvals.length ? <div className="timeline">{m.approvals.map((a)=><div className="timeline-item" key={a.id}><span className="timeline-dot">{a.status==='Approved'?<Check />:<Clock3 />}</span><div className="timeline-copy"><strong>{a.role} · {a.status}</strong><span>{a.reviewerName || 'Awaiting assigned reviewer'}{a.actedAt ? ` · ${fmt(a.actedAt)}`:''}</span>{a.comment && <span>{a.comment}</span>}</div></div>)}</div>:<Empty title="No approval entries" body="The server has not returned approval steps for this movement." />}</section></div>}</QueryState>
    </>;
  };
  const renderApprovals = () => {
    const pending = (movementsQ.data || []).filter((m)=>m.approvals.some((a)=>a.role===role && a.status==='Waiting'));
    return <><PageHead title="Approval queue" sub="Only requests assigned to your current role are actionable." /><QueryState loading={movementsQ.isLoading} error={movementsQ.isError} retry={()=>void movementsQ.refetch()}>{pending.length ? <div className="grid" style={{ gap:12 }}>{pending.map((m)=><article className="card panel" key={m.id}><div className="section-title"><div><h2>{m.studentName} · {m.type}</h2><span>{m.requestCode} · {m.destination}</span></div><Status value={m.status} /></div><p style={{ fontSize:11,color:'hsl(var(--muted-foreground))' }}>{m.purpose} · {fmt(m.exitAt)} – {fmt(m.expectedReturnAt)}</p><label className="field">Decision note<textarea value={decisionNotes[m.id]||''} onChange={(e)=>setDecisionNotes({...decisionNotes,[m.id]:e.target.value})} maxLength={1000} /></label><div className="head-actions" style={{ marginTop:12 }}><Button variant="primary" disabled={decideMove.isPending} onClick={()=>decideMove.mutate({id:m.id,data:{decision:DecisionInputDecision.approve,comment:decisionNotes[m.id]||null}},{onSuccess:()=>{invalidateMoves();setFeedback('Decision saved.');},onError:()=>setFeedback('Decision was not saved.')})}><Check /> Approve</Button><Button variant="danger" disabled={decideMove.isPending} onClick={()=>decideMove.mutate({id:m.id,data:{decision:DecisionInputDecision.reject,comment:decisionNotes[m.id]||null}},{onSuccess:invalidateMoves,onError:()=>setFeedback('Decision was not saved.')})}><X /> Reject</Button><Button href={`/movements/${m.id}`}>Details</Button></div></article>)}</div>:<div className="card"><Empty title="No assigned approvals" body="There are no waiting requests assigned to your role at this time." icon={BadgeCheck} />{feedback && <p>{feedback}</p>}</div>}</QueryState></>;
  };
  const renderGate = () => {
    const gates = gatesQ.data || [];
    const list = movementsQ.data || [];
    const available = list.filter((m)=>m.status==='Approved'||m.status==='Outside');
    const chosen = available.find((m)=>m.id===Number(searchParams.get('movementId')));
    return <><PageHead title="Gate desk" sub="Movement identification and gate checks are independent steps." actions={<span className="sim-tag">Simulation only · no hardware connection</span>} />
      <div className="callout" style={{ marginBottom:15 }}>A QR token identifies a movement only. It does not verify identity or record passage. Biometric match and explicit gate confirmation are separate simulated checks.</div>
      <div className="gate-stage"><div className="card panel"><div className="section-title"><h2>Movement lookup</h2><span className="sim-tag">Simulated QR</span></div><label className="field">Approved / outside movement<select value={chosen?.id || ''} onChange={(e)=>setPath(`/gate?movementId=${e.target.value}`)}><option value="">Choose from visible records</option>{available.map(m=><option key={m.id} value={m.id}>{m.requestCode} · {m.studentName} · {m.status}</option>)}</select></label><p className="eyebrow" style={{ marginTop:18 }}>OR ENTER ISSUED TOKEN</p><input className="search" style={{ maxWidth:'100%' }} value={qrToken} onChange={(e)=>setQrToken(e.target.value)} placeholder="Paste token provided by movement pass" aria-label="Movement QR token" /><label className="field" style={{ marginTop:14 }}>Gate<select value={gateId} onChange={(e)=>setGateId(Number(e.target.value))}><option value="">Choose a gate</option>{gates.map(g=><option key={g.id} value={g.id}>{g.name} · {g.location} · {g.status}</option>)}</select></label><label className="field" style={{ marginTop:14 }}>Direction<select value={action} onChange={(e)=>setAction(e.target.value as 'EXIT'|'RETURN')}><option value="EXIT">Exit</option><option value="RETURN">Return</option></select></label><div style={{ marginTop:14 }}><Button variant="primary" disabled={!chosen && !qrToken} onClick={()=>{setTokenCache(qrToken);setBio(false);setGateConfirm(false);if(chosen) setPath(`/gate?movementId=${chosen.id}`);setFeedback(chosen ? `Movement ${chosen.requestCode} identified. Continue with separate checks.`:'Token entered. Movement lookup will be validated when checks are submitted.')}}><ScanLine /> Identify movement</Button></div>
        </div><div className="gate-demo"><span className="sim-tag">All checks simulated</span><h2>Gate verification</h2><div className="check-row"><span>1 · QR token identifies movement</span>{tokenCache ? <Status value="Identified" /> : <Status value="Waiting" />}</div><div className="check-row"><span>2 · Biometric match</span><button className={`btn ${bio?'primary':''}`} onClick={()=>setBio(!bio)} disabled={!tokenCache && !chosen}><Fingerprint /> {bio?'Matched (simulated)':'Simulate match'}</button></div><div className="check-row"><span>3 · Confirm gate action</span><button className={`btn ${gateConfirm?'primary':''}`} onClick={()=>setGateConfirm(!gateConfirm)} disabled={!bio}><CheckCircle2 /> {gateConfirm?'Confirmed':'Confirm separately'}</button></div><div className="callout" style={{ marginTop:15,background:'#ffffff12',color:'#e6e7dd' }}>QR, biometric, and gate confirmation each represent distinct checks. No physical device is connected.</div><Button variant="primary" className="mt-4" disabled={!bio||!gateConfirm||!gateId||(!tokenCache&&!chosen)||verifyMove.isPending} onClick={()=>{const movementId=chosen?.id; if(!movementId){setFeedback('To verify, choose a movement record. Tokens identify records; this simulation does not infer a movement ID from typed text.');return;} verifyMove.mutate({id:movementId,data:{token:tokenCache||'pending-token-value',action:action as GateVerificationInputAction,gateId:Number(gateId),simulatedBiometricMatch:true,confirmGateAction:true}},{onSuccess:(r)=>{setFeedback(`${r.result}: ${r.reason}`);invalidateMoves();setTokenCache('');setQrToken('');setBio(false);setGateConfirm(false)},onError:()=>setFeedback('Gate verification was not accepted by the server.')})}}><Check /> {verifyMove.isPending?'Checking…':'Submit simulated gate check'}</Button>{feedback && <p role="status" style={{ fontSize:11,marginTop:12 }}>{feedback}</p>}</div></div>
      <section style={{ marginTop:16 }}><div className="section-title"><h2>Visible movement records</h2><Button onClick={()=>void movementsQ.refetch()}>Refresh</Button></div>{movementTable(available,movementsQ.isLoading,movementsQ.isError)}</section>
    </>;
  };
  const renderNotifications = () => {
    const notices = noticesQ.data || [];
    return <><PageHead title="Notifications" sub="Alerts returned for your signed-in account." /><QueryState loading={noticesQ.isLoading} error={noticesQ.isError} retry={()=>void noticesQ.refetch()}><div className="card panel">{notices.length ? notices.map((n)=><article className={`notice ${!n.read?'unread':''}`} key={n.id}><div className="stat-icon"><Bell /></div><div style={{ flex:1 }}><strong>{n.title}</strong><p>{n.body}</p><span style={{ fontSize:9,color:'hsl(var(--muted-foreground))' }}>{n.category} · {fmt(n.createdAt)}</span>{n.movementId && <div style={{ marginTop:7 }}><Button href={`/movements/${n.movementId}`}>View movement</Button></div>}</div>{!n.read && <Button onClick={()=>markRead.mutate({id:n.id},{onSuccess:()=>void qc.invalidateQueries({queryKey:getListNotificationsQueryKey()})})} disabled={markRead.isPending}>Mark read</Button>}</article>):<Empty title="You’re all caught up" body="Notifications will appear here when the server sends them." icon={CheckCircle2} />}</div></QueryState></>;
  };
  const renderUsers = () => {
    const rows=usersQ.data||[];
    return <><PageHead title="Users & relationship links" sub="Assign institutional roles and connect parent or mentor accounts. Server rules remain authoritative." />
      <div className="split"><section className="card panel"><div className="section-title"><h2>Accounts</h2></div><QueryState loading={usersQ.isLoading} error={usersQ.isError} retry={()=>void usersQ.refetch()}>{rows.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Person</th><th>Role</th><th>Account</th><th>Role assignment</th></tr></thead><tbody>{rows.map(u=><tr key={u.id}><td><strong>{u.displayName}</strong><div>{u.email}</div></td><td>{u.role}</td><td><Status value={u.accountStatus}/></td><td><div className="grid" style={{ gap:6 }}><select className="search" aria-label={`Role for ${u.displayName}`} id={`role-${u.id}`} defaultValue={u.role}>{Object.values(Role).map(r=><option key={r}>{r}</option>)}</select><select className="search" aria-label={`Status for ${u.displayName}`} id={`status-${u.id}`} defaultValue={u.accountStatus}>{Object.values(AccountStatus).map(s=><option key={s}>{s}</option>)}</select><Button onClick={()=>{const role=(document.getElementById(`role-${u.id}`) as HTMLSelectElement).value as RoleValue;const accountStatus=(document.getElementById(`status-${u.id}`) as HTMLSelectElement).value as any;updateUser.mutate({id:u.id,data:{role,accountStatus}},{onSuccess:()=>void qc.invalidateQueries({queryKey:getListUsersQueryKey()}),onError:()=>setFeedback('User update was not accepted.')})}}>Save</Button></div></td></tr>)}</tbody></table></div>:<Empty title="No accounts returned" body="No user records are currently visible." />}</QueryState></section>
      <section className="card panel"><div className="section-title"><h2>Link an account</h2></div><form onSubmit={(e)=>{e.preventDefault();const uid=Number(linkInput.userId);const sid=Number(linkInput.studentId);linkUser.mutate({id:uid,data:{studentId:sid,relationship:linkInput.relationship as any}},{onSuccess:()=>{setFeedback('Relationship link saved by the server.');void qc.invalidateQueries({queryKey:getListUsersQueryKey()})},onError:()=>setFeedback('Link could not be saved.')})}}><div className="grid"><label className="field">Parent / mentor user ID<input required type="number" min="1" value={linkInput.userId} onChange={(e)=>setLinkInput({...linkInput,userId:e.target.value})}/></label><label className="field">Student account ID<input required type="number" min="1" value={linkInput.studentId} onChange={(e)=>setLinkInput({...linkInput,studentId:e.target.value})}/></label><label className="field">Relationship<select value={linkInput.relationship} onChange={(e)=>setLinkInput({...linkInput,relationship:e.target.value})}><option value="parent_of">Parent of</option><option value="mentor_for">Mentor for</option></select></label><Button type="submit" variant="primary" disabled={linkUser.isPending}>{linkUser.isPending?'Saving…':'Save relationship'}</Button>{feedback && <span role="status" style={{fontSize:11}}>{feedback}</span>}</div></form></section></div>
    </>;
  };
  const renderOperations = () => <><PageHead title="Live operations" sub="Hostel occupancy and gate/device states from API records. Device status is simulated; no hardware is connected." /><div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))' }}>
    <section className="card panel"><div className="section-title"><h2>Hostels</h2><Building2 /></div><QueryState loading={hostelsQ.isLoading} error={hostelsQ.isError} retry={()=>void hostelsQ.refetch()}>{hostelsQ.data?.length?hostelsQ.data.map(h=><div className="list-row" key={h.id}><div className="row-copy"><strong>{h.name}</strong><span>Warden: {h.wardenName||'Not assigned'} · {h.presentCount} present of {h.residentCount}</span></div></div>):<Empty title="No hostels returned" body="Hostel records will appear here when available." />}</QueryState></section>
    <section className="card panel"><div className="section-title"><h2>Gates</h2><DoorOpen /></div><QueryState loading={gatesQ.isLoading} error={gatesQ.isError} retry={()=>void gatesQ.refetch()}>{gatesQ.data?.length?gatesQ.data.map(g=><div className="list-row" key={g.id}><div className="row-copy"><strong>{g.name}</strong><span>{g.location}</span></div><select className="search" style={{ width:140 }} value={g.status} onChange={(e)=>updateGate.mutate({id:g.id,data:{status:e.target.value as any}},{onSuccess:()=>void qc.invalidateQueries({queryKey:getListGatesQueryKey()})})}><option>online</option><option>offline</option><option>maintenance</option></select></div>):<Empty title="No gate records" body="No gates are currently available to this account." />}</QueryState></section>
    <section className="card panel"><div className="section-title"><h2>Simulated devices</h2><Fingerprint /></div><QueryState loading={devicesQ.isLoading} error={devicesQ.isError} retry={()=>void devicesQ.refetch()}>{devicesQ.data?.length?devicesQ.data.map(d=><div className="list-row" key={d.id}><div className="row-copy"><strong>{d.name}</strong><span>{d.type} · Simulated · last seen {fmt(d.lastSeenAt)}</span></div><select className="search" style={{ width:140 }} value={d.status} onChange={(e)=>updateDevice.mutate({id:d.id,data:{status:e.target.value as any}},{onSuccess:()=>void qc.invalidateQueries({queryKey:getListDevicesQueryKey()})})}><option>online</option><option>offline</option><option>maintenance</option></select></div>):<Empty title="No device records" body="Simulated device status will appear here when returned by the API." />}</QueryState></section>
    </div></>;
  const renderPolicies = () => <><PageHead title="Movement policies" sub="Policy settings are returned and enforced by the server." /><QueryState loading={policiesQ.isLoading} error={policiesQ.isError} retry={()=>void policiesQ.refetch()}><div className="card table-wrap"><table className="table"><thead><tr><th>Type</th><th>Auto approve</th><th>Mentor</th><th>HOD</th><th>Warden</th><th>Duration hours</th><th></th></tr></thead><tbody>{policiesQ.data?.map(p=><tr key={p.type}><td><strong>{p.type}</strong></td>{(['autoApprove','requiresMentor','requiresHod','requiresWarden'] as const).map(k=><td key={k}><input type="checkbox" aria-label={`${k} for ${p.type}`} id={`${p.type}-${k}`} defaultChecked={p[k]} /></td>)}<td><input type="number" min="1" max="720" id={`${p.type}-duration`} defaultValue={p.durationLimitHours} className="search" style={{ width:90 }} /></td><td><Button onClick={()=>{const data={autoApprove:(document.getElementById(`${p.type}-autoApprove`) as HTMLInputElement).checked,requiresMentor:(document.getElementById(`${p.type}-requiresMentor`) as HTMLInputElement).checked,requiresHod:(document.getElementById(`${p.type}-requiresHod`) as HTMLInputElement).checked,requiresWarden:(document.getElementById(`${p.type}-requiresWarden`) as HTMLInputElement).checked,durationLimitHours:Number((document.getElementById(`${p.type}-duration`) as HTMLInputElement).value)};updatePolicy.mutate({type:p.type,data},{onSuccess:()=>void qc.invalidateQueries({queryKey:getListPoliciesQueryKey()}),onError:()=>setFeedback('Policy update was not accepted.')})}}>Save</Button></td></tr>)}</tbody></table>{!policiesQ.data?.length&&<Empty title="No policy records" body="Policies will appear when returned by the server."/>}</div></QueryState>{feedback&&<p role="status">{feedback}</p>}</>;
  const renderReports = () => <><PageHead title="Reports" sub="Operational summaries generated from available campus movement data." /><QueryState loading={reportsQ.isLoading} error={reportsQ.isError} retry={()=>void reportsQ.refetch()}>{reportsQ.data && <div className="split"><section className="card panel"><div className="section-title"><h2>Daily movement activity</h2></div>{reportsQ.data.daily.length?reportsQ.data.daily.map(row=><div className="list-row" key={row.date}><div className="row-copy"><strong>{row.label}</strong><span>{shortDate(row.date)}</span></div><span>Exit {row.exits} · Return {row.returns}</span></div>):<Empty title="No daily report data" body="The API returned no daily rows for this report."/>}</section><section className="card panel"><div className="section-title"><h2>By movement type</h2></div>{reportsQ.data.byType.length?reportsQ.data.byType.map(row=><div className="list-row" key={row.type}><div className="row-copy"><strong>{row.type}</strong></div><strong>{row.count}</strong></div>):<Empty title="No type breakdown" body="The API returned no movement type rows."/>}</section></div>}</QueryState></>;
  const renderAudit = () => <><PageHead title="Audit log" sub="Recent auditable actions returned for your administrator account." /><QueryState loading={auditQ.isLoading} error={auditQ.isError} retry={()=>void auditQ.refetch()}><div className="card table-wrap"><table className="table"><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Result</th><th>Details</th></tr></thead><tbody>{auditQ.data?.map(a=><tr key={a.id}><td>{fmt(a.createdAt)}</td><td>{a.action}</td><td>{a.actorName} · {a.actorRole}</td><td><Status value={a.result}/></td><td>{a.details}{a.movementId?` · Movement ${a.movementId}`:''}</td></tr>)}</tbody></table>{!auditQ.data?.length&&<Empty title="No audit events" body="No audit events are currently available."/>}</div></QueryState></>;
  const renderProfile = () => <><PageHead title="My profile" sub="Your role and account status are managed by AEC administrators." /><div className="card panel" style={{ maxWidth:740 }}><div className="list-row"><span className="avatar" style={{ width:48,height:48 }}>{initials(user.displayName)}</span><div className="row-copy"><strong>{user.displayName}</strong><span>{user.email} · {user.role} · {user.accountStatus}</span></div></div><form onSubmit={(e)=>{e.preventDefault();updateMe.mutate({data:{displayName:profile.displayName,department:profile.department||null,year:profile.year?Number(profile.year):null,hostel:profile.hostel||null,room:profile.room||null,phone:profile.phone||null}},{onSuccess:(res)=>{qc.setQueryData(getGetCurrentUserQueryKey(),res);setFeedback('Profile saved.')},onError:()=>setFeedback('Profile was not saved.')})}}><div className="form-grid" style={{ marginTop:17 }}>{[['displayName','Display name'],['department','Department'],['year','Year'],['hostel','Hostel'],['room','Room'],['phone','Phone']].map(([k,label])=><label className="field" key={k}>{label}<input required={k==='displayName'} type={k==='year'?'number':'text'} value={(profile as any)[k]} onChange={(e)=>setProfile({...profile,[k]:e.target.value})} /></label>)}</div><div className="callout" style={{ marginTop:15 }}>Account role: <strong>{user.role}</strong> · Status: <strong>{user.accountStatus}</strong>. These fields are not editable here.</div>{feedback&&<p role="status" style={{fontSize:11}}>{feedback}</p>}<div style={{ marginTop:14 }}><Button type="submit" variant="primary" disabled={updateMe.isPending}>Save profile</Button></div></form></div></>;
  let content: ReactNode;
  if (route === 'portal') content = <Redirect to="/dashboard" />;
  else if (route === 'dashboard') content = renderDashboard();
  else if (route === 'movements' && pathParts[1] === 'new') content = role === 'Student' ? renderNew() : <Empty title="Request creation unavailable" body="Movement requests can be created by student accounts only." />;
  else if (route === 'movements' && moveId) content = renderDetail();
  else if (route === 'movements') content = renderMovements();
  else if (route === 'approvals') content = renderApprovals();
  else if (route === 'gate') content = renderGate();
  else if (route === 'notifications') content = renderNotifications();
  else if (route === 'users') content = renderUsers();
  else if (route === 'operations') content = renderOperations();
  else if (route === 'policies') content = renderPolicies();
  else if (route === 'reports') content = renderReports();
  else if (route === 'audit') content = renderAudit();
  else if (route === 'profile') content = renderProfile();
  else content = <Empty title="Page not found" body="This route is not part of the HostelFlow workspace." action={<Button href="/dashboard">Return to overview</Button>} />;
  const title = headingFor();
  const mobileNav = routesForRole.filter((x)=>['/dashboard','/movements','/approvals','/gate','/notifications'].includes(x.href)).slice(0,5);
  return <div className="hf"><div className="shell"><aside className="sidebar"><Brand /><div className="nav-label">Workspace</div><nav className="nav">{routesForRole.map(({label,href,icon:Icon})=><Link key={href} href={href} className={activePath===href?'active':''}><Icon />{label}</Link>)}</nav><div className="side-bottom"><div className="side-note"><ShieldCheck size={14} style={{ verticalAlign:'-3px', marginRight:5 }} />Role and account boundaries are enforced by the server.</div><div className="profile-chip"><div className="avatar">{initials(user.displayName)}</div><div><div className="chip-name">{user.displayName}</div><div className="chip-role">{user.role} · {user.institutionName}</div></div></div></div></aside><main className="main"><header className="topbar"><span className="crumb">AEC / {title}</span><div className="top-actions"><Button href="/notifications" className="top-notify"><Bell /> Alerts</Button><Button href="/profile"><span className="avatar" style={{ width:24,height:24 }}>{initials(user.displayName)}</span><span className="desktop-user">{user.displayName}</span></Button><button className="icon-btn" title="Sign out" onClick={()=>signOut({redirectUrl:basePath||'/'})} data-testid="button-sign-out"><LogOut /></button></div></header><div className="content">{content}</div></main></div><nav className="mobile-nav">{mobileNav.map(({label,href,icon:Icon})=><Link href={href} key={href} className={activePath===href?'active':''}><Icon /><span>{label}</span></Link>)}</nav></div>;
}

function WorkspaceRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="hf"><div className="pending card loading">Loading secure session…</div></div>;
  if (!isSignedIn) return <Redirect to="/" />;
  return <Workspace />;
}
function Router() {
  return <ErrorBoundary><Switch>
    <Route path="/" component={AuthRedirect} />
    <Route path="/sign-in/*?" component={()=><div className="hf"><AuthPage kind="in" /></div>} />
    <Route path="/sign-up/*?" component={()=><div className="hf"><AuthPage kind="up" /></div>} />
    <Route path="/portal" component={WorkspaceRoute} />
    <Route path="/dashboard" component={WorkspaceRoute} />
    <Route path="/movements" component={WorkspaceRoute} />
    <Route path="/movements/new" component={WorkspaceRoute} />
    <Route path="/movements/:id" component={WorkspaceRoute} />
    <Route path="/approvals" component={WorkspaceRoute} />
    <Route path="/gate" component={WorkspaceRoute} />
    <Route path="/notifications" component={WorkspaceRoute} />
    <Route path="/users" component={WorkspaceRoute} />
    <Route path="/pending-access" component={WorkspaceRoute} />
    <Route path="/operations" component={WorkspaceRoute} />
    <Route path="/policies" component={WorkspaceRoute} />
    <Route path="/reports" component={WorkspaceRoute} />
    <Route path="/audit" component={WorkspaceRoute} />
    <Route path="/profile" component={WorkspaceRoute} />
    <Route component={()=><div className="hf"><div className="pending card"><Empty title="Page not found" body="That route is not available." action={<Button href="/">Go to HostelFlow</Button>} /></div></div>} />
  </Switch></ErrorBoundary>;
}
function ClerkRouter() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn:{start:{title:'Welcome back',subtitle:'Sign in to your AEC movement portal'}},signUp:{start:{title:'Create your account',subtitle:'Join the AEC HostelFlow portal'}} }}
    routerPush={(to)=>setLocation(stripBase(to))} routerReplace={(to)=>setLocation(stripBase(to),{replace:true})}>
    <ClerkCacheClear /><Router />
  </ClerkProvider>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}><ClerkRouter /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
