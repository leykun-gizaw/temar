import { dbClient } from './db-client';

describe('dbClient', () => {
  it('should work', () => {
    expect(dbClient()).toEqual('db-client');
  });
});
