import { lazy } from 'react';

/** Loads a page's code the first time it is opened, so each screen is its own chunk. */
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));

const AnalyticsPage = page(() => import('../pages/AnalyticsPage.jsx'), 'AnalyticsPage');
const AuditLogPage = page(() => import('../pages/AuditLogPage.jsx'), 'AuditLogPage');
const BannersPage = page(() => import('../pages/BannersPage.jsx'), 'BannersPage');
const BiodataReviewPage = page(() => import('../pages/BiodataReviewPage.jsx'), 'BiodataReviewPage');
const BiodatasPage = page(() => import('../pages/BiodatasPage.jsx'), 'BiodatasPage');
const ConnectionsPage = page(() => import('../pages/ConnectionsPage.jsx'), 'ConnectionsPage');
const ContentPage = page(() => import('../pages/ContentPage.jsx'), 'ContentPage');
const OverviewPage = page(() => import('../pages/OverviewPage.jsx'), 'OverviewPage');
const PackagesPage = page(() => import('../pages/PackagesPage.jsx'), 'PackagesPage');
const PaymentsPage = page(() => import('../pages/PaymentsPage.jsx'), 'PaymentsPage');
const RecoveryPage = page(() => import('../pages/RecoveryPage.jsx'), 'RecoveryPage');
const RefundsPage = page(() => import('../pages/RefundsPage.jsx'), 'RefundsPage');
const ReportsPage = page(() => import('../pages/ReportsPage.jsx'), 'ReportsPage');
const SettingsPage = page(() => import('../pages/SettingsPage.jsx'), 'SettingsPage');
const StoriesPage = page(() => import('../pages/StoriesPage.jsx'), 'StoriesPage');
const TicketPage = page(() => import('../pages/TicketPage.jsx'), 'TicketPage');
const TicketsPage = page(() => import('../pages/TicketsPage.jsx'), 'TicketsPage');
const UserPage = page(() => import('../pages/UserPage.jsx'), 'UserPage');
const UsersPage = page(() => import('../pages/UsersPage.jsx'), 'UsersPage');

/**
 * Every admin screen: its path, the permission it needs (shared/src/permissions.js)
 * and, for top-level screens, how it appears in the sidebar. The router and the
 * navigation are both built from this list.
 */
export const ROUTES = [
  {
    path: '/',
    element: OverviewPage,
    permission: 'overview.view',
    nav: { key: 'nav.overview', icon: 'home', group: 'work' },
  },
  {
    path: '/biodatas',
    element: BiodatasPage,
    permission: 'biodata.review',
    nav: { key: 'nav.biodatas', icon: 'user', group: 'work', badge: 'pendingBiodatas' },
  },
  { path: '/biodatas/:id', element: BiodataReviewPage, permission: 'biodata.review' },
  {
    path: '/reports',
    element: ReportsPage,
    permission: 'reports.manage',
    nav: { key: 'nav.reports', icon: 'flag', group: 'work', badge: 'openReports' },
  },
  {
    path: '/recovery',
    element: RecoveryPage,
    permission: 'recovery.manage',
    nav: { key: 'nav.recovery', icon: 'history', group: 'work', badge: 'pendingRestores' },
  },
  {
    path: '/tickets',
    element: TicketsPage,
    permission: 'tickets.manage',
    nav: { key: 'nav.tickets', icon: 'ticket', group: 'work', badge: 'openTickets' },
  },
  { path: '/tickets/:id', element: TicketPage, permission: 'tickets.manage' },
  {
    path: '/payments',
    element: PaymentsPage,
    permission: 'payments.manage',
    nav: { key: 'nav.payments', icon: 'card', group: 'money', badge: 'pendingPayments' },
  },
  {
    path: '/refunds',
    element: RefundsPage,
    permission: 'refunds.manage',
    nav: { key: 'nav.refunds', icon: 'refresh', group: 'money', badge: 'pendingRefunds' },
  },
  {
    path: '/connections',
    element: ConnectionsPage,
    permission: 'connections.adjust',
    nav: { key: 'nav.connections', icon: 'spark', group: 'money' },
  },
  {
    path: '/packages',
    element: PackagesPage,
    permission: 'packages.manage',
    nav: { key: 'nav.packages', icon: 'package', group: 'money' },
  },
  {
    path: '/users',
    element: UsersPage,
    permission: 'users.view',
    nav: { key: 'nav.users', icon: 'users', group: 'people' },
  },
  { path: '/users/:id', element: UserPage, permission: 'users.view' },
  {
    path: '/analytics',
    element: AnalyticsPage,
    permission: 'analytics.view',
    nav: { key: 'nav.analytics', icon: 'chart', group: 'people' },
  },
  {
    path: '/audit',
    element: AuditLogPage,
    permission: 'audit.view',
    nav: { key: 'nav.audit', icon: 'list', group: 'people' },
  },
  {
    path: '/content',
    element: ContentPage,
    permission: 'content.manage',
    nav: { key: 'nav.content', icon: 'file', group: 'site' },
  },
  {
    path: '/stories',
    element: StoriesPage,
    permission: 'content.manage',
    nav: { key: 'nav.stories', icon: 'heart', group: 'site' },
  },
  {
    path: '/banners',
    element: BannersPage,
    permission: 'content.manage',
    nav: { key: 'nav.banners', icon: 'upload', group: 'site' },
  },
  {
    path: '/settings',
    element: SettingsPage,
    permission: 'settings.manage',
    nav: { key: 'nav.settings', icon: 'settings', group: 'site' },
  },
];

export const NAV_GROUPS = ['work', 'money', 'people', 'site'];
