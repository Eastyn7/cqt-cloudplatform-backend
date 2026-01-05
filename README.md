> 本项目使用 TypeScript 编写，提供开发模式与生产模式两种启动方式。你只需根据自己的环境选择其一即可。

### 安装依赖

```bash
npm install
```

### 开发环境启动（推荐）

默认使用 **ts-node-dev** 或 **nodemon**

```bash
npm run dev
```

特点：

- 自动重启
- 自动编译 TS
- 适合开发调试

### 生产构建与启动

**构建：**

```bash
npm run build
```

会生成 `dist/` 目录。

**启动：**

```bash
npm start
```

特点：

- 使用 Node.js 直接运行编译后的 JS
- 无需 ts-node 或 nodemon

### 直接运行 TS 文件（不推荐但可用）

如需直接以 ts-node 启动：

```bash
npx ts-node src/app.ts
```

> 仅用于调试，一般不作为正式流程。
