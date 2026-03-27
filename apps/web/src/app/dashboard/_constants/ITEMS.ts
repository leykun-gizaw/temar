import {
  ChartNoAxesCombined,
  Coins,
  Home,
  LibraryBig,
  BinocularsIcon,
  Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    title: 'Home',
    url: '/dashboard',
    icon: Home,
    exact: true,
  },
  {
    title: 'Library',
    url: '/dashboard/materials',
    icon: LibraryBig,
  },
  {
    title: 'Reviews',
    url: '/dashboard/reviews',
    icon: BinocularsIcon,
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: ChartNoAxesCombined,
  },
];

export const BOTTOM_NAV_ITEMS = [
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: Coins,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
];
