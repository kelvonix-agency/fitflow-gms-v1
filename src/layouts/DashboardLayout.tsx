import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Cake,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Globe,
  IndianRupee,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareHeart,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { Avatar } from '../components/ui/Avatar';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { ExpenseModal } from '../components/modals/ExpenseModal';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { SendNoticeModal } from '../components/modals/SendNoticeModal';
import { useAuth } from '../context/AuthContext';
import { useGymData } from '../context/GymDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatINR, formatRelativeTime } from '../utils/formatters';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    store,
    metrics,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useGymData();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [sendNoticeModalOpen, setSendNoticeModalOpen] = useState(false);
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const newBtnRef = useRef<HTMLDivElement>(null);
  const sidebarProfileRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileActionSheetOpen(false);
    setNotifOpen(false);
    setProfileMenuOpen(false);
    setNewMenuOpen(false);
    setSidebarProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileMenuOpen(false);
      if (newBtnRef.current && !newBtnRef.current.contains(target)) setNewMenuOpen(false);
      if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(target)) {
        setSidebarProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gymName = store?.gym.name || 'FitFlow';
  const ownerName = store?.profile.name || 'Rahul Verma';
  const ownerRole = store?.profile.role || 'Owner';
  const ownerAvatar = store?.profile.avatar_url;
  const notifications = store?.notifications ?? [];

  const activeRetentionPct =
    metrics.totalMembers > 0 ? Math.round((metrics.activeCount / metrics.totalMembers) * 100) : 0;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-3.5 py-2 rounded-full text-[13px] transition-all duration-150 whitespace-nowrap ${
      isActive
        ? 'bg-orange-100/95 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 font-semibold shadow-[inset_0_0_0_1px_rgba(234,88,12,0.12)]'
        : 'text-stone-700 dark:text-zinc-300 font-medium hover:bg-stone-200/70 dark:hover:bg-zinc-800/70 hover:text-stone-900 dark:hover:text-zinc-100'
    }`;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderQuickActionItems = () => (
    <>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          setAddMemberModalOpen(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
          <UserPlus className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Add Member</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">Enroll &amp; assign plan</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          setRecordPaymentModalOpen(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <CreditCard className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Record Payment</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">Log fee or renewal</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          setExpenseModalOpen(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <Receipt className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Log Expense</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">Rent, utilities, payroll</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          navigate('/enquiries?new=1');
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <UserCheck className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Add Enquiry</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">Log walk-in or lead</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          navigate('/attendance');
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <Activity className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Mark Attendance</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">Daily member check-in</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          setSendNoticeModalOpen(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <Megaphone className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Send Member Notice</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">Announcements &amp; alerts</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setNewMenuOpen(false);
          navigate('/memberships?new=1');
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
          <Layers className="h-3.5 w-3.5" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-stone-900 dark:text-zinc-100">Create Plan</p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">New membership tier</p>
        </div>
      </button>
    </>
  );

  const renderNavItems = (collapsed: boolean) => (
    <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5" aria-label="Primary navigation">
      <NavLink to="/dashboard" className={navLinkClass} title="Overview">
        <LayoutDashboard className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Overview</span>}
      </NavLink>

      <NavLink to="/members" className={navLinkClass} title="Members">
        <Users className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && (
          <span className="flex-1 flex items-center justify-between">
            <span>Members</span>
            <span className="text-[11px] tabular-nums opacity-65">{metrics.totalMembers}</span>
          </span>
        )}
      </NavLink>

      <NavLink to="/memberships" className={navLinkClass} title="Memberships">
        <Layers className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Memberships</span>}
      </NavLink>

      <NavLink to="/renewals" className={navLinkClass} title="Renewals">
        <RefreshCw className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && (
          <span className="flex-1 flex items-center justify-between">
            <span>Renewals</span>
            {metrics.expiringCount + metrics.expiredCount > 0 && (
              <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                {metrics.expiringCount + metrics.expiredCount}
              </span>
            )}
          </span>
        )}
      </NavLink>

      <NavLink to="/attendance" className={navLinkClass} title="Attendance">
        <CalendarCheck2 className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Attendance</span>}
      </NavLink>

      <NavLink to="/payments" className={navLinkClass} title="Payments">
        <CreditCard className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Payments</span>}
      </NavLink>

      <NavLink to="/revenue" className={navLinkClass} title="Revenue & Profit">
        <IndianRupee className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Revenue &amp; Profit</span>}
      </NavLink>

      <NavLink to="/expenses" className={navLinkClass} title="Expenses">
        <Receipt className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Expenses</span>}
      </NavLink>

      <NavLink to="/enquiries" className={navLinkClass} title="Enquiries">
        <UserCheck className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Enquiries</span>}
      </NavLink>

      {/* Communication Folder Tree (Drive-style) */}
      <div className="pt-1.5">
        {collapsed ? (
          <NavLink to="/communication/birthdays" className={navLinkClass} title="Communication">
            <MessageSquareHeart className="h-[17px] w-[17px] shrink-0" />
          </NavLink>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setCommOpen((prev) => !prev)}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-200/70 dark:hover:bg-zinc-800/70 transition-colors"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-150 ${
                  commOpen ? 'rotate-90' : ''
                }`}
              />
              <MessageSquareHeart className="h-[17px] w-[17px] shrink-0" />
              <span className="flex-1 text-left">Communication</span>
            </button>
            {commOpen && (
              <div className="mt-0.5 ml-5 pl-2.5 border-l border-stone-300/60 dark:border-zinc-800 space-y-0.5">
                <NavLink to="/communication/birthdays" className={navLinkClass}>
                  <Cake className="h-4 w-4 shrink-0" />
                  <span>Birthdays</span>
                </NavLink>
                <NavLink to="/communication/festivals" className={navLinkClass}>
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Festival Wishes</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
      </div>

      <NavLink to="/reports" className={navLinkClass} title="Reports">
        <BarChart3 className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Reports</span>}
      </NavLink>

      <NavLink to="/staff" className={navLinkClass} title="Staff">
        <UserCog className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Staff</span>}
      </NavLink>

      <NavLink to="/settings" className={navLinkClass} title="Settings">
        <Settings className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Settings</span>}
      </NavLink>

      <div className="pt-2 mt-2 border-t border-stone-200/70 dark:border-zinc-800/80">
        <a
          href="https://gym-for-haryana.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          title="Back to Site"
          className="group flex items-center gap-3 px-3.5 py-2 rounded-full text-[13px] font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-200/70 dark:hover:bg-zinc-800/70 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-150 whitespace-nowrap"
        >
          <Globe className="h-[17px] w-[17px] shrink-0" />
          {!collapsed && (
            <span className="flex-1 flex items-center justify-between">
              <span>Back to Site</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </span>
          )}
        </a>
      </div>
    </nav>
  );

  return (
    <div className="h-dvh overflow-hidden bg-[#F2F0EB] dark:bg-[#0B0C0E] text-stone-900 dark:text-zinc-100 flex flex-col">
      {/* Locked Full-Width Google Drive-Inspired Topbar */}
      <header className="shrink-0 z-40 h-14 lg:h-16 bg-[#F2F0EB]/95 dark:bg-[#0B0C0E]/95 backdrop-blur-xl border-b border-stone-200/50 lg:border-b-0 dark:border-zinc-800/60 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Zone: Brand + Sidebar Collapse */}
        <div
          className={`flex items-center justify-between gap-2 shrink-0 transition-all duration-200 ${
            sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[244px]'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden h-10 w-10 rounded-full flex items-center justify-center text-stone-700 dark:text-zinc-200 hover:bg-stone-200/70 dark:hover:bg-zinc-800 active:scale-95 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl"
            >
              <BrandLogo gymName={gymName} logoUrl={store?.gym.logo_url} collapsed={sidebarCollapsed} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:inline-flex p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Center Zone: Signature Google Drive Search Pill (Tablet & Desktop) */}
        <div className="hidden sm:flex flex-1 items-center max-w-[660px] min-w-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="group w-full h-11 px-4 rounded-full bg-[#E6E3DC] hover:bg-white dark:bg-[#191B20] dark:hover:bg-[#21242B] border border-transparent hover:border-stone-200/80 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-150 flex items-center justify-between gap-3 text-left"
          >
            <span className="flex items-center gap-3 min-w-0">
              <Search className="h-4 w-4 text-stone-500 dark:text-zinc-400 group-hover:text-orange-600 transition-colors shrink-0" />
              <span className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 truncate">
                Search members, payments, plans...
              </span>
            </span>
            <span className="hidden md:inline-flex items-center gap-2 shrink-0">
              <kbd className="px-2 py-0.5 text-[11px] font-mono-num rounded-full bg-white/80 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200/70 dark:border-zinc-700">
                ⌘K
              </kbd>
              <SlidersHorizontal className="h-3.5 w-3.5 text-stone-400 dark:text-zinc-500" />
            </span>
          </button>
        </div>

        {/* Right Zone: Circular Icon Controls, Logout & Owner Profile */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden h-10 w-10 rounded-full flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-200/75 dark:hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="hidden sm:flex h-10 w-10 rounded-full items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-200/75 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* Notifications & Owner Notices */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Open notifications & notices"
              title="Notices & Alerts"
              className="relative h-10 w-10 rounded-full flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-200/75 dark:hover:bg-zinc-800 transition-colors"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-orange-600 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums ring-2 ring-[#F2F0EB] dark:ring-[#0B0C0E]">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] sm:w-96 rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-stone-100 dark:border-zinc-800">
                  <div>
                    <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                      Notices &amp; Alerts
                    </span>
                    <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                      Send member announcements or review updates
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      setSendNoticeModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Megaphone className="h-3 w-3" />
                    <span>Send Notice</span>
                  </button>
                </div>

                {/* Live Operational Summary Strip */}
                {(metrics.expiringCount > 0 || metrics.pendingPaymentsCount > 0) && (
                  <div className="px-4 py-2.5 bg-stone-50/80 dark:bg-zinc-900/60 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/members?filter=expiring');
                      }}
                      className="text-amber-700 dark:text-amber-400 font-medium hover:underline tabular-nums"
                    >
                      {metrics.expiringCount} expiring soon
                    </button>
                    <span className="text-stone-300 dark:text-zinc-700">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/payments?status=Pending');
                      }}
                      className="text-stone-600 dark:text-zinc-300 font-medium hover:underline tabular-nums"
                    >
                      {formatINR(metrics.pendingPaymentsTotal)} dues pending
                    </button>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800">
                  {notifications.filter((n) => !n.id.startsWith('notif-')).length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <p className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                        No owner notices sent yet
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                        Use Send Notice to broadcast holiday timings, batch updates, or fee alerts.
                      </p>
                    </div>
                  ) : (
                    notifications
                      .filter((n) => !n.id.startsWith('notif-'))
                      .map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 flex items-start justify-between gap-3 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors ${
                            !n.is_read ? 'bg-orange-50/45 dark:bg-orange-950/15' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifOpen(false);
                              navigate(n.link);
                            }}
                            className="flex-1 text-left"
                          >
                            <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="mt-1 text-[11px] text-stone-400 dark:text-zinc-500">
                              {formatRelativeTime(n.created_at)}
                            </p>
                          </button>
                          {!n.is_read && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(n.id)}
                              className="mt-1 text-[11px] font-medium text-orange-600 hover:underline shrink-0"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))
                  )}
                </div>

                {unreadNotificationsCount > 0 && (
                  <div className="px-4 py-2 border-t border-stone-100 dark:border-zinc-800 flex justify-end bg-stone-50/50 dark:bg-zinc-900/40">
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings Quick Button */}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Gym settings"
            title="Settings"
            className="hidden sm:flex h-10 w-10 rounded-full items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-200/75 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>

          {/* Direct Visible Logout Icon Button */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            className="h-10 w-10 rounded-full flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition-all"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>

          {/* Header Owner Profile */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-label="Open profile menu"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-200/75 dark:hover:bg-zinc-800 transition-colors"
            >
              <Avatar name={ownerName} src={ownerAvatar} size="sm" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 shadow-2xl p-2 z-50">
                <div className="px-3 py-2.5 border-b border-stone-100 dark:border-zinc-800 mb-1">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                    {ownerName}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                    {store?.profile.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings?tab=account');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800"
                >
                  Gym Settings
                </button>
                <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Body: Locked Left Sidebar + Independently Scrollable Workspace Sheet */}
      <div className="flex-1 min-h-0 flex overflow-hidden lg:pr-3 lg:pb-3">
        {/* Desktop Locked Left Sidebar (Never Scrolls With Dashboard) */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 h-full z-30 transition-all duration-200 ${
            sidebarCollapsed ? 'w-[78px]' : 'w-[256px]'
          }`}
        >
          {/* Elevated "+ New" Drive-Style Quick Action Button */}
          <div className="px-3 pt-2 pb-3 relative" ref={newBtnRef}>
            <button
              type="button"
              onClick={() => setNewMenuOpen((v) => !v)}
              className={`inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white dark:bg-[#191B20] border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:border-orange-300 dark:hover:border-orange-800/70 transition-all duration-150 ${
                sidebarCollapsed ? 'w-12 h-12 p-0 mx-auto flex' : 'px-5 py-3'
              }`}
            >
              <Plus className="h-5 w-5 text-orange-600 shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  New Action
                </span>
              )}
            </button>

            {newMenuOpen && (
              <div className="absolute left-3 top-[66px] w-60 rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 shadow-2xl p-1.5 z-50">
                {renderQuickActionItems()}
              </div>
            )}
          </div>

          {renderNavItems(sidebarCollapsed)}

          {/* Drive-Inspired Gym Capacity Meter + Owner Footer */}
          <div className="px-3 pb-3 pt-2 space-y-2.5">
            {!sidebarCollapsed && (
              <div className="px-3.5 py-3 rounded-2xl bg-white/75 dark:bg-[#181A1F]/90 border border-stone-200/70 dark:border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] font-medium text-stone-600 dark:text-zinc-300">
                  <span>Active Capacity</span>
                  <span className="tabular-nums font-semibold text-stone-900 dark:text-zinc-100">
                    {activeRetentionPct}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-stone-200/80 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-600 transition-all duration-300"
                    style={{ width: `${activeRetentionPct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
                  <span className="tabular-nums">
                    {metrics.activeCount} of {metrics.totalMembers} active
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/renewals')}
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    Renewals
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar Owner Profile + Direct Logout Icon */}
            <div
              className={`relative flex items-center gap-1 ${
                sidebarCollapsed ? 'flex-col' : ''
              }`}
              ref={sidebarProfileRef}
            >
              <button
                type="button"
                onClick={() => setSidebarProfileOpen((v) => !v)}
                className={`flex-1 flex items-center gap-2.5 p-2 rounded-full hover:bg-stone-200/70 dark:hover:bg-zinc-800/80 transition-colors text-left min-w-0 ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <Avatar name={ownerName} src={ownerAvatar} size="sm" />
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                        {ownerName}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                        {ownerRole}
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                className="h-9 w-9 rounded-full flex items-center justify-center text-stone-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {sidebarProfileOpen && (
                <div className="absolute bottom-14 left-0 w-52 z-40 rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 shadow-2xl p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarProfileOpen(false);
                      navigate('/settings?tab=account');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Gym Settings
                  </button>
                  <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile App Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-[#F2F0EB] dark:bg-[#111317] h-full flex flex-col rounded-r-[28px] border-r border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
              <div className="h-14 px-4 flex items-center justify-between border-b border-stone-200/70 dark:border-zinc-800">
                <BrandLogo gymName={gymName} logoUrl={store?.gym.logo_url} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200/70 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAddMemberModalOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-sm font-semibold shadow-xs transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Member</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="h-10 w-10 rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 shrink-0"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              {renderNavItems(false)}
              <div className="p-3.5 border-t border-stone-200/70 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white/60 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={ownerName} src={ownerAvatar} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{ownerName}</p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">{ownerRole}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Elevated Rounded Workspace Sheet (Only This Area Scrolls) */}
        <main
          ref={mainRef}
          className="flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain bg-[#FAF9F6] dark:bg-[#131519] lg:rounded-[26px] lg:border lg:border-stone-200/80 dark:lg:border-zinc-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8 max-w-[1560px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Native Mobile App Bottom Dock with Elevated Center Quick-Action Button */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/92 dark:bg-[#14161A]/92 backdrop-blur-xl border-t border-stone-200/80 dark:border-zinc-800/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      >
        <div className="h-14 px-2 grid grid-cols-5 items-center">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl text-[10px] font-semibold active:scale-95 transition-all ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-orange-100/90 dark:bg-orange-500/20' : ''
                  }`}
                >
                  <LayoutDashboard className="h-[18px] w-[18px]" />
                </span>
                <span>Overview</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/members"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl text-[10px] font-semibold active:scale-95 transition-all ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-orange-100/90 dark:bg-orange-500/20' : ''
                  }`}
                >
                  <Users className="h-[18px] w-[18px]" />
                </span>
                <span>Members</span>
              </>
            )}
          </NavLink>

          {/* Elevated Native Center Quick Action Trigger */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setMobileActionSheetOpen(true)}
              aria-label="Quick actions"
              className="-mt-4 h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-90 text-white shadow-lg shadow-orange-600/30 ring-4 ring-[#FAF9F6] dark:ring-[#131519] flex items-center justify-center transition-all"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl text-[10px] font-semibold active:scale-95 transition-all ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-orange-100/90 dark:bg-orange-500/20' : ''
                  }`}
                >
                  <CalendarCheck2 className="h-[18px] w-[18px]" />
                </span>
                <span>Attendance</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/payments"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl text-[10px] font-semibold active:scale-95 transition-all ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-orange-100/90 dark:bg-orange-500/20' : ''
                  }`}
                >
                  <CreditCard className="h-[18px] w-[18px]" />
                </span>
                <span>Payments</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Native Mobile Bottom Action Sheet */}
      {mobileActionSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileActionSheetOpen(false)}
          />
          <div className="relative w-full rounded-t-[28px] bg-white dark:bg-[#181A1F] border-t border-stone-200 dark:border-zinc-800 shadow-2xl px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mx-auto mb-4" />
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                Quick Actions
              </h3>
              <button
                type="button"
                onClick={() => setMobileActionSheetOpen(false)}
                aria-label="Close quick actions"
                className="h-8 w-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setAddMemberModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/50 text-left active:scale-[0.98] transition-all"
              >
                <span className="h-9 w-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">Add Member</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">New sign-up</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setRecordPaymentModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/70 dark:border-zinc-800 text-left active:scale-[0.98] transition-all"
              >
                <span className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">Log Payment</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">Fee / renewal</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  navigate('/renewals');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/70 dark:border-zinc-800 text-left active:scale-[0.98] transition-all"
              >
                <span className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">Renewals</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">Expiring plans</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  navigate('/enquiries?new=1');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/70 dark:border-zinc-800 text-left active:scale-[0.98] transition-all"
              >
                <span className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">Add Enquiry</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">Walk-in lead</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setExpenseModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/70 dark:border-zinc-800 text-left active:scale-[0.98] transition-all"
              >
                <span className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                  <Receipt className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">Log Expense</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">Bills &amp; payroll</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setSendNoticeModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/70 dark:border-zinc-800 text-left active:scale-[0.98] transition-all"
              >
                <span className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">Send Notice</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">Alert members</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AddMemberModal open={addMemberModalOpen} onClose={() => setAddMemberModalOpen(false)} />
      <RecordPaymentModal open={recordPaymentModalOpen} onClose={() => setRecordPaymentModalOpen(false)} />
      <ExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
      <SendNoticeModal open={sendNoticeModalOpen} onClose={() => setSendNoticeModalOpen(false)} />
    </div>
  );
}
