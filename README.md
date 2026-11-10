# 管理学期刊模拟审稿流程与审稿意见系统

## 安装与运行

```bash
npm install
npm run dev
```

运行后访问 http://localhost:3003

## 功能

- 上传论文文件（.txt / .md / .docx）或直接粘贴文本
- 模拟完整审稿流程：Managing Editor → Area Editor → Referees → AE → Final Decision
- 三种审稿人类型：理论型、方法型、领域型
- 可选 AI 增强模式（支持 OpenAI 和 Anthropic API）
- 导出审稿报告（HTML / 剪贴板 / 打印）

## 技术栈

React 18 + Vite 5 + TypeScript 5 + mammoth.js
