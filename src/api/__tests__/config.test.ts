jest.mock('expo-constants', () => ({ expoConfig: { hostUri: '192.168.1.20:8081' } }));
jest.mock('expo-device', () => ({ isDevice: true }));

describe('server addresses in development', () => {
  it('serves photos from the backend origin and links to the web app on the same laptop', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require('@/api/config');
      expect(config.API_BASE_URL).toBe('http://192.168.1.20:8002/api/v1');
      expect(config.mediaUrl('/media/photos/a.jpg')).toBe('http://192.168.1.20:8002/media/photos/a.jpg');
      expect(config.mediaUrl('https://s3.example/a.jpg')).toBe('https://s3.example/a.jpg');
      expect(config.mediaUrl(null)).toBeNull();
      expect(config.WEB_BASE_URL).toBe('http://192.168.1.20:3000');
    });
  });
});
