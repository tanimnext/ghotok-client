// Dashboard navigation, shared by the sidebar, the mobile section strip and the tab bar.
export const DASHBOARD_NAV = [
  { href: '/dashboard', key: 'dash.nav.overview', icon: 'home' },
  { href: '/dashboard/biodata', key: 'dash.nav.biodata', icon: 'user' },
  { href: '/dashboard/favorites', key: 'dash.nav.favorites', icon: 'heart' },
  { href: '/dashboard/dislikes', key: 'dash.nav.dislikes', icon: 'eyeOff' },
  { href: '/dashboard/favorited-me', key: 'dash.nav.favoritedMe', icon: 'spark' },
  { href: '/dashboard/unlocks', key: 'dash.nav.unlocks', icon: 'unlock' },
  { href: '/dashboard/proposals', key: 'dash.nav.proposals', icon: 'mail' },
  { href: '/dashboard/connections', key: 'dash.nav.connections', icon: 'card' },
  { href: '/dashboard/notifications', key: 'dash.nav.notifications', icon: 'bell' },
  { href: '/dashboard/support', key: 'dash.nav.support', icon: 'ticket' },
  { href: '/dashboard/settings', key: 'dash.nav.settings', icon: 'settings' },
];

export const MOBILE_TABS = [
  { href: '/dashboard', key: 'dash.tabs.home', icon: 'home' },
  { href: '/dashboard/favorites', key: 'dash.tabs.favorites', icon: 'heart' },
  { href: '/dashboard/proposals', key: 'dash.tabs.proposals', icon: 'mail' },
  { href: '/dashboard/connections', key: 'dash.tabs.billing', icon: 'card' },
  { href: '/dashboard/settings', key: 'dash.tabs.account', icon: 'user' },
];

export function isCurrent(pathname, href) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}
