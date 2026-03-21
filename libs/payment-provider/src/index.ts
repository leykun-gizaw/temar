export * from './lib/types.js';
export * from './lib/provider.js';
export * from './lib/registry.js';
export { processPaymentEvent, getUserIdByProviderCustomerId } from './lib/event-handler.js';

// Import adapters to trigger auto-registration
import './lib/adapters/paddle/paddle-adapter.js';
import './lib/adapters/dodo/dodo-adapter.js';
