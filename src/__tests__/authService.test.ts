import { DEMO_CREDENTIALS } from '../fixtures';
import { authService } from '../services';

describe('authService (mock)', () => {
  it('logs in with demo credentials', async () => {
    const user = await authService.login(DEMO_CREDENTIALS.document, DEMO_CREDENTIALS.password);
    expect(user.name).toContain('Marina');
    expect(authService.getSession()).not.toBeNull();
    await authService.logout();
    expect(authService.getSession()).toBeNull();
  });

  it('rejects invalid password', async () => {
    await expect(authService.login(DEMO_CREDENTIALS.document, '000000')).rejects.toThrow();
  });
});
