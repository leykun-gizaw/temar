import { type CalendarEvent } from '@/components/full-calendar';

function getCurrentWeekDates() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

const eventNames = [
  'Binary Search',
  'Quick Sort',
  'Factory Pattern',
  'Dependency Inversion',
  'Graph Traversal',
  'Hash Table',
  'Observer Pattern',
  'Open/Closed Principle',
  'Recursion',
  'Breadth-First Search',
  'Stack',
  'Queue',
  'Adapter Pattern',
  'Liskov Substitution',
  'Greedy Algorithm',
  'Heap',
  'Decorator Pattern',
  'Interface Segregation',
  'Merge Sort',
  'Singleton',
  "Dijkstra's Algorithm",
  'Red-Black Tree',
  'Strategy Pattern',
  'Polymorphism',
  'Encapsulation',
  'Abstraction',
  'Builder Pattern',
  'Bridge Pattern',
  'Dynamic Programming',
  'Circular Queue',
  'Composite Pattern',
  'Flyweight Pattern',
  'Proxy Pattern',
  'Template Method',
  'Command Pattern',
  'Iterator Pattern',
  'Chain of Responsibility',
  'State Pattern',
  'Memento Pattern',
  'Visitor Pattern',
  'Solid Principle',
];

const allowedColors = ['blue', 'green', 'pink', 'purple', 'default'] as const;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEventName(used: Set<string>) {
  let name;
  let tries = 0;
  do {
    name = eventNames[getRandomInt(0, eventNames.length - 1)];
    tries++;
  } while (used.has(name) && tries < 10);
  used.add(name);
  return name;
}

export const calendar_events: CalendarEvent[] = (() => {
  const weekDates = getCurrentWeekDates();
  const events: CalendarEvent[] = [];
  let colorIdx = 0;
  let idCounter = 1;
  for (const day of weekDates) {
    const usedNames = new Set<string>();
    let current = new Date(day);
    current.setHours(9, 0, 0, 0); // Start at 9:00
    const dayEnd = new Date(day);
    dayEnd.setHours(19, 0, 0, 0); // End at 19:00
    const duration = 90; // 90 minutes for all events
    const minGap = 5; // 5 minutes between events
    for (let i = 0; i < 5; i++) {
      const end = new Date(current);
      end.setMinutes(end.getMinutes() + duration);
      if (end > dayEnd) {
        break;
      }
      events.push({
        id: `event-${idCounter++}`,
        start: new Date(current),
        end: new Date(end),
        title: getRandomEventName(usedNames),
        color: allowedColors[colorIdx % allowedColors.length],
      });
      colorIdx++;
      // Move current to end + minGap
      current = new Date(end);
      current.setMinutes(current.getMinutes() + minGap);
    }
  }
  return events;
})();
