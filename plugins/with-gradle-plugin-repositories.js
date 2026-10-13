/**
 * Keeps the Gradle Plugin Portal and Google's repository available for
 * build plugins.
 *
 * expo-face-liveness-for-aws-amplify adds a `pluginManagement.repositories`
 * block to android/settings.gradle that lists only mavenCentral(). Declaring
 * any repository there replaces Gradle's default (the Plugin Portal), so
 * plugins such as react-native-worklets' `com.diffplug.spotless` can no
 * longer be found and the Android build fails.
 *
 * Works whichever plugin runs first: if the liveness block is already there,
 * its repositories are extended; if not, the complete block is written, and
 * the liveness plugin then sees the Compose plugin and leaves it alone.
 */
const { withSettingsGradle } = require('@expo/config-plugins');

const COMPOSE_PLUGIN_VERSION = '2.1.20';

const REPOSITORIES = `repositories {
    gradlePluginPortal()
    google()
    mavenCentral()
  }`;

function fixSettings(contents) {
  if (contents.includes('gradlePluginPortal()')) {
    return contents;
  }

  const livenessRepositories = /repositories\s*\{\s*mavenCentral\(\)\s*\}/;
  if (livenessRepositories.test(contents)) {
    return contents.replace(livenessRepositories, REPOSITORIES);
  }

  return contents.replace(
    /pluginManagement\s*\{/,
    `pluginManagement {
  ${REPOSITORIES}
  plugins {
    id("org.jetbrains.kotlin.plugin.compose") version "${COMPOSE_PLUGIN_VERSION}"
  }`,
  );
}

module.exports = function withGradlePluginRepositories(config) {
  return withSettingsGradle(config, (mod) => {
    mod.modResults.contents = fixSettings(mod.modResults.contents);
    return mod;
  });
};

module.exports.fixSettings = fixSettings;
