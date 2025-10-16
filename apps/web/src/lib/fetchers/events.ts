import { CalendarEvent } from '../calendar-types';

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
  'Load Balancer',
  'Microservices Architecture',
  'Database Sharding',
  'Event-Driven Architecture',
  'CAP Theorem',
  'Distributed Systems',
  'Scalability',
  'Fault Tolerance',
  'High Availability',
  'Data Replication',
  'Caching Strategies',
  'Service Discovery',
  'API Gateway',
  'Message Queues',
  'Rate Limiting',
  'Consistency Models',
  'Horizontal Scaling',
  'Vertical Scaling',
  'Cloud Computing',
  'Containerization',
  'Serverless Architecture',
  'Monolithic Architecture',
  'Edge Computing',
  'Latency Optimization',
  'Load Testing',
  'Disaster Recovery',
  'Elasticity',
  'Concurrency Control',
  'Session Management',
  'Security Layers',
  'Authentication and Authorization',
  'Data Partitioning',
  'Streaming Data Processing',
  'Batch Processing',
  'Data Lake',
  'Data Warehouse',
  'Observability',
  'Monitoring and Alerting',
  'Log Aggregation',
  'Tracing',
  'Metrics Collection',
];
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

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const calendar_events: CalendarEvent[] = (() => {
  const weekDates = getCurrentWeekDates();
  const events: CalendarEvent[] = [];
  let idCounter = 1;
  for (const day of weekDates) {
    const usedNames = new Set<string>();
    const current = new Date(day);
    current.setHours(9, 0, 0, 0); // Start at 9:00
    const dayEnd = new Date(day);
    dayEnd.setHours(19, 0, 0, 0); // End at 19:00
    for (let i = 0; i < 7; i++) {
      const end = new Date(current);
      end.setMinutes(end.getMinutes() + 30); // 30 minutes duration
      if (end > dayEnd) {
        break;
      }
      events.push({
        id: `event-${idCounter++}`,
        start: new Date(current),
        end: new Date(end),
        title: getRandomEventName(usedNames),
        progress: getRandomInt(0, 100),
      });
      // Move current to the next hour
      current.setHours(current.getHours() + 1, 0, 0, 0);
    }
  }
  return events;
})();

export function getAllCalendarEvents() {
  return Promise.resolve(calendar_events);
}

export function getCalendarEventById(id: string) {
  return Promise.resolve(calendar_events.find((event) => event.id === id));
}
