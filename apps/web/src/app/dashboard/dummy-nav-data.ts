import {
  BinocularsIcon,
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
  LibraryBig,
  NotebookIcon,
  Trash2,
} from 'lucide-react';

export const navMain = [
  {
    title: 'Topics',
    url: '/dashboard/topics',
    icon: LibraryBig,
    isActive: false,
  },
  {
    title: 'Notes',
    url: '#',
    icon: NotebookIcon,
    isActive: false,
  },
  {
    title: 'Reviews',
    url: '#',
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
    title: 'Trash',
    url: '#',
    icon: Trash2,
    isActive: false,
  },
];
