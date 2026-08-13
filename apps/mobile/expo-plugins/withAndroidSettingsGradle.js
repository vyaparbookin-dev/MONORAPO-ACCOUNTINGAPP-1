const { withSettingsGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSettingsGradle(config) {
  return withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents.replace(
        /include\s+':expo-modules-autolinking'.*$/m,
        `include ':expo-modules-autolinking'\nproject(':expo-modules-autolinking').projectDir = new File(settingsDir, '../../node_modules/expo-modules-autolinking/android')`
      );
    }
    return config;
  });
};
