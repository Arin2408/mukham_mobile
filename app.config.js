// app.json holds the app's settings; this only fills in what differs on
// EAS Build. google-services.json (Android push) is kept out of git, so
// cloud builds get it from the GOOGLE_SERVICES_JSON file variable set in
// the Expo dashboard; on this computer the local file is used.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
