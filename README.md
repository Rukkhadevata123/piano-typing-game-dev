# 6K音游模拟器

[![GitHub](https://img.shields.io/badge/GitHub-Rukkhadevata123-black?style=flat-square&logo=github)](https://github.com/Rukkhadevata123/piano-typing-game-dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-v6.1.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)

## ⛏️ 项目简介

6K音游模拟器是一个基于网页的音乐游戏模拟器，专注于提升用户的键盘操作速度和准确性。游戏采用六列布局，对应键盘上的 A、S、D 和 J、K、L 键，玩家需要及时按下对应按键来消除下落的方块，获取高分。

## 📌 技术栈

- [Vite](https://vitejs.dev/) 现代前端构建工具
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

## 🎮 游戏玩法

- **键位操作**：
  - 左手： A、S、D
  - 右手： J、K、L
- **计分规则**：
  - 命中得分：+10分
  - 失误扣分：-5分
- **游戏模式**：
  - 按 `R` 切换游戏模式
  - 按 `Q` 切换游戏时长
  - 按 `T` 切换主题
- **难度系统**：
  - 动态难度调整
  - 自适应方块生成

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
```

## 📝 未来计划

- [ ] 自定义键位映射系统
- [ ] 完整的游戏设置界面
- [x] 优化消除动画效果
- [ ] 实现多难度等级
- [ ] 添加在线排行榜
- [ ] 支持 PWA 离线使用
- [ ] 国际化语言支持
- [ ] 使用 Tauri 构建桌面应用

## 🐛 已知问题

- 移动端适配尚不完善
- 部分浏览器可能存在兼容性问题
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
