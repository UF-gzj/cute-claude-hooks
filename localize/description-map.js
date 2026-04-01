/**
 * description-map.js - 命令与技能描述的汉化映射
 * 这部分不依赖 Claude Code CLI 版本，主要用于工作区 .claude/commands
 * 以及 ~/.claude/plugins/cache 中 markdown frontmatter 的 description 字段。
 */

module.exports = {
  // 工作区命令描述
  'Short alias for /core:backend-review-plan': '/core:backend-review-plan 的简写别名',
  'Short alias for /commit': '/commit 的简写别名',
  'Create a commit for uncommitted changes': '为未提交的更改创建提交',
  'Short alias for /core:execute': '/core:execute 的简写别名',
  'Short alias for /bugfix:implement-fix': '/bugfix:implement-fix 的简写别名',
  'Short alias for /core:iterate': '/core:iterate 的简写别名',
  'Short alias for /core:init-project': '/core:init-project 的简写别名',
  'Short alias for /core:plan': '/core:plan 的简写别名',
  'Short alias for /core:prime': '/core:prime 的简写别名',
  'Short alias for /bugfix:rca': '/bugfix:rca 的简写别名',
  'Short alias for /core:refresh-project-context': '/core:refresh-project-context 的简写别名',
  'Short alias for /validation:review': '/validation:review 的简写别名',
  'Short alias for /validation:system-review': '/validation:system-review 的简写别名',
  'Short alias for /validation:validate': '/validation:validate 的简写别名',
  'Short alias for /validation:execution-report': '/validation:execution-report 的简写别名',
  'Implement fix from RCA document': '根据 RCA 文档实施修复',
  'Root cause analysis for bugs and issues': '对缺陷和问题进行根因分析',
  'Create optional backend technical review proposal before implementation planning': '在实现规划前创建可选的后端技术评审建议',
  'Execute an implementation plan step by step': '按步骤执行实现计划',
  'Scan the current project and generate initialization drafts without overwriting existing memory files':
    '扫描当前项目并生成初始化草稿，不覆盖现有记忆文件',
  'Iterate based on validation results': '根据验证结果继续迭代',
  'Create comprehensive feature plan with deep codebase analysis': '结合深入代码库分析创建完整功能计划',
  'Prime agent with codebase understanding and memory loading': '加载代码库理解与项目记忆，完成会话预热',
  'Re-scan the project and refresh generated project context without overwriting hand-maintained memory':
    '重新扫描项目并刷新生成的项目上下文，不覆盖人工维护的记忆',
  'Generate implementation report for system review': '生成用于系统评审的实施报告',
  'Technical code review for quality and bugs': '面向质量和缺陷的技术代码审查',
  'Analyze implementation against plan for process improvements': '对照计划分析实现结果并提出流程改进建议',
  'Run comprehensive validation of the project': '执行项目综合验证',

  // 插件/skills 描述
  'Deprecated - use the superpowers:brainstorming skill instead': '已弃用，请改用 superpowers:brainstorming 技能',
  'Deprecated - use the superpowers:executing-plans skill instead': '已弃用，请改用 superpowers:executing-plans 技能',
  'Deprecated - use the superpowers:writing-plans skill instead': '已弃用，请改用 superpowers:writing-plans 技能',
  'Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies':
    '当面对 2 个以上彼此独立、无需共享状态或串行依赖的任务时使用',
  'Use when you have a written implementation plan to execute in a separate session with review checkpoints':
    '当你已经有书面的实现计划，并准备在独立会话中按评审检查点执行时使用',
  'Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup':
    '当实现已完成、测试已通过，并且需要决定如何集成这部分工作时使用；它会以结构化方式引导你选择合并、提 PR 或清理收尾',
  'Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation':
    '当收到代码评审反馈、准备开始落实建议前使用，尤其适合反馈不够清晰或技术上值得怀疑的场景；要求先验证、再处理，而不是表面附和或盲目照做',
  'Use when completing tasks, implementing major features, or before merging to verify work meets requirements':
    '在任务完成、重大功能实现后，或准备合并前使用，用来确认结果是否满足要求',
  'Use when executing implementation plans with independent tasks in the current session':
    '当在当前会话中执行包含独立子任务的实现计划时使用',
  'Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes':
    '当遇到缺陷、测试失败或任何异常行为时，在提出修复方案前使用',
  'Use when implementing any feature or bugfix, before writing implementation code':
    '当实现任何功能或缺陷修复时，在开始编写实现代码前使用',
  'Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification':
    '当开始一项需要与当前工作区隔离的功能开发，或准备执行实现计划前使用；它会创建隔离的 git worktree，并带有目录选择与安全校验',
  'Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions':
    '在开始任何对话时使用；它会先建立查找和使用 skills 的规则，并要求在任何回复前（包括澄清问题）先调用 Skill 工具',
  'Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always':
    '当你准备宣称工作已完成、已修复或已通过验证时，在提交 commit 或创建 PR 前使用；要求先运行验证命令并确认输出，再做成功结论，始终以证据先于断言',
  'Use when you have a spec or requirements for a multi-step task, before touching code':
    '当你已经有一个多步骤任务的规格或需求，并且还没有开始改代码时使用',
  'Use when creating new skills, editing existing skills, or verifying skills work before deployment':
    '当创建新技能、编辑现有技能，或在发布前验证技能是否正常工作时使用',
};
