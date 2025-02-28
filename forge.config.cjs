const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: "Piano Typing Game",
    executableName: "piano-typing-game",
    // 移除 Windows/macOS 相关配置
  },
  
  rebuildConfig: {},
  
  makers: [
    // 只保留 Linux DEB 配置
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Rukkhadevata123',
          homepage: 'https://github.com/Rukkhadevata123',
          description: 'A piano typing game built with Electron',
          productName: 'Piano Typing Game',
          genericName: 'Piano Typing Game',
          categories: ['Game'],
          icon: {
            '16x16': 'public/icons/linux/16x16/icon.png',
            '32x32': 'public/icons/linux/32x32/icon.png',
            '48x48': 'public/icons/linux/48x48/icon.png',
            '64x64': 'public/icons/linux/64x64/icon.png',
            '128x128': 'public/icons/linux/128x128/icon.png',
            '256x256': 'public/icons/linux/256x256/icon.png',
            '512x512': 'public/icons/linux/512x512/icon.png'
          }
        }
      }
    },
    // 添加 ZIP 便携版配置
    {
      name: '@electron-forge/maker-zip',
      platforms: ['linux'],
      config: {
        // 可选：指定输出文件名
        name: 'piano-typing-game-portable'
      }
    }
  ],
  
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};