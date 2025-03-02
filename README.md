
# 6K音游模拟器

[![GitHub](https://img.shields.io/badge/GitHub-Rukkhadevata123-black?style=flat-square&logo=github)](https://github.com/Rukkhadevata123/piano-typing-game-dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-v6.1.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Electron](https://img.shields.io/badge/Electron-v28.2.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)

## ⛏️ 项目简介

6K音游模拟器是一个基于网页的音乐游戏模拟器，专注于提升用户的键盘操作速度和准确性。游戏采用六列布局，对应键盘上的 A、S、D 和 J、K、L 键，玩家需要及时按下对应按键来消除下落的方块，获取高分。

## 📌 技术栈

- [Vite](https://vitejs.dev/) 现代前端构建工具
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用开发框架
- JavaScript (ES6+) 面向对象编程
- HTML5 + CSS3 响应式设计
- LocalStorage 数据持久化
- 模块化开发架构

## ✨ 特性

- 🎯 **实时统计**
  - 分数实时计算
  - 准确率动态显示
  - CPS（每秒点击次数）监测
  - 连击数统计
- 📊 **游戏模式**
  - 整行模式：一次性消除整行方块
  - 单块模式：逐个消除方块
- ⚡ **主题系统**
  - 多种颜色主题切换
  - 彩虹主题特效
- ⏱️ **时间系统**
  - 多种时长可选(60s-300s)
  - 游戏进度实时显示
- 📱 **移动适配**
  - 响应式布局
  - 触摸屏支持
  - 自适应界面
- 💾 **数据存储**
  - 历史记录保存
  - 主题偏好记忆
  - 最高分保存
- 🧮 **高级计分系统**
  - 动态连击倍率
  - 里程碑奖励机制
  - 智能惩罚算法

## 🎮 游戏玩法

- **键位操作**：
  - 左手： A、S、D
  - 右手： J、K、L
- **游戏模式**：
  - 按 `R` 切换游戏模式
  - 按 `Q` 切换游戏时长
  - 按 `T` 切换主题
- **难度系统**：
  - 动态难度调整
  - 自适应方块生成

### 📊 高级计分系统

游戏采用全新计分机制，更具挑战性和策略性：

- **基础得分**：
  - 命中得分：+10分
  - 失误扣分：-5分

- **连击倍率**：
  - 连击越高，倍率越大（非线性增长）
  - 前期增长快速，后期平缓但持续增长
  - 100连击时约为2.6倍，1000连击时约为3.4倍

- **里程碑奖励**：
  - 特定连击数（25, 42, 50, 69, 75, 100...）触发额外奖励
  - 奖励分数采用指数增长公式
  - 较高里程碑可获得显著加分（最高800分）

- **连击中断惩罚**：
  - 失误时将根据当前连击数计算惩罚
  - 分段惩罚机制：低连击轻微惩罚，高连击惩罚较重但增速放缓
  - 惩罚上限为70连击，避免过度打击积极性

- **综合加成**：
  - 准确率影响：准确率越高，得分越高
  - CPS加成：点击速度越快，加成越高
  - 游戏进度影响：游戏越接近尾声，倍率越高

### 📱 移动端使用说明

为了获得最佳游戏体验:

- 请将设备横屏使用
- 推荐使用平板等较大屏幕设备
- 竖屏状态下会显示横屏提示

## 📦 项目结构

```plaintext
piano-typing-game/
├── public/                 # 静态资源
│   └── audio/             # 音效资源
├── src/                   # 源代码目录
│   ├── js/               # JavaScript 文件
│   │   ├── Game/         # 游戏核心逻辑
│   │   ├── core/         # 核心功能模块
│   │   │   ├── score/    # 得分系统
│   │   │   └── stats/    # 统计系统
│   │   ├── handlers/     # 事件处理器
│   │   ├── ui/           # UI 相关组件
│   │   ├── utils/        # 工具函数
│   │   ├── config/       # 游戏配置
│   │   └── main.js       # JS入口文件
│   ├── css/              # 样式文件
│   │   ├── components/   # 组件样式
│   │   ├── layout/       # 布局样式
│   │   ├── utils/        # 样式工具
│   │   └── style.css     # CSS入口文件
├── dist/                  # 构建输出目录
├── index.html            # 入口HTML文件
├── vite.config.js        # Vite配置文件
├── package.json          # 项目配置文件
├── .eslintrc.js         # ESLint配置
├── .prettierrc          # Prettier配置
└── LICENSE              # MIT许可证
```

## 🚀 快速开始

### 在线体验

访问 [6K音游模拟器](https://yoimiyalove.top/piano-typing-game/)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Rukkhadevata123/piano-typing-game-dev.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 使用ESLint检查代码
npm run lint

# 格式化代码
npm run format

# 与Electron有关的命令请查看package.json
```

### Linux 用户

我们为 Linux 用户提供了两种选择：

1. DEB 包安装

```bash
# 下载并安装 DEB 包
sudo dpkg -i piano-typing-game_1.2.0_amd64.deb
```

2. 便携版（推荐）

- 下载 `piano-typing-game-linux-portable.zip`
- 解压后运行可执行文件
- 支持任意位置运行

### Windows 用户

提供便携版本：

- 下载 `piano-typing-game-win32-portable.zip`
- 解压后运行 `piano-typing-game.exe`
- 支持U盘运行，无需安装

注意事项：

- 支持 Windows 10/11 64位系统
- 首次运行可能需要 Windows Defender 确认

## 📝 未来计划

- [ ] 自定义键位映射系统
- [ ] 完整的游戏设置界面
- [x] 优化消除动画效果
- [x] 实现高级计分系统
- [ ] 添加在线排行榜
- [ ] 支持 PWA 离线使用
- [ ] 国际化语言支持
- [ ] 使用 Tauri 构建桌面应用

## 🐛 已知问题

- 移动端适配尚不完善
- 部分浏览器可能存在兼容性问题
- `Electron`体积较大
- 可能有未发现的潜在 Bug

## 🤝 参与贡献

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📜 许可证

MIT © [Rukkhadevata123](https://github.com/Rukkhadevata123/)

## 🙏 鸣谢

- Claude 3.5 Sonnet 帮助提供了大量代码
- 感谢所有为项目提供反馈和建议的用户
- 使用 [Vite](https://vitejs.dev/) 构建工具
- 开源协议遵循 MIT 许可
- 使用的音效来自于[arcxingye的EatKano项目](https://github.com/arcxingye/EatKano)

---
*注：本项目仍在持续开发中，欢迎提供建议和反馈！*
