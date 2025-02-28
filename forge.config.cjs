const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: "Piano Typing Game",
    executableName: "piano-typing-game",
    env: {
      WINEARCH: 'win64',
      WINEPREFIX: process.env.HOME + '/.wine',
    },
    win32metadata: {
      CompanyName: 'Rukkhadevata123',
      FileDescription: 'Piano Typing Game',
      OriginalFilename: 'piano-typing-game.exe',
      ProductName: 'Piano Typing Game',
      InternalName: 'piano-typing-game'
    }
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
    // 添加 Windows 安装程序配置
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'piano-typing-game',
        exe: 'piano-typing-game.exe',
        setupIcon: './public/icon.ico',
        // loadingGif: './public/installer.gif', // 可选
        // 移除 setup 字样
        setupExe: 'Piano-Typing-Game-${version}-win64.exe',
        noMsi: true,
        authors: 'Rukkhadevata123',
        remoteRealease: false,
        noDelta: true,
        noRepair: true,
        description: 'A piano typing game built with Electron',
        // Wine 相关配置（仅在 Linux 下构建 Windows 版本时需要）
        wineVer: 'stable',
        wineMono: '/usr/bin/mono',
        wineProgram: '/usr/bin/wine',
        environments: ['wine']
      }
    },
    // 添加 ZIP 便携版配置
    {
      name: '@electron-forge/maker-zip',
      platforms: ['linux', 'win32'],
      config: (arch) => {
        const platform = process.platform;
        return {
          name: platform === 'win32' ? 
            'piano-typing-game-win32-portable' : 
            'piano-typing-game-linux-portable'
        };
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