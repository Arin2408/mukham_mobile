import { stepRadius } from '@/features/map/radius';
import { MAP_USER_AGENT, mapHtml } from '@/features/map/office-map';
import { shiftLength } from '@/lib/format';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

describe('check-in radius steps', () => {
  it('moves in round steps that grow with the circle, within 10 m to 5 km', () => {
    expect(stepRadius(100, 1)).toBe(110);
    expect(stepRadius(100, -1)).toBe(90);
    expect(stepRadius(195, 1)).toBe(200);
    expect(stepRadius(200, 1)).toBe(250);
    expect(stepRadius(200, -1)).toBe(190);
    expect(stepRadius(1000, 1)).toBe(1250);
    expect(stepRadius(1000, -1)).toBe(950);
    expect(stepRadius(10, -1)).toBe(10);
    expect(stepRadius(5000, 1)).toBe(5000);
  });
});

describe('shift length', () => {
  it('counts a shift ending before it starts as overnight, as the backend does', () => {
    expect(shiftLength('09:00', '18:00')).toEqual({ minutes: 540, overnight: false });
    expect(shiftLength('20:00', '04:00')).toEqual({ minutes: 480, overnight: true });
    expect(shiftLength('22:30', '06:15')).toEqual({ minutes: 465, overnight: true });
  });
});

describe('the map page', () => {
  const html = mapHtml({ latitude: 13.0656, longitude: 80.1784 }, 150, false);

  it('carries Leaflet inside, and loads no script from the internet', () => {
    expect(html).toContain('Leaflet 1.9.4');
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href=/);
  });

  it('uses OpenStreetMap tiles with their attribution, and starts at the office', () => {
    expect(html).toContain('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(html).toContain('OpenStreetMap</a> contributors');
    expect(html).toContain('"initial":{"latitude":13.0656,"longitude":80.1784},"radius":150');
  });

  it('names the app in its requests, as OpenStreetMap requires', () => {
    expect(MAP_USER_AGENT).toMatch(/^Mukham\/\d+\.\d+\.\d+ \(Mukham attendance app/);
  });
});
