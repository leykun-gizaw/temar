import {
  BinocularsIcon,
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
  LibraryBig,
  Settings,
  Trash2,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    title: 'Topics',
    url: '/dashboard/topics',
    icon: LibraryBig,
    isActive: false,
  },
  {
    title: 'Reviews',
    url: '/dashboard/reviews',
    icon: BinocularsIcon,
    isActive: false,
  },
  {
    title: 'Schedules',
    url: '#',
    icon: CalendarDaysIcon,
    isActive: false,
  },
  {
    title: 'Analytics',
    url: '#',
    icon: ChartNoAxesCombinedIcon,
    isActive: false,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
    isActive: false,
  },
  {
    title: 'Trash',
    url: '#',
    icon: Trash2,
    isActive: false,
  },
];
