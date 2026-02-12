export const createAuthClient = () => ({
  signIn: { social: jest.fn() },
  signOut: jest.fn(),
  useSession: () => ({ data: null, isPending: false }),
});
