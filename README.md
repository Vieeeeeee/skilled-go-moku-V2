<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ⚔️ 技能五子棋 - 中二版对战系统 ⚔️

一个基于传统五子棋的荒诞、夸张的技能对战游戏。通过引入各种离谱的"技能"来解构游戏规则，为玩家提供充满策略、意外和幽默的全新对战体验。

## ✨ 游戏特色

- 🎭 **荒诞技能系统**：飞沙走石、静如止水、两极反转、调呈离山、擒拿、力拔山兮等夸张技能
- 💫 **中二风格UI**：炫酷的动画特效、粒子背景、能量条系统
- 🎵 **背景音乐**：沉浸式的对战音乐，可在游戏中自由开关
- 💬 **实时弹幕评论**：AI对手会在对战中发表各种一本正经胡说八道的评论
- 🎬 **技能动画**：每个技能都有独特的全屏动画效果

## 🚀 Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open browser and navigate to the local server address (usually `http://localhost:3000`)

## 🎮 游戏玩法

1. **基础规则**：传统五子棋规则，连成五子即可获胜
2. **技能系统**：通过下棋获得能量点数，消耗能量可释放各种技能
3. **对战AI**：与"张技能五"对战，体验充满戏剧性的对话和技能交锋

## ⚠️ 重要说明

### 🔒 关于话术数据库（dialogue.ts）

**请勿修改 `services/dialogue.ts` 文件中的对话内容！**

该文件中的所有台词均来源于经典小品的文字梗，这些对话是游戏核心幽默和荒诞感的重要来源。修改这些台词会破坏游戏的原始创意和笑点。

如需调整游戏体验，建议：
- ✅ 调整技能参数（消耗、效果）
- ✅ 修改UI样式和动画效果
- ✅ 添加新的技能类型
- ❌ **不要修改对话文本内容**

## 📁 项目结构

```
skilled-go-moku/
├── components/          # React组件
│   ├── Board.tsx       # 棋盘组件
│   └── SkillAnimation.tsx  # 技能动画组件
├── services/           # 核心逻辑
│   ├── dialogue.ts     # 话术数据库（🔒不可修改）
│   └── gameLogic.ts    # 游戏逻辑
├── public/assets/      # 静态资源
│   └── 技能五子棋.mp3  # 背景音乐
├── App.tsx             # 主应用组件
├── types.ts            # TypeScript类型定义
└── index.html          # HTML模板和样式
```

## 🎨 技术栈

- **React 19** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Web Audio API** - 音效和背景音乐

## 🌟 特效说明

- **粒子背景**：飘浮的金色粒子营造神秘氛围
- **能量条**：实时显示可用能量值，并带有脉冲光效
- **技能动画**：全屏技能释放效果，包含粒子爆发、闪光、文字特效
- **弹幕系统**：AI评论以弹幕形式横向滚动显示

## 📝 开发说明

### 音乐控制
- 游戏右上角有音乐开关按钮
- 背景音乐默认关闭，点击可开启/关闭
- 音量已调至适中水平（30%）

### 自定义样式
所有CSS动画和特效都在 `index.html` 的 `<style>` 标签中，可根据需要调整。

---

**Enjoy the epic battle! ⚔️✨**
