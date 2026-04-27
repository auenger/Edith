# Create JARVIS Skill（中文）

> 英文版：`README.md`

这个仓库用于**指导 agent 为某家公司搭建公司专属 JARVIS**：
- 先把“第一条可验证的业务闭环”选对
- 再盘点这条闭环所涉及的 sources / repos / workflows
- 生成最小可用的骨架与技能骨架
- 强制人工确认承载事实的字段
- 通过真实的 START → WORK → END 回写，让 JARVIS 逐步变成熟

## 你应该从哪里开始

- **唯一 golden path：`SKILL.md`**（主干流程、默认顺序、停点、交付物）

> 当前版本里：
> - `references/en/` 与 `references/zh/` 采用**同名镜像文档**结构
> - `templates/en/` 与 `templates/zh/` 采用**同名镜像模板**结构
> - `SKILL.md` 仍然是唯一权威执行路径；中英文辅助文档只是在不同语言下表达同一结构语义

## 这项目是什么 / 不是什么

### 是什么
它是一个“元 skill”：帮助 agent 把一家公司的数字资产、代码仓库、跨团队流程，逐步变成可执行、可维护、可持续迭代的组织能力（而不只是知识库）。

### 不是什么
- 不是“一次性生成一个漂亮的知识仓库”
- 不是把原始材料整段复制进文档
- 不是承诺一个 agent 一次会话就能完成企业级 rollout
- 不是替代 repo 内的权威来源

## 推荐用法（最小可用）

1. 让 agent 阅读 `SKILL.md`
2. 先把“第一条闭环”与“成功信号”说清楚
3. 用模板盘点试点范围内的 sources / repos / workflows
4. 生成最小骨架 + 必要的 skill 骨架
5. 做一次人工确认（不要把占位符当真相）
6. 进入真实试点，通过回写长出真正的组织记忆

## 双语结构

```text
create-jarvis-skill/
├── README.md
├── README.zh.md
├── SKILL.md
├── references/
│   ├── en/
│   │   ├── positioning.md
│   │   ├── company-adaptation.md
│   │   ├── instance-generation-contract.md
│   │   └── ...
│   └── zh/
│       ├── positioning.md
│       ├── company-adaptation.md
│       ├── instance-generation-contract.md
│       └── ...
└── templates/
    ├── en/
    │   ├── jarvis-build-brief.md
    │   ├── source-inventory.md
    │   ├── repo-inventory.md
    │   └── ...
    └── zh/
        ├── jarvis-build-brief.md
        ├── source-inventory.md
        ├── repo-inventory.md
        └── ...
```

## 使用原则

- `SKILL.md` 负责主干方法与执行顺序。
- `references/en/*.md` 与 `references/zh/*.md` 是**一一对应的镜像参考文档**。
- `templates/en/*.md` 与 `templates/zh/*.md` 是**一一对应的镜像模板**。
- 修改结构语义时，应优先更新英文与中文镜像，使同名文件保持契约一致。
- 不要新增 `SKILL.zh.md`；避免出现双份主流程导致漂移。

## 许可说明

© 2026 [Hengshi](https://github.com/hengshi)。保留所有权利。

JARVIS 是付费咨询产品。这个 skill 提供给已获许可的用户，用于启动他们的 JARVIS 知识库建设。

如需咨询许可或合作：
- 🌐 [hengshi.com](https://hengshi.com)
- 📧 hi@hengshi.com
- 📞 15810120570
