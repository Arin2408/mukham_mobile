import Constants from 'expo-constants';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors, radius as corner } from '@/theme';

import { LEAFLET_CSS, LEAFLET_JS } from './leaflet-bundle';

/**
 * Map tiles. OpenStreetMap's tile servers, as on the web app; set
 * EXPO_PUBLIC_MAP_TILE_URL to switch provider without code changes, as
 * their policy recommends. Satellite is Esri's imagery, also as on the web.
 */
const STREET_TILES = process.env.EXPO_PUBLIC_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const STREET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABEL_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

/** OpenStreetMap asks every app to name itself in its requests. */
export const MAP_USER_AGENT = `Mukham/${Constants.expoConfig?.version ?? '1.0.0'} (Mukham attendance app; Android)`;

export type MapPoint = { latitude: number; longitude: number };

export type OfficeMapHandle = {
  /** Moves the pin and centres the map on it. */
  moveTo: (point: MapPoint) => void;
  setRadius: (meters: number) => void;
  setSatellite: (on: boolean) => void;
};

type Props = {
  /** Where the pin starts; null shows India until a spot is chosen. */
  initial: MapPoint | null;
  radiusMeters: number;
  satellite: boolean;
  /** Called when the admin taps the map to move the pin. */
  onPick: (point: MapPoint) => void;
};

/** The page inside the web view: Leaflet, the pin and its check-in circle. */
export function mapHtml(initial: MapPoint | null, radiusMeters: number, satellite: boolean): string {
  const start = JSON.stringify({ initial, radius: radiusMeters, satellite });
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>${LEAFLET_CSS}
html, body, #map { margin: 0; height: 100%; background: #0a0a0a; }
.leaflet-control-attribution { font-size: 10px; }
</style></head><body><div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
(function () {
  var start = ${start};
  var map = L.map('map', { zoomControl: true, attributionControl: true });
  var street = L.tileLayer(${JSON.stringify(STREET_TILES)}, { maxZoom: 19, attribution: ${JSON.stringify(STREET_ATTRIBUTION)} });
  var satellite = L.layerGroup([
    L.tileLayer(${JSON.stringify(SATELLITE_TILES)}, { maxZoom: 19, attribution: 'Tiles &copy; Esri' }),
    L.tileLayer(${JSON.stringify(LABEL_TILES)}, { maxZoom: 19, attribution: 'Labels &copy; Esri' })
  ]);
  var radius = start.radius;
  var pin = null, circle = null;

  function send(message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); }

  function place(lat, lng, centre) {
    if (!pin) {
      circle = L.circle([lat, lng], { radius: radius, color: '#2563eb', weight: 2, fillOpacity: 0.15 }).addTo(map);
      pin = L.circleMarker([lat, lng], { radius: 7, color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }).addTo(map);
    } else {
      pin.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
    }
    if (centre) map.setView([lat, lng], Math.max(map.getZoom() || 0, 16));
  }

  window.mukham = {
    moveTo: function (lat, lng) { place(lat, lng, true); },
    setRadius: function (m) { radius = m; if (circle) circle.setRadius(m); },
    setSatellite: function (on) {
      if (on) { map.removeLayer(street); satellite.addTo(map); }
      else { map.removeLayer(satellite); street.addTo(map); }
    }
  };

  (start.satellite ? satellite : street).addTo(map);
  if (start.initial) { map.setView([start.initial.latitude, start.initial.longitude], 17); place(start.initial.latitude, start.initial.longitude, false); }
  else { map.setView([22.5, 79], 4); }

  map.on('click', function (e) {
    place(e.latlng.lat, e.latlng.lng, false);
    send({ type: 'pick', latitude: e.latlng.lat, longitude: e.latlng.lng });
  });
})();
</script></body></html>`;
}

/**
 * The office map: OpenStreetMap (or satellite) with the office pin and its
 * check-in circle. Leaflet runs in a web view, bundled with the app, so the
 * map matches the web app and no script is fetched from the internet.
 */
export const OfficeMap = forwardRef<OfficeMapHandle, Props>(function OfficeMap(
  { initial, radiusMeters, satellite, onPick },
  ref,
) {
  const web = useRef<WebView>(null);
  // Built once; later changes go in through the handle, so the map keeps its zoom.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => mapHtml(initial, radiusMeters, satellite), []);

  const run = (code: string) => web.current?.injectJavaScript(`${code}; true;`);
  useImperativeHandle(ref, () => ({
    moveTo: ({ latitude, longitude }) => run(`window.mukham.moveTo(${Number(latitude)}, ${Number(longitude)})`),
    setRadius: (meters) => run(`window.mukham.setRadius(${Number(meters)})`),
    setSatellite: (on) => run(`window.mukham.setSatellite(${on ? 'true' : 'false'})`),
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'pick' && Number.isFinite(message.latitude) && Number.isFinite(message.longitude)) {
        onPick({ latitude: message.latitude, longitude: message.longitude });
      }
    } catch {
      // Not ours; ignore.
    }
  };

  return (
    <View style={styles.frame}>
      <WebView
        ref={web}
        source={{ html }}
        userAgent={MAP_USER_AGENT}
        onMessage={onMessage}
        // Links (the attribution) open in the browser, never inside the map.
        onShouldStartLoadWithRequest={(request) => {
          if (request.url === 'about:blank' || request.url.startsWith('data:')) return true;
          if (/^https?:/.test(request.url)) Linking.openURL(request.url);
          return false;
        }}
        allowFileAccess={false}
        domStorageEnabled={false}
        mixedContentMode="never"
        setSupportMultipleWindows={false}
        style={styles.map}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    height: 320,
    borderRadius: corner.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
