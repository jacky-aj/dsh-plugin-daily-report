window.__ModuleLoader__.load({
  id: "dsh-plugin-daily-report",
  factory(require) {
    const React = require("react");
    const h = React.createElement;

    const NS = "daily-report";
    const API = "/daily-report";
    const NL = String.fromCharCode(10);

    const zh = {
      "panel.title": "日报汇总",
      "page.title": "日报汇总",
      "page.desc": "按天汇总 Git 提交与本地文档，导出可直接查看的 XLSX 日报。",
      loading: "正在读取配置…",
      "range.title": "汇总时间范围",
      "range.desc": "默认当月月初到月底；可改为任意日期范围。",
      "range.start": "开始日期",
      "range.end": "结束日期",
      "range.thisMonth": "本月",
      "range.lastMonth": "上月",
      "range.last7": "最近 7 天",
      "range.days": "天",
      "range.total": "共",
      "git.title": "Git 仓库",
      "git.desc": "支持远程地址或本地仓库；多个仓库、多个分支会合并到同一份日报。",
      "git.add": "添加仓库",
      "git.location": "仓库地址或本地路径",
      "git.branch": "分支",
      "git.label": "显示名称（可选）",
      "git.placeholder": "https://…/repo.git 或 D:\\code\\repo",
      "git.empty": "还没有 Git 仓库。",
      "git.mine": "仅统计我的提交",
      "git.mineHint": "按各仓库 git config user.email / user.name 过滤",
      "scan.open": "扫描目录",
      "scan.title": "从目录批量添加",
      "scan.desc": "扫描目录下最多 6 层的 Git 仓库，已存在的会自动跳过。",
      "scan.placeholder": "要扫描的目录，例如 E:\\sunline\\SBG",
      "scan.scan": "扫描并添加",
      "scan.scanning": "正在扫描…",
      "scan.pick": "选择目录",
      "scan.found": "发现",
      "scan.added": "新增",
      "scan.empty": "该目录下没有发现 Git 仓库。",
      "scan.noPicker": "请手动输入目录路径。",
      "scan.failed": "扫描目录失败",
      "docs.title": "本地文档",
      "docs.desc": "文件或目录；目录会递归扫描 md、txt、docx、html 等笔记文件。",
      "docs.add": "添加文档/目录",
      "docs.location": "文件或目录路径",
      "docs.label": "显示名称（可选）",
      "docs.placeholder": "C:\\notes 或 ./docs",
      "docs.empty": "还没有本地文档。",
      "ai.title": "AI 分析",
      "ai.desc": "使用当前默认模型分析提交说明、代码变更和文档摘要，生成按天简要总结。",
      "ai.enable": "启用 AI 分析",
      "ai.model": "当前模型：",
      "ai.unavailable": "当前没有可用的默认模型。",
      "ai.cost": "会增加生成时间和模型 token 消耗。",
      "progress.start": "正在创建生成任务…",
      "progress.done": "生成完成，正在下载…",
      "progress.preview": "生成完成，请预览并编辑后导出 XLSX。",
      "progress.hint": "AI 分析需要调用模型，耗时通常比普通汇总更长；请保持页面打开。",
      optional: "可选",
      remove: "移除",
      generate: "生成日报",
      "format.label": "格式",
      "format.xlsx": "XLSX 工作簿",
      "format.markdown": "Markdown 文档",
      "format.csv": "CSV 表格",
      "format.html": "HTML 网页",
      generating: "正在收集并生成…",
      "save.saving": "正在保存设置…",
      "save.savingShort": "正在保存…",
      "save.button": "保存设置",
      "save.saved": "设置已保存",
      "save.failed": "设置保存失败",
      "result.title": "生成结果",
      "result.download": "下载 XLSX",
      "result.stats.commits": "Git 提交",
      "result.stats.docs": "文档",
      "result.stats.activeDays": "有记录天数",
      "result.stats.sources": "数据源",
      "result.unit.commits": "次提交",
      "result.unit.docs": "份文档",
      "result.sources": "数据源状态",
      "result.warnings": "提示",
      "result.ai.title": "AI 分析",
      "result.ai.hint": "逐日 AI 摘要已写入 XLSX 的「AI分析」工作表。",
      "result.ai.failed": "AI 分析未完成",
      "preview.title": "生成结果预览",
      "preview.desc": "先检查并编辑每日 AI 摘要、补充非代码工作，再导出 XLSX。",
      "preview.export": "导出",
      "preview.expandAll": "全部展开",
      "preview.collapseAll": "全部收起",
      "preview.exporting": "正在导出…",
      "preview.regenerateDay": "重新分析这天",
      "preview.regenerating": "分析中…",
      "preview.overall": "总体 AI 总结",
      "preview.aiSummary": "AI 摘要（可编辑）",
      "preview.raw": "原始汇总",
      "preview.manual": "手动补充",
      "preview.addManual": "添加手动工作项",
      "preview.manualPlaceholder": "例如：参加需求评审、处理线上问题",
      "preview.noDays": "没有可预览的日报内容。",
      "preview.aiFailed": "AI 分析未完成，仍可补充手动工作项后导出。",
      "result.ready": "已生成",
      "status.ok": "正常",
      "status.warn": "有提示",
      "status.error": "失败",
      "error.noSources": "请至少添加一个 Git 仓库或本地文档。",
      "error.invalidRange": "日期范围无效，请检查开始和结束日期。",
      "error.rangeTooLong": "时间范围最长支持 366 天。",
      "error.generate": "生成失败",
      "error.network": "无法连接本地服务，请确认插件已启用。",
      "error.save": "保存失败",
      "error.allSourcesFailed": "所有数据源都读取失败。",
      "footer.tip": "Git 使用系统 git 与你的凭据配置；远程仓库会缓存在 DSH 数据目录。",
      "page.footer": "数据仅在本机处理；生成的 XLSX 包含日报汇总、Git明细、文档明细、数据源与说明。",
      "misc.unknown": "未知错误",
      "misc.retry": "重试",
    };

    const en = {
      "panel.title": "Daily report",
      "page.title": "Daily report",
      "page.desc": "Aggregate Git commits and local notes by day, then export an XLSX report.",
      loading: "Loading configuration…",
      "range.title": "Date range",
      "range.desc": "Defaults to the current month; change it to any range.",
      "range.start": "Start date",
      "range.end": "End date",
      "range.thisMonth": "This month",
      "range.lastMonth": "Last month",
      "range.last7": "Last 7 days",
      "range.days": "days",
      "range.total": "Total",
      "git.title": "Git repositories",
      "git.desc": "Remote URLs or local repositories; multiple repositories and branches are merged into one report.",
      "git.add": "Add repository",
      "git.location": "Repository URL or local path",
      "git.branch": "Branch",
      "git.label": "Display name (optional)",
      "git.placeholder": "https://…/repo.git or D:\\code\\repo",
      "git.empty": "No repositories yet.",
      "git.mine": "Only my commits",
      "git.mineHint": "Filter by each repository's git config user.email / user.name",
      "scan.open": "Scan directory",
      "scan.title": "Add repositories from a directory",
      "scan.desc": "Scans up to 6 levels deep for Git repositories and skips ones already added.",
      "scan.placeholder": "Directory to scan, e.g. E:\\sunline\\SBG",
      "scan.scan": "Scan and add",
      "scan.scanning": "Scanning…",
      "scan.pick": "Choose directory",
      "scan.found": "Found",
      "scan.added": "Added",
      "scan.empty": "No Git repositories found in that directory.",
      "scan.noPicker": "Enter the directory path manually.",
      "scan.failed": "Could not scan the directory",
      "docs.title": "Local documents",
      "docs.desc": "A file or directory; directories are scanned recursively for md, txt, docx, html and similar notes.",
      "docs.add": "Add document/directory",
      "docs.location": "File or directory path",
      "docs.label": "Display name (optional)",
      "docs.placeholder": "C:\\notes or ./docs",
      "docs.empty": "No documents yet.",
      "ai.title": "AI analysis",
      "ai.desc": "Use the current default model to analyze commit messages, code changes and document excerpts into concise per-day summaries.",
      "ai.enable": "Enable AI analysis",
      "ai.model": "Current model: ",
      "ai.unavailable": "No default model is available.",
      "ai.cost": "This adds generation time and model token usage.",
      "progress.start": "Creating the report job…",
      "progress.done": "Done. Preparing the download…",
      "progress.preview": "Generated. Review, edit, then export the XLSX.",
      "progress.hint": "AI analysis calls a model, so it usually takes longer than a plain digest. Keep this page open.",
      optional: "optional",
      remove: "Remove",
      generate: "Generate report",
      "format.label": "Format",
      "format.xlsx": "XLSX workbook",
      "format.markdown": "Markdown document",
      "format.csv": "CSV table",
      "format.html": "HTML page",
      generating: "Collecting and generating…",
      "save.saving": "Saving settings…",
      "save.savingShort": "Saving…",
      "save.button": "Save settings",
      "save.saved": "Settings saved",
      "save.failed": "Could not save settings",
      "result.title": "Result",
      "result.download": "Download XLSX",
      "result.stats.commits": "Git commits",
      "result.stats.docs": "Documents",
      "result.stats.activeDays": "Days with data",
      "result.stats.sources": "Data sources",
      "result.unit.commits": "commits",
      "result.unit.docs": "documents",
      "result.sources": "Source status",
      "result.warnings": "Warnings",
      "result.ai.title": "AI analysis",
      "result.ai.hint": "Per-day AI summaries are included in the AI analysis worksheet.",
      "result.ai.failed": "AI analysis did not complete",
      "preview.title": "Review before export",
      "preview.desc": "Check and edit each day's AI summary, add non-code work, then export the XLSX.",
      "preview.export": "Export",
      "preview.expandAll": "Expand all",
      "preview.collapseAll": "Collapse all",
      "preview.exporting": "Exporting…",
      "preview.regenerateDay": "Re-analyze this day",
      "preview.regenerating": "Analyzing…",
      "preview.overall": "Overall AI summary",
      "preview.aiSummary": "AI summary (editable)",
      "preview.raw": "Raw digest",
      "preview.manual": "Manual items",
      "preview.addManual": "Add manual work item",
      "preview.manualPlaceholder": "e.g. attended a review, handled an incident",
      "preview.noDays": "There is nothing to preview.",
      "preview.aiFailed": "AI analysis did not complete; you can still add manual items and export.",
      "result.ready": "Generated",
      "status.ok": "OK",
      "status.warn": "Warning",
      "status.error": "Failed",
      "error.noSources": "Add at least one Git repository or local document.",
      "error.invalidRange": "The date range is invalid. Check the start and end dates.",
      "error.rangeTooLong": "The range can cover at most 366 days.",
      "error.generate": "Could not generate the report",
      "error.network": "Could not reach the local plugin service. Make sure the plugin is enabled.",
      "error.save": "Could not save",
      "error.allSourcesFailed": "All data sources failed.",
      "footer.tip": "Git uses the system git and your existing credentials; remote repositories are cached in the DSH data directory.",
      "page.footer": "All processing happens locally; the XLSX contains the daily summary, Git details, document details, sources and notes.",
      "misc.unknown": "Unknown error",
      "misc.retry": "Retry",
    };

    function uid() {
      return "s" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    }

    function pad2(value) {
      return String(value).padStart(2, "0");
    }

    function formatDate(date) {
      return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
    }

    function currentMonthRange() {
      const now = new Date();
      return {
        start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    }

    function lastMonthRange() {
      const now = new Date();
      return {
        start: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: formatDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    }

    function last7Range() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return { start: formatDate(start), end: formatDate(now) };
    }

    function daysBetween(start, end) {
      if (!start || !end) return 0;
      const first = new Date(start + "T00:00:00");
      const last = new Date(end + "T00:00:00");
      if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return 0;
      return Math.round((last.getTime() - first.getTime()) / 86400000) + 1;
    }

    function normalizeClientSettings(raw) {
      const source = raw && typeof raw === "object" ? raw : {};
      const git = Array.isArray(source.git)
        ? source.git.map((item) => ({
            _key: uid(),
            location: typeof item.location === "string" ? item.location : "",
            branch: typeof item.branch === "string" ? item.branch : "",
            label: typeof item.label === "string" ? item.label : "",
          }))
        : [];
      const docs = Array.isArray(source.docs)
        ? source.docs.map((item) => {
            const value = typeof item === "string" ? { location: item, label: "" } : item || {};
            return {
              _key: uid(),
              location: typeof value.location === "string" ? value.location : "",
              label: typeof value.label === "string" ? value.label : "",
            };
          })
        : [];
      return { git, docs, mineOnly: source.mineOnly !== false };
    }

    function cleanSettings(settings, aiEnabled, range, format) {
      return {
        git: settings.git
          .map((item) => ({
            location: item.location.trim(),
            branch: item.branch.trim(),
            label: item.label.trim(),
          }))
          .filter((item) => item.location.length > 0),
        docs: settings.docs
          .map((item) => ({
            location: item.location.trim(),
            label: item.label.trim(),
          }))
          .filter((item) => item.location.length > 0),
        aiEnabled: aiEnabled !== false,
        mineOnly: settings.mineOnly !== false,
        format: FORMAT_OPTIONS.includes(format) ? format : "xlsx",
        range:
          range && typeof range.start === "string" && typeof range.end === "string"
            ? { start: range.start, end: range.end }
            : null,
      };
    }

    function decodeBase64Json(value) {
      const binary = window.atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    }

    function triggerDownload(url, filename) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    function currentLocaleId(ctx) {
      try {
        const snapshot = ctx.locale.getLocale();
        return snapshot && typeof snapshot.id === "string" ? snapshot.id : "zh";
      } catch {
        return "zh";
      }
    }

    const FORMAT_OPTIONS = ["xlsx", "markdown", "csv", "html"];

    function formatLabel(format, t) {
      if (format === "markdown") return t("format.markdown", "Markdown");
      if (format === "csv") return t("format.csv", "CSV");
      if (format === "html") return t("format.html", "HTML");
      return t("format.xlsx", "XLSX");
    }

    function formatExtension(format) {
      return format === "markdown" ? "md" : format;
    }

    function formatShortLabel(format) {
      return format === "markdown" ? "Markdown" : format.toUpperCase();
    }

    function useTranslate(ctx) {
      const [, force] = React.useState(0);
      React.useEffect(() => {
        return ctx.locale.subscribe(() => force((value) => value + 1));
      }, [ctx]);
      const bound = ctx.locale.bind(NS);
      return function translate(key, fallback) {
        const value = bound(key);
        if (value === key && typeof fallback === "string") return fallback;
        return value;
      };
    }

    const CSS = [
      ".dsdr-root { height: 100%; overflow: auto; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }",
      ".dsdr-page { box-sizing: border-box; max-width: 1080px; margin: 0 auto; padding: 28px 28px 56px; display: flex; flex-direction: column; gap: 16px; }",
      ".dsdr-hero { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 14px; }",
      ".dsdr-hero-copy { flex: 1; min-width: 0; }",
      ".dsdr-hero-action { display: flex; flex: none; flex-direction: column; align-items: flex-end; gap: 5px; margin-left: auto; }",
      ".dsdr-hero-buttons { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }",
      ".dsdr-save-btn { min-height: 38px; background: #3b4046; border-color: #3b4046; color: #ffffff; font-weight: 600; }",
      ".dsdr-save-btn:hover { background: #292d31; border-color: #292d31; }",
      ".dsdr-save-btn:disabled { background: #666b70; border-color: #666b70; color: #ffffff; opacity: .8; }",
      ".dsdr-generate { min-height: 38px; padding: 9px 16px; font-size: 13px; white-space: nowrap; }",
      ".dsdr-btn-with-icon { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }",
      ".dsdr-split { position: relative; display: inline-flex; align-items: stretch; }",
      ".dsdr-split .dsdr-generate { border-radius: 8px 0 0 8px; }",
      ".dsdr-split-toggle { min-height: 38px; padding: 0 9px; border-radius: 0 8px 8px 0; border-left: 1px solid rgba(255, 255, 255, .32); }",
      ".dsdr-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 30; min-width: 190px; padding: 5px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 10px 28px rgba(0, 0, 0, .2); }",
      ".dsdr-menu-title { padding: 5px 8px 4px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }",
      ".dsdr-menu-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 7px 8px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; text-align: left; cursor: pointer; }",
      ".dsdr-menu-item:hover { background: var(--dsw-alias-bg-layer-2); }",
      ".dsdr-menu-item.is-active { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }",
      ".dsdr-menu-check { width: 14px; color: #146b5a; text-align: center; }",
      ".dsdr-save { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }",
      ".dsdr-mark { flex: none; width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); }",
      ".dsdr-title { margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; }",
      ".dsdr-sub { margin: 2px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }",
      ".dsdr-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 16px 18px; }",
      ".dsdr-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }",
      ".dsdr-card-title { font-size: 14px; line-height: 22px; font-weight: 600; }",
      ".dsdr-card-desc { margin-top: 2px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }",
      ".dsdr-range { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 10px; align-items: end; }",
      ".dsdr-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }",
      ".dsdr-label { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }",
      ".dsdr-input { box-sizing: border-box; width: 100%; height: 32px; padding: 4px 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; }",
      ".dsdr-input:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }",
      ".dsdr-input::placeholder { color: var(--dsw-alias-label-secondary); opacity: .75; }",
      ".dsdr-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }",
      ".dsdr-btn { box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; font-weight: 500; line-height: 20px; padding: 5px 11px; cursor: pointer; }",
      ".dsdr-btn:hover { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-brand-primary); }",
      ".dsdr-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }",
      ".dsdr-btn:disabled { opacity: .7; cursor: not-allowed; }",
      ".dsdr-btn-primary { background: #146b5a; border-color: #146b5a; color: #ffffff; font-weight: 600; box-shadow: 0 2px 6px rgba(0, 0, 0, .18); }",
      ".dsdr-btn-primary:hover { background: #0f5547; border-color: #0f5547; opacity: 1; }",
      ".dsdr-btn-primary:disabled { background: #6b8a82; border-color: #6b8a82; color: #ffffff; opacity: .8; }",
      ".dsdr-btn-danger { border-color: transparent; background: transparent; color: var(--dsw-alias-state-error-primary); font-weight: 600; }",
      ".dsdr-btn-danger:hover { background: var(--dsw-alias-bg-layer-2); border-color: transparent; }",
      ".dsdr-check { display: inline-flex; align-items: center; gap: 7px; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 20px; cursor: pointer; white-space: nowrap; }",
      ".dsdr-check input { width: 15px; height: 15px; margin: 0; accent-color: #15557f; cursor: pointer; }",
      ".dsdr-check.is-disabled { color: var(--dsw-alias-label-secondary); cursor: not-allowed; opacity: .7; }",
      ".dsdr-check.is-disabled input { cursor: not-allowed; }",
      ".dsdr-progress-card { display: flex; flex-direction: column; gap: 7px; }",
      ".dsdr-progress-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); }",
      ".dsdr-progress-value { flex: none; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }",
      ".dsdr-progress-track { height: 6px; overflow: hidden; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); }",
      ".dsdr-progress-fill { height: 100%; border-radius: 999px; background: #15557f; transition: width .3s ease; }",
      ".dsdr-progress-track.is-indeterminate .dsdr-progress-fill { width: 35% !important; animation: dsdr-progress 1.2s ease-in-out infinite; }",
      "@keyframes dsdr-progress { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }",
      ".dsdr-ai-result { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }",
      ".dsdr-preview-overall { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }",
      ".dsdr-textarea { box-sizing: border-box; width: 100%; min-height: 64px; resize: vertical; padding: 7px 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 19px; }",
      ".dsdr-textarea:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }",
      ".dsdr-manual-add { display: grid; grid-template-columns: 145px minmax(0, 1fr) auto; gap: 8px; align-items: center; margin: 10px 0 14px; }",
      ".dsdr-preview-list { display: flex; flex-direction: column; gap: 10px; }",
      ".dsdr-preview-day { display: flex; flex-direction: column; gap: 7px; padding: 11px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }",
      ".dsdr-preview-day-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }",
      ".dsdr-preview-toggle { display: flex; flex: 1; align-items: center; flex-wrap: wrap; gap: 4px 6px; min-width: 0; padding: 0; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; text-align: left; cursor: pointer; }",
      ".dsdr-preview-toggle:hover .dsdr-preview-date { color: var(--dsw-alias-brand-primary); }",
      ".dsdr-preview-chevron { flex: none; width: 13px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 20px; }",
      ".dsdr-preview-badge { display: inline-flex; align-items: center; padding: 1px 6px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 16px; }",
      ".dsdr-preview-body { display: flex; flex-direction: column; gap: 7px; margin-top: 2px; padding-top: 8px; border-top: 1px dashed var(--dsw-alias-border-l1); }",
      ".dsdr-preview-date { font-size: 13px; line-height: 20px; font-weight: 600; }",
      ".dsdr-preview-raw { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 19px; }",
      ".dsdr-manual-list { display: flex; flex-wrap: wrap; gap: 6px; }",
      ".dsdr-manual-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; padding: 2px 6px 2px 9px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 11px; line-height: 18px; overflow-wrap: anywhere; }",
      ".dsdr-manual-remove { border: 0; background: transparent; color: var(--dsw-alias-state-error-primary); font: inherit; font-size: 14px; line-height: 16px; padding: 0 1px; cursor: pointer; }",
      ".dsdr-ai-text { margin-top: 5px; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 20px; white-space: pre-wrap; }",
      ".dsdr-filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin: 0 0 10px; }",
      ".dsdr-scan { display: flex; flex-direction: column; gap: 7px; margin: 0 0 12px; padding: 12px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }",
      ".dsdr-scan-title { font-size: 13px; line-height: 20px; font-weight: 600; }",
      ".dsdr-scan-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }",
      ".dsdr-source { display: grid; grid-template-columns: minmax(0, 1.5fr) 150px 34px; gap: 8px; align-items: end; margin-top: 8px; }",      ".dsdr-source-docs { grid-template-columns: minmax(0, 1fr) minmax(120px, .35fr) 34px; }",
      ".dsdr-icon-btn { width: 32px; height: 32px; padding: 0; display: grid; place-items: center; line-height: 1; font-size: 18px; }",
      ".dsdr-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }",
      ".dsdr-error { border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 9px; color: var(--dsw-alias-state-error-primary); background: transparent; padding: 9px 12px; font-size: 12px; line-height: 18px; white-space: pre-wrap; }",
      ".dsdr-notice { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }",
      ".dsdr-ok { color: var(--dsw-alias-state-success-primary); }",
      ".dsdr-warn { color: var(--dsw-alias-state-warn-primary); }",
      ".dsdr-bad { color: var(--dsw-alias-state-error-primary); }",
      ".dsdr-empty { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; padding: 10px 0 2px; }",
      ".dsdr-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }",
      ".dsdr-stat { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 10px 12px; background: var(--dsw-alias-bg-layer-2); }",
      ".dsdr-stat-value { font-size: 20px; line-height: 26px; font-weight: 600; }",
      ".dsdr-stat-label { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }",
      ".dsdr-list { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }",
      ".dsdr-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 18px; }",
      ".dsdr-dot { flex: none; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }",
      ".dsdr-dot.ok { background: var(--dsw-alias-state-success-primary); }",
      ".dsdr-dot.warn { background: var(--dsw-alias-state-warn-primary); }",
      ".dsdr-dot.error { background: var(--dsw-alias-state-error-primary); }",
      ".dsdr-source-name { font-weight: 500; }",
      ".dsdr-source-meta { color: var(--dsw-alias-label-secondary); }",
      ".dsdr-code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; }",
      ".dsdr-footer { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }",
      ".dsdr-spacer { flex: 1; }",
      "@media (max-width: 780px) { .dsdr-page { padding: 20px 16px 40px; } .dsdr-hero-action { flex: 1 0 100%; width: 100%; align-items: stretch; margin-left: 0; } .dsdr-hero-buttons { width: 100%; } .dsdr-hero-buttons .dsdr-btn { flex: 1; } .dsdr-split { flex: 1; } .dsdr-split .dsdr-generate { flex: 1; } .dsdr-generate { width: 100%; } .dsdr-range { grid-template-columns: 1fr 1fr; } .dsdr-range .dsdr-actions { grid-column: 1 / -1; } .dsdr-stats { grid-template-columns: 1fr 1fr; } .dsdr-scan-row { grid-template-columns: 1fr; } .dsdr-manual-add { grid-template-columns: 1fr; } .dsdr-source, .dsdr-source-docs { grid-template-columns: 1fr; } .dsdr-source .dsdr-icon-btn { justify-self: end; } }",
    ].join(NL);

    function installStyles(ctx) {
      const style = document.createElement("style");
      style.dataset.plugin = "dsh-plugin-daily-report";
      style.textContent = CSS;
      document.head.appendChild(style);
      ctx.effect(() => () => style.remove(), "daily-report: styles");
    }

    function Icon() {
      return h(
        "svg",
        { viewBox: "0 0 64 64", width: 26, height: 26, "aria-hidden": true },
        h("rect", { width: 64, height: 64, rx: 14, fill: "#1f4e79" }),
        h("path", { d: "M17 19h30a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V22a3 3 0 0 1 3-3z", fill: "#f7fbff" }),
        h("path", { d: "M14 27h36v4H14z", fill: "#8db9e2" }),
        h("path", { d: "M22 14v8M42 14v8", stroke: "#bfe0ff", strokeWidth: 4, strokeLinecap: "round" }),
        h("path", { d: "M22 38h7v7h-7zM33 38h7v7h-7zM22 48h7v3h-7z", fill: "#1f7a5c" }),
        h("path", { d: "M33 48h9", stroke: "#e0a526", strokeWidth: 3, strokeLinecap: "round" }),
      );
    }

    function PanelIcon(props) {
      const size = Number(props && props.size) > 0 ? Number(props.size) : 20;
      return h(
        "svg",
        {
          viewBox: "0 0 24 24",
          width: size,
          height: size,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.6,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true,
        },
        h("rect", { x: 3.5, y: 4.5, width: 17, height: 15, rx: 2.5 }),
        h("path", { d: "M8 3v3M16 3v3M3.5 9h17" }),
        h("path", { d: "M8 13h3M8 16.5h3M14 13h2.5M14 16.5h2.5" }),
      );
    }

    function SaveIcon(props) {
      const size = Number(props && props.size) > 0 ? Number(props.size) : 15;
      return h(
        "svg",
        {
          viewBox: "0 0 24 24",
          width: size,
          height: size,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.8,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true,
        },
        h("path", { d: "M5 3.5h11l3.5 3.5v13.5H5z" }),
        h("path", { d: "M8 3.5v5h7v-5M8 20.5v-6h8v6" }),
      );
    }

    function GenerateIcon(props) {
      const size = Number(props && props.size) > 0 ? Number(props.size) : 15;
      return h(
        "svg",
        {
          viewBox: "0 0 24 24",
          width: size,
          height: size,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.8,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true,
        },
        h("path", { d: "M6 3.5h8l4 4v13H6z" }),
        h("path", { d: "M14 3.5v4h4M9 12h6M9 15.5h4" }),
        h("path", { d: "M18.5 16.5v4M16.5 18.5h4" }),
      );
    }

    function ChevronIcon(props) {
      const size = Number(props && props.size) > 0 ? Number(props.size) : 12;
      return h(
        "svg",
        {
          viewBox: "0 0 24 24",
          width: size,
          height: size,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true,
        },
        h("path", { d: "M6 9l6 6 6-6" }),
      );
    }

    function DailyReportView(props) {
      const ctx = props.ctx;
      const t = useTranslate(ctx);
      const [settings, setSettings] = React.useState({ git: [], docs: [] });
      const [range, setRange] = React.useState(currentMonthRange);
      const [exportFormat, setExportFormat] = React.useState("xlsx");
      const [formatMenuOpen, setFormatMenuOpen] = React.useState(false);
      const [aiInfo, setAiInfo] = React.useState({ available: false, provider: "", model: "" });
      const [useAi, setUseAi] = React.useState(true);
      const [loading, setLoading] = React.useState(true);
      const [loadError, setLoadError] = React.useState("");
      const [saveState, setSaveState] = React.useState("idle");
      const [error, setError] = React.useState("");
      const [generating, setGenerating] = React.useState(false);
      const [progress, setProgress] = React.useState(null);
      const [result, setResult] = React.useState(null);
      const [showScan, setShowScan] = React.useState(false);
      const [scanDir, setScanDir] = React.useState("");
      const [scanning, setScanning] = React.useState(false);
      const [scanMessage, setScanMessage] = React.useState("");
      const [scanError, setScanError] = React.useState("");
      const [preview, setPreview] = React.useState(null);
      const [previewJobId, setPreviewJobId] = React.useState("");
      const [exporting, setExporting] = React.useState(false);
      const [regenerating, setRegenerating] = React.useState("");
      const [manualDate, setManualDate] = React.useState("");
      const [manualText, setManualText] = React.useState("");
      const [expandedPreviewDays, setExpandedPreviewDays] = React.useState({});
      const firstSave = React.useRef(true);
      const resultRef = React.useRef(null);
      const pollAbortRef = React.useRef(null);
      const saveAbortRef = React.useRef(null);
      const saveTimerRef = React.useRef(null);
      const formatMenuRef = React.useRef(null);
      const sessionId = typeof props.sessionId === "string" ? props.sessionId : "";
      const localeIsEnglish = currentLocaleId(ctx).toLowerCase().startsWith("en");

      React.useEffect(() => {
        resultRef.current = result;
      }, [result]);

      React.useEffect(() => {
        return () => {
          if (pollAbortRef.current) pollAbortRef.current.abort();
          if (saveAbortRef.current) saveAbortRef.current.abort();
          if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
          if (resultRef.current && resultRef.current.url) window.URL.revokeObjectURL(resultRef.current.url);
        };
      }, []);

      React.useEffect(() => {
        if (!formatMenuOpen) return;
        const close = (event) => {
          if (formatMenuRef.current && !formatMenuRef.current.contains(event.target)) {
            setFormatMenuOpen(false);
          }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
      }, [formatMenuOpen]);

      React.useEffect(() => {
        let alive = true;
        const query = sessionId.length > 0 ? "?sessionId=" + encodeURIComponent(sessionId) : "";
        fetch(API + "/state" + query, { headers: { accept: "application/json" } })
          .then((response) => {
            if (!response.ok) throw new Error("state-failed");
            return response.json();
          })
          .then((payload) => {
            if (!alive) return;
            setSettings(normalizeClientSettings(payload && payload.settings));
            setUseAi(!(payload && payload.settings && payload.settings.aiEnabled === false));
            const savedFormat = payload && payload.settings && payload.settings.format;
            if (typeof savedFormat === "string" && FORMAT_OPTIONS.includes(savedFormat)) {
              setExportFormat(savedFormat);
            }
            const nextAi = payload && payload.ai ? payload.ai : { available: false, provider: "", model: "" };
            setAiInfo({
              available: nextAi.available === true,
              provider: typeof nextAi.provider === "string" ? nextAi.provider : "",
              model: typeof nextAi.model === "string" ? nextAi.model : "",
            });
            const savedRange = payload && payload.settings && payload.settings.range;
            if (savedRange && typeof savedRange.start === "string" && typeof savedRange.end === "string") {
              setRange({ start: savedRange.start, end: savedRange.end });
            } else if (payload && payload.defaults && payload.defaults.start && payload.defaults.end) {
              setRange({ start: payload.defaults.start, end: payload.defaults.end });
            }
            setLoadError(payload && payload.warning ? payload.warning : "");
          })
          .catch(() => {
            if (!alive) return;
            setLoadError(t("error.network", "无法连接本地服务，请确认插件已启用。"));
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
        return () => {
          alive = false;
        };
      }, [sessionId]);

      React.useEffect(() => {
        if (loading) return;
        if (firstSave.current) {
          firstSave.current = false;
          return;
        }
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
          saveTimerRef.current = null;
          persistSettings();
        }, 650);
        return () => {
          if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
          }
        };
      }, [settings, useAi, range, exportFormat, loading]);

      function updateGit(index, patch) {
        setSettings((previous) => ({
          ...previous,
          git: previous.git.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
        }));
      }

      function updateDoc(index, patch) {
        setSettings((previous) => ({
          ...previous,
          docs: previous.docs.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
        }));
      }

      function addGit() {
        setSettings((previous) => ({
          ...previous,
          git: [...previous.git, { _key: uid(), location: "", branch: "", label: "" }],
        }));
      }

      function addDoc() {
        setSettings((previous) => ({
          ...previous,
          docs: [...previous.docs, { _key: uid(), location: "", label: "" }],
        }));
      }

      function removeGit(index) {
        setSettings((previous) => ({ ...previous, git: previous.git.filter((_, itemIndex) => itemIndex !== index) }));
      }

      function removeDoc(index) {
        setSettings((previous) => ({ ...previous, docs: previous.docs.filter((_, itemIndex) => itemIndex !== index) }));
      }

      async function persistSettings() {
        if (saveAbortRef.current) saveAbortRef.current.abort();
        const controller = new AbortController();
        saveAbortRef.current = controller;
        setSaveState("saving");
        try {
          const response = await fetch(API + "/state", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ settings: cleanSettings(settings, useAi, range, exportFormat) }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("save-failed");
          setSaveState("saved");
        } catch (err) {
          if (err && err.name === "AbortError") return;
          setSaveState("failed");
        } finally {
          if (saveAbortRef.current === controller) saveAbortRef.current = null;
        }
      }

      function saveSettingsNow() {
        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        persistSettings();
      }

      function toggleScan() {
        const next = !showScan;
        setShowScan(next);
        setScanError("");
        setScanMessage("");
      }

      async function pickScanDirectory() {
        const service = ctx.get("uiWorkspace");
        if (!service || typeof service.pickDirectory !== "function") {
          setScanError(t("scan.noPicker", "请手动输入目录路径。"));
          return;
        }
        try {
          const selected = await service.pickDirectory();
          if (typeof selected === "string" && selected.trim().length > 0) {
            setScanDir(selected);
            setScanError("");
          }
        } catch (err) {
          setScanError(err && err.message ? err.message : t("scan.failed", "扫描目录失败"));
        }
      }

      async function scanAndAdd() {
        const directory = scanDir.trim();
        if (directory.length === 0) {
          setScanError(t("scan.placeholder", "要扫描的目录，例如 E:\\sunline\\SBG"));
          return;
        }
        if (scanning) return;
        setScanning(true);
        setScanError("");
        setScanMessage("");
        try {
          const response = await fetch(API + "/scan", {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({ directory }),
          });
          if (!response.ok) {
            let payload = null;
            try {
              payload = await response.json();
            } catch {
              payload = null;
            }
            throw new Error(errorMessageFromPayload(payload));
          }
          const payload = await response.json();
          const repos = Array.isArray(payload.repos) ? payload.repos : [];
          const existing = new Set(settings.git.map((item) => item.location.toLowerCase() + "\u0000" + item.branch));
          const additions = [];
          for (const repo of repos) {
            if (!repo || typeof repo.location !== "string" || repo.location.length === 0) continue;
            const key = repo.location.toLowerCase() + "\u0000" + (repo.branch || "");
            if (existing.has(key)) continue;
            existing.add(key);
            additions.push({
              _key: uid(),
              location: repo.location,
              branch: typeof repo.branch === "string" ? repo.branch : "",
              label: typeof repo.label === "string" ? repo.label : "",
            });
          }
          if (additions.length > 0) {
            setSettings((previous) => ({ ...previous, git: [...previous.git, ...additions] }));
          }
          const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
          setScanMessage(
            repos.length === 0
              ? t("scan.empty", "该目录下没有发现 Git 仓库。")
              : t("scan.found", "发现") + " " + repos.length + " · " + t("scan.added", "新增") + " " + additions.length + (warnings.length > 0 ? " · " + warnings.join(" ") : ""),
          );
        } catch (err) {
          setScanError(err && err.message ? err.message : t("scan.failed", "扫描目录失败"));
        } finally {
          setScanning(false);
        }
      }

      function updatePreviewDay(date, patch) {
        setPreview((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            days: previous.days.map((day) => (day.date === date ? { ...day, ...patch } : day)),
          };
        });
      }

      function addManualItem() {
        const text = manualText.trim();
        const date = manualDate;
        if (text.length === 0 || date.length === 0 || !preview) return;
        setPreview((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            days: previous.days.map((day) =>
              day.date === date ? { ...day, manualItems: [...(day.manualItems || []), text] } : day,
            ),
          };
        });
        setExpandedPreviewDays((previous) => ({ ...previous, [date]: true }));
        setManualText("");
      }

      function removeManualItem(date, index) {
        setPreview((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            days: previous.days.map((day) =>
              day.date === date
                ? { ...day, manualItems: (day.manualItems || []).filter((_, itemIndex) => itemIndex !== index) }
                : day,
            ),
          };
        });
      }

      function togglePreviewDay(date) {
        setExpandedPreviewDays((previous) => ({ ...previous, [date]: !previous[date] }));
      }

      function setAllPreviewExpanded(expand) {
        if (!preview) return;
        if (!expand) {
          setExpandedPreviewDays({});
          return;
        }
        const next = {};
        for (const day of preview.days) {
          if (day.commitCount > 0 || day.docCount > 0 || (day.manualItems || []).length > 0 || (day.aiSummary || "").length > 0) {
            next[day.date] = true;
          }
        }
        setExpandedPreviewDays(next);
      }

      function previewEdits() {
        if (!preview) return { overall: "", days: [] };
        return {
          overall: preview.ai ? preview.ai.overall || "" : "",
          days: preview.days.map((day) => ({
            date: day.date,
            aiSummary: day.aiSummary || "",
            aiHighlights: day.aiHighlights || [],
            aiCategories: day.aiCategories || [],
            manualItems: day.manualItems || [],
          })),
        };
      }

      async function exportPreview() {
        if (!preview || previewJobId.length === 0 || exporting) return;
        setExporting(true);
        setError("");
        try {
          const response = await fetch(API + "/job/export", {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/octet-stream" },
            body: JSON.stringify({ jobId: previewJobId, edits: previewEdits(), format: exportFormat }),
          });
          if (!response.ok) {
            let payload = null;
            try {
              payload = await response.json();
            } catch {
              payload = null;
            }
            throw new Error(errorMessageFromPayload(payload));
          }
          const summaryHeader = response.headers.get("x-report-summary");
          const summary = summaryHeader ? decodeBase64Json(summaryHeader) : {};
          const filenameHeader = response.headers.get("x-report-filename");
          const filename = filenameHeader
            ? decodeURIComponent(filenameHeader)
            : "日报汇总_" + preview.range.start + "_" + preview.range.end + "." + formatExtension(exportFormat);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const next = Object.assign({}, summary, { filename, url, size: blob.size });
          if (resultRef.current && resultRef.current.url) window.URL.revokeObjectURL(resultRef.current.url);
          setResult(next);
          triggerDownload(url, filename);
        } catch (err) {
          setError(err && err.message ? err.message : t("error.generate", "导出失败"));
        } finally {
          setExporting(false);
        }
      }

      async function regeneratePreviewDay(date) {
        if (!preview || !preview.ai || !preview.ai.ok || regenerating.length > 0) return;
        const day = preview.days.find((item) => item.date === date);
        if (!day) return;
        setRegenerating(date);
        setError("");
        try {
          const response = await fetch(API + "/job/regenerate-day", {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({ jobId: previewJobId, date, manualItems: day.manualItems || [] }),
          });
          if (!response.ok) {
            let payload = null;
            try {
              payload = await response.json();
            } catch {
              payload = null;
            }
            throw new Error(errorMessageFromPayload(payload));
          }
          const payload = await response.json();
          if (!payload.ok || !payload.day) throw new Error(payload.error || t("error.generate", "重新分析失败"));
          updatePreviewDay(date, {
            aiSummary: payload.day.summary || "",
            aiHighlights: payload.day.highlights || [],
            aiCategories: payload.day.categories || [],
          });
        } catch (err) {
          setError(err && err.message ? err.message : t("error.generate", "重新分析失败"));
        } finally {
          setRegenerating("");
        }
      }

      function errorMessageFromPayload(payload) {
        const code = payload && payload.error ? payload.error.code : "";
        const serverMessage = payload && payload.error ? payload.error.message : "";
        const messages = {
          "no-sources": t("error.noSources", "请至少添加一个 Git 仓库或本地文档。"),
          "invalid-range": t("error.invalidRange", "日期范围无效，请检查开始和结束日期。"),
          "range-too-long": t("error.rangeTooLong", "时间范围最长支持 366 天。"),
          "all-sources-failed": t("error.allSourcesFailed", "所有数据源都读取失败。"),
          "generate-failed": t("error.generate", "生成失败"),
        };
        return messages[code] || serverMessage || t("error.generate", "生成失败");
      }

      function wait(ms, signal) {
        return new Promise((resolve, reject) => {
          const timer = window.setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
          }, ms);
          const onAbort = () => {
            window.clearTimeout(timer);
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          };
          if (signal.aborted) {
            onAbort();
            return;
          }
          signal.addEventListener("abort", onAbort, { once: true });
        });
      }

      async function generate(formatOverride) {
        if (generating) return;
        const format = FORMAT_OPTIONS.includes(formatOverride) ? formatOverride : exportFormat;
        setExportFormat(format);
        setFormatMenuOpen(false);
        const cleaned = cleanSettings(settings, useAi, range, format);
        if (cleaned.git.length === 0 && cleaned.docs.length === 0) {
          setError(t("error.noSources", "请至少添加一个 Git 仓库或本地文档。"));
          return;
        }
        const totalDays = daysBetween(range.start, range.end);
        if (!range.start || !range.end || totalDays <= 0) {
          setError(t("error.invalidRange", "日期范围无效，请检查开始和结束日期。"));
          return;
        }
        if (totalDays > 366) {
          setError(t("error.rangeTooLong", "时间范围最长支持 366 天。"));
          return;
        }
        setError("");
        setPreview(null);
        setPreviewJobId("");
        if (resultRef.current && resultRef.current.url) window.URL.revokeObjectURL(resultRef.current.url);
        setResult(null);
        setGenerating(true);
        setProgress({ percent: 1, indeterminate: false, message: t("progress.start", "正在创建生成任务…") });
        if (pollAbortRef.current) pollAbortRef.current.abort();
        const controller = new AbortController();
        pollAbortRef.current = controller;
        try {
          const startResponse = await fetch(API + "/generate/start", {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({
              settings: cleaned,
              start: range.start,
              end: range.end,
              sessionId,
              ai: useAi && aiInfo.available,
              locale: currentLocaleId(ctx).toLowerCase().startsWith("en") ? "en" : "zh",
            }),
            signal: controller.signal,
          });
          if (!startResponse.ok) {
            let payload = null;
            try {
              payload = await startResponse.json();
            } catch {
              payload = null;
            }
            throw new Error(errorMessageFromPayload(payload));
          }
          const started = await startResponse.json();
          const jobId = started && typeof started.jobId === "string" ? started.jobId : "";
          if (jobId.length === 0) throw new Error(t("error.generate", "生成失败"));
          while (true) {
            if (controller.signal.aborted) {
              const aborted = new Error("aborted");
              aborted.name = "AbortError";
              throw aborted;
            }
            const statusResponse = await fetch(API + "/job?jobId=" + encodeURIComponent(jobId), {
              headers: { accept: "application/json" },
              signal: controller.signal,
            });
            if (!statusResponse.ok) {
              let payload = null;
              try {
                payload = await statusResponse.json();
              } catch {
                payload = null;
              }
              throw new Error(errorMessageFromPayload(payload));
            }
            const job = await statusResponse.json();
            if (job.progress) {
              setProgress({
                percent: Number(job.progress.percent) || 0,
                indeterminate: job.progress.indeterminate === true,
                message: job.progress.message || t("generating", "正在收集并生成…"),
              });
            }
            if (job.status === "done") break;
            if (job.status === "failed") throw new Error(errorMessageFromPayload({ error: job.error }));
            if (job.status === "cancelled") {
              const aborted = new Error("aborted");
              aborted.name = "AbortError";
              throw aborted;
            }
            await wait(650, controller.signal);
          }
          const previewResponse = await fetch(API + "/job/preview?jobId=" + encodeURIComponent(jobId), {
            headers: { accept: "application/json" },
            signal: controller.signal,
          });
          if (!previewResponse.ok) {
            let payload = null;
            try {
              payload = await previewResponse.json();
            } catch {
              payload = null;
            }
            throw new Error(errorMessageFromPayload(payload));
          }
          const previewData = await previewResponse.json();
          setPreview(previewData);
          setPreviewJobId(jobId);
          setExpandedPreviewDays({});
          const firstDay = (previewData.days || []).find((day) => day.commitCount > 0 || day.docCount > 0 || (day.manualItems || []).length > 0) || (previewData.days || [])[0];
          setManualDate(firstDay ? firstDay.date : range.start);
          setProgress({ percent: 100, indeterminate: false, message: t("progress.preview", "生成完成，请预览并编辑后导出 XLSX。") });
        } catch (err) {
          if (err && err.name === "AbortError") return;
          setError(err && err.message ? err.message : t("error.generate", "生成失败"));
        } finally {
          if (pollAbortRef.current === controller) pollAbortRef.current = null;
          setGenerating(false);
        }
      }

      const rangeDays = daysBetween(range.start, range.end);
      const previewDays = preview
        ? preview.days.filter((day) => day.commitCount > 0 || day.docCount > 0 || (day.manualItems || []).length > 0 || (day.aiSummary || "").length > 0)
        : [];
            const allPreviewExpanded = previewDays.length > 0 && previewDays.every((day) => expandedPreviewDays[day.date] === true);
      const saveText =
        saveState === "saving"
          ? t("save.saving", "正在保存设置…")
          : saveState === "saved"
            ? t("save.saved", "设置已保存")
            : saveState === "failed"
              ? t("save.failed", "设置保存失败")
              : "";

      if (loading) {
        return h("div", { className: "dsdr-root" }, h("div", { className: "dsdr-page" }, h("div", { className: "dsdr-card dsdr-hint" }, t("loading", "正在读取配置…"))));
      }

      return h(
        "div",
        { className: "dsdr-root" },
        h(
          "div",
          { className: "dsdr-page" },
          h(
            "div",
            { className: "dsdr-hero" },
            h("div", { className: "dsdr-mark" }, h(Icon)),
            h(
              "div",
              { className: "dsdr-hero-copy" },
              h("h1", { className: "dsdr-title" }, t("page.title", "日报汇总")),
              h("p", { className: "dsdr-sub" }, t("page.desc", "按天汇总 Git 提交与本地文档，导出可直接查看的 XLSX 日报。")),
            ),
            h(
              "div",
              { className: "dsdr-hero-action" },
              h(
                "div",
                { className: "dsdr-hero-buttons" },
                h(
                  "button",
                  {
                    type: "button",
                    className: "dsdr-btn dsdr-save-btn dsdr-btn-with-icon",
                    onClick: saveSettingsNow,
                    disabled: saveState === "saving",
                  },
                  h(SaveIcon, { size: 15 }),
                  h("span", null, saveState === "saving" ? t("save.savingShort", "正在保存…") : t("save.button", "保存设置")),
                ),
                h(
                  "div",
                  { className: "dsdr-split", ref: formatMenuRef },
                  h(
                    "button",
                    {
                      type: "button",
                      className: "dsdr-btn dsdr-btn-primary dsdr-generate dsdr-btn-with-icon",
                      onClick: () => generate(),
                      disabled: generating,
                    },
                    h(GenerateIcon, { size: 15 }),
                    h("span", null, generating ? t("generating", "正在收集并生成…") : t("generate", "生成日报")),
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className: "dsdr-btn dsdr-btn-primary dsdr-split-toggle",
                      onClick: () => setFormatMenuOpen((open) => !open),
                      disabled: generating,
                      "aria-haspopup": "menu",
                      "aria-expanded": formatMenuOpen,
                      "aria-label": t("format.label", "格式"),
                    },
                    h(ChevronIcon, { size: 12 }),
                  ),
                  formatMenuOpen
                    ? h(
                        "div",
                        { className: "dsdr-menu", role: "menu" },
                        h("div", { className: "dsdr-menu-title" }, t("format.label", "格式")),
                        FORMAT_OPTIONS.map((format) =>
                          h(
                            "button",
                            {
                              type: "button",
                              role: "menuitemradio",
                              "aria-checked": exportFormat === format,
                              className: "dsdr-menu-item" + (exportFormat === format ? " is-active" : ""),
                              key: format,
                              onClick: () => {
                                setExportFormat(format);
                                setFormatMenuOpen(false);
                                generate(format);
                              },
                            },
                            h("span", null, formatLabel(format, t)),
                            h("span", { className: "dsdr-menu-check" }, exportFormat === format ? "✓" : ""),
                          ),
                        ),
                      )
                    : null,
                ),
              ),
              saveText ? h("div", { className: "dsdr-save" }, saveText) : null,
            ),
          ),

          generating
            ? h(
                "section",
                { className: "dsdr-card dsdr-progress-card", role: "status", "aria-live": "polite" },
                h(
                  "div",
                  { className: "dsdr-progress-head" },
                  h("span", null, (progress && progress.message) || t("generating", "正在收集并生成…")),
                  h("span", { className: "dsdr-progress-value" }, progress && !progress.indeterminate ? Math.round(Number(progress.percent) || 0) + "%" : "…"),
                ),
                h(
                  "div",
                  { className: "dsdr-progress-track" + (progress && progress.indeterminate ? " is-indeterminate" : "") },
                  h("div", {
                    className: "dsdr-progress-fill",
                    style: { width: progress && progress.indeterminate ? "35%" : Math.max(2, Math.min(100, Number(progress && progress.percent) || 0)) + "%" },
                  }),
                ),
                h("div", { className: "dsdr-hint" }, t("progress.hint", "AI 分析需要调用模型，耗时通常比普通汇总更长；请保持页面打开。")),
              )
            : null,

          loadError ? h("div", { className: "dsdr-error" }, loadError) : null,
          error ? h("div", { className: "dsdr-error", role: "alert" }, error) : null,

          preview
            ? h(
                "section",
                { className: "dsdr-card dsdr-preview-card" },
                h(
                  "div",
                  { className: "dsdr-card-head" },
                  h(
                    "div",
                    null,
                    h("div", { className: "dsdr-card-title" }, t("preview.title", "生成结果预览")),
                    h("div", { className: "dsdr-card-desc" }, t("preview.desc", "先检查并编辑每日 AI 摘要、补充非代码工作，再导出 XLSX。")),
                  ),
                  h(
                    "div",
                    { className: "dsdr-actions" },
                    h(
                      "button",
                      {
                        type: "button",
                        className: "dsdr-btn",
                        onClick: () => setAllPreviewExpanded(!allPreviewExpanded),
                        disabled: previewDays.length === 0 || exporting,
                      },
                      allPreviewExpanded ? t("preview.collapseAll", "全部收起") : t("preview.expandAll", "全部展开"),
                    ),
                    h(
                      "button",
                      { type: "button", className: "dsdr-btn dsdr-btn-primary", onClick: exportPreview, disabled: exporting || regenerating.length > 0 },
                      exporting ? t("preview.exporting", "正在导出…") : t("preview.export", "导出") + " " + formatShortLabel(exportFormat),
                    ),
                  ),
                ),
                preview.ai && preview.ai.ok
                  ? h(
                      "div",
                      { className: "dsdr-preview-overall" },
                      h("label", { className: "dsdr-label", htmlFor: "dsdr-preview-overall" }, t("preview.overall", "总体 AI 总结")),
                      h("textarea", {
                        id: "dsdr-preview-overall",
                        className: "dsdr-textarea",
                        value: preview.ai.overall || "",
                        onChange: (event) => setPreview((previous) => (previous ? { ...previous, ai: { ...previous.ai, overall: event.target.value } } : previous)),
                      }),
                    )
                  : preview.ai
                    ? h("div", { className: "dsdr-error" }, preview.ai.error || t("preview.aiFailed", "AI 分析未完成，仍可补充手动工作项后导出。"))
                    : null,
                h(
                  "div",
                  { className: "dsdr-manual-add" },
                  h("input", {
                    type: "date",
                    className: "dsdr-input",
                    value: manualDate,
                    min: preview.range.start,
                    max: preview.range.end,
                    onChange: (event) => setManualDate(event.target.value),
                  }),
                  h("input", {
                    className: "dsdr-input",
                    value: manualText,
                    placeholder: t("preview.manualPlaceholder", "例如：参加需求评审、处理线上问题"),
                    onChange: (event) => setManualText(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === "Enter") addManualItem();
                    },
                  }),
                  h("button", { type: "button", className: "dsdr-btn", onClick: addManualItem, disabled: manualText.trim().length === 0 }, t("preview.addManual", "添加手动工作项")),
                ),
                previewDays.length === 0
                  ? h("div", { className: "dsdr-empty" }, t("preview.noDays", "没有可预览的日报内容。"))
                  : h(
                      "div",
                      { className: "dsdr-preview-list" },
                      previewDays.map((day) => {
                        const expanded = expandedPreviewDays[day.date] === true;
                        return h(
                          "div",
                          { className: "dsdr-preview-day" + (expanded ? " is-expanded" : ""), key: day.date },
                          h(
                            "div",
                            { className: "dsdr-preview-day-head" },
                            h(
                              "button",
                              {
                                type: "button",
                                className: "dsdr-preview-toggle",
                                "aria-expanded": expanded,
                                onClick: () => togglePreviewDay(day.date),
                              },
                              h("span", { className: "dsdr-preview-chevron" }, expanded ? "▾" : "▸"),
                              h("span", { className: "dsdr-preview-date" }, day.date),
                              h("span", { className: "dsdr-hint" }, " · " + day.weekday + " · " + day.commitCount + " commits · " + day.docCount + " docs"),
                              day.manualItems && day.manualItems.length > 0
                                ? h("span", { className: "dsdr-preview-badge" }, day.manualItems.length + " " + t("preview.manual", "手动补充"))
                                : null,
                            ),
                            preview.ai && preview.ai.ok
                              ? h(
                                  "button",
                                  {
                                    type: "button",
                                    className: "dsdr-btn",
                                    onClick: () => regeneratePreviewDay(day.date),
                                    disabled: regenerating.length > 0 || exporting,
                                  },
                                  regenerating === day.date ? t("preview.regenerating", "分析中…") : t("preview.regenerateDay", "重新分析这天"),
                                )
                              : null,
                          ),
                          expanded
                            ? h(
                                "div",
                                { className: "dsdr-preview-body" },
                                h("div", { className: "dsdr-preview-raw" }, t("preview.raw", "原始汇总") + "：" + day.summary),
                                preview.ai && preview.ai.ok
                                  ? h("textarea", {
                                      className: "dsdr-textarea",
                                      value: day.aiSummary || "",
                                      placeholder: t("preview.aiSummary", "AI 摘要（可编辑）"),
                                      onChange: (event) => updatePreviewDay(day.date, { aiSummary: event.target.value }),
                                    })
                                  : null,
                                day.aiHighlights && day.aiHighlights.length > 0
                                  ? h("div", { className: "dsdr-hint" }, "• " + day.aiHighlights.join("；"))
                                  : null,
                                day.manualItems && day.manualItems.length > 0
                                  ? h(
                                      "div",
                                      { className: "dsdr-manual-list" },
                                      day.manualItems.map((text, index) =>
                                        h(
                                          "span",
                                          { className: "dsdr-manual-chip", key: String(index) },
                                          text,
                                          h(
                                            "button",
                                            {
                                              type: "button",
                                              className: "dsdr-manual-remove",
                                              "aria-label": t("remove", "移除"),
                                              onClick: () => removeManualItem(day.date, index),
                                            },
                                            "×",
                                          ),
                                        ),
                                      ),
                                    )
                                  : null,
                              )
                            : null,
                        );
                      }),
                    ),
              )
            : null,

          h(
            "section",
            { className: "dsdr-card" },
            h(
              "div",
              { className: "dsdr-card-head" },
              h(
                "div",
                null,
                h("div", { className: "dsdr-card-title" }, t("range.title", "汇总时间范围")),
                h("div", { className: "dsdr-card-desc" }, t("range.desc", "默认当月月初到月底；可改为任意日期范围。")),
              ),
              h("div", { className: "dsdr-hint" }, rangeDays > 0 ? t("range.total", "共") + " " + rangeDays + " " + t("range.days", "天") : ""),
            ),
            h(
              "div",
              { className: "dsdr-range" },
              h(
                "div",
                { className: "dsdr-field" },
                h("label", { className: "dsdr-label", htmlFor: "dsdr-start" }, t("range.start", "开始日期")),
                h("input", {
                  id: "dsdr-start",
                  className: "dsdr-input",
                  type: "date",
                  value: range.start,
                  onChange: (event) => setRange((previous) => ({ ...previous, start: event.target.value })),
                }),
              ),
              h(
                "div",
                { className: "dsdr-field" },
                h("label", { className: "dsdr-label", htmlFor: "dsdr-end" }, t("range.end", "结束日期")),
                h("input", {
                  id: "dsdr-end",
                  className: "dsdr-input",
                  type: "date",
                  value: range.end,
                  onChange: (event) => setRange((previous) => ({ ...previous, end: event.target.value })),
                }),
              ),
              h(
                "div",
                { className: "dsdr-actions" },
                h("button", { type: "button", className: "dsdr-btn", onClick: () => setRange(currentMonthRange()) }, t("range.thisMonth", "本月")),
                h("button", { type: "button", className: "dsdr-btn", onClick: () => setRange(lastMonthRange()) }, t("range.lastMonth", "上月")),
                h("button", { type: "button", className: "dsdr-btn", onClick: () => setRange(last7Range()) }, t("range.last7", "最近 7 天")),
              ),
            ),
          ),

          h(
            "section",
            { className: "dsdr-card" },
            h(
              "div",
              { className: "dsdr-card-head" },
              h(
                "div",
                null,
                h("div", { className: "dsdr-card-title" }, t("ai.title", "AI 分析")),
                h("div", { className: "dsdr-card-desc" }, t("ai.desc", "使用当前默认模型分析提交说明、代码变更和文档摘要，生成按天简要总结。")),
              ),
              h(
                "label",
                { className: "dsdr-check" + (aiInfo.available ? "" : " is-disabled") },
                h("input", {
                  type: "checkbox",
                  checked: useAi,
                  disabled: !aiInfo.available,
                  onChange: (event) => setUseAi(event.target.checked),
                }),
                h("span", null, t("ai.enable", "启用 AI 分析")),
              ),
            ),
            h(
              "div",
              { className: "dsdr-hint" },
              aiInfo.available
                ? t("ai.model", "当前模型：") + aiInfo.provider + "/" + aiInfo.model + " · " + t("ai.cost", "会增加生成时间和模型 token 消耗。")
                : t("ai.unavailable", "当前没有可用的默认模型。"),
            ),
          ),

          h(
            "section",
            { className: "dsdr-card" },
            h(
              "div",
              { className: "dsdr-card-head" },
              h(
                "div",
                null,
                h("div", { className: "dsdr-card-title" }, t("git.title", "Git 仓库")),
                h("div", { className: "dsdr-card-desc" }, t("git.desc", "支持远程地址或本地仓库；多个仓库、多个分支会合并到同一份日报。")),
              ),
              h(
                "div",
                { className: "dsdr-actions" },
                h("button", { type: "button", className: "dsdr-btn", onClick: toggleScan }, t("scan.open", "扫描目录")),
                h("button", { type: "button", className: "dsdr-btn", onClick: addGit }, "+ " + t("git.add", "添加仓库")),
              ),
            ),
            h(
              "div",
              { className: "dsdr-filter-row" },
              h(
                "label",
                { className: "dsdr-check" },
                h("input", {
                  type: "checkbox",
                  checked: settings.mineOnly !== false,
                  onChange: (event) => setSettings((previous) => ({ ...previous, mineOnly: event.target.checked })),
                }),
                h("span", null, t("git.mine", "仅统计我的提交")),
              ),
              h("span", { className: "dsdr-hint" }, t("git.mineHint", "按各仓库 git config user.email / user.name 过滤")),
            ),
            showScan
              ? h(
                  "div",
                  { className: "dsdr-scan" },
                  h("div", { className: "dsdr-scan-title" }, t("scan.title", "从目录批量添加")),
                  h("div", { className: "dsdr-card-desc" }, t("scan.desc", "扫描目录下最多 6 层的 Git 仓库，已存在的会自动跳过。")),
                  h(
                    "div",
                    { className: "dsdr-scan-row" },
                    h(
                      "div",
                      { className: "dsdr-field" },
                      h("label", { className: "dsdr-label", htmlFor: "dsdr-scan-dir" }, t("scan.placeholder", "要扫描的目录，例如 E:\\sunline\\SBG")),
                      h("input", {
                        id: "dsdr-scan-dir",
                        className: "dsdr-input",
                        value: scanDir,
                        placeholder: t("scan.placeholder", "要扫描的目录，例如 E:\\sunline\\SBG"),
                        onChange: (event) => setScanDir(event.target.value),
                      }),
                    ),
                    h(
                      "div",
                      { className: "dsdr-actions" },
                      h(
                        "button",
                        { type: "button", className: "dsdr-btn dsdr-btn-primary", onClick: scanAndAdd, disabled: scanning },
                        scanning ? t("scan.scanning", "正在扫描…") : t("scan.scan", "扫描并添加"),
                      ),
                      h("button", { type: "button", className: "dsdr-btn", onClick: pickScanDirectory, disabled: scanning }, t("scan.pick", "选择目录")),
                    ),
                  ),
                  scanError ? h("div", { className: "dsdr-error" }, scanError) : null,
                  scanMessage ? h("div", { className: "dsdr-hint dsdr-ok" }, scanMessage) : null,
                )
              : null,
            settings.git.length === 0
              ? h("div", { className: "dsdr-empty" }, t("git.empty", "还没有 Git 仓库。"))
              : settings.git.map((item, index) =>
                  h(
                    "div",
                    { className: "dsdr-source", key: item._key },
                    h(
                      "div",
                      { className: "dsdr-field" },
                      h("label", { className: "dsdr-label" }, t("git.location", "仓库地址或本地路径")),
                      h("input", {
                        className: "dsdr-input",
                        value: item.location,
                        placeholder: t("git.placeholder", "https://…/repo.git 或 D:\\code\\repo"),
                        onChange: (event) => updateGit(index, { location: event.target.value }),
                      }),
                    ),
                    h(
                      "div",
                      { className: "dsdr-field" },
                      h("label", { className: "dsdr-label" }, t("git.branch", "分支")),
                      h("input", {
                        className: "dsdr-input",
                        value: item.branch,
                        placeholder: "main",
                        onChange: (event) => updateGit(index, { branch: event.target.value }),
                      }),
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        className: "dsdr-btn dsdr-btn-danger dsdr-icon-btn",
                        title: t("remove", "移除"),
                        "aria-label": t("remove", "移除"),
                        onClick: () => removeGit(index),
                      },
                      "×",
                    ),
                  ),
                ),
          ),

          h(
            "section",
            { className: "dsdr-card" },
            h(
              "div",
              { className: "dsdr-card-head" },
              h(
                "div",
                null,
                h("div", { className: "dsdr-card-title" }, t("docs.title", "本地文档")),
                h("div", { className: "dsdr-card-desc" }, t("docs.desc", "文件或目录；目录会递归扫描 md、txt、docx、html 等笔记文件。")),
              ),
              h(
                "div",
                { className: "dsdr-actions" },
                h("button", { type: "button", className: "dsdr-btn", onClick: addDoc }, "+ " + t("docs.add", "添加文档/目录")),
              ),
            ),
            settings.docs.length === 0
              ? h("div", { className: "dsdr-empty" }, t("docs.empty", "还没有本地文档。"))
              : settings.docs.map((item, index) =>
                  h(
                    "div",
                    { className: "dsdr-source dsdr-source-docs", key: item._key },
                    h(
                      "div",
                      { className: "dsdr-field" },
                      h("label", { className: "dsdr-label" }, t("docs.location", "文件或目录路径")),
                      h("input", {
                        className: "dsdr-input",
                        value: item.location,
                        placeholder: t("docs.placeholder", "C:\\notes 或 ./docs"),
                        onChange: (event) => updateDoc(index, { location: event.target.value }),
                      }),
                    ),
                    h(
                      "div",
                      { className: "dsdr-field" },
                      h("label", { className: "dsdr-label" }, t("docs.label", "显示名称（可选）")),
                      h("input", {
                        className: "dsdr-input",
                        value: item.label,
                        placeholder: t("optional", "可选"),
                        onChange: (event) => updateDoc(index, { label: event.target.value }),
                      }),
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        className: "dsdr-btn dsdr-btn-danger dsdr-icon-btn",
                        title: t("remove", "移除"),
                        "aria-label": t("remove", "移除"),
                        onClick: () => removeDoc(index),
                      },
                      "×",
                    ),
                  ),
                ),
          ),

          h("div", { className: "dsdr-footer" }, t("footer.tip", "Git 使用系统 git 与你的凭据配置；远程仓库会缓存在 DSH 数据目录。")),

          result
            ? h(
                "section",
                { className: "dsdr-card" },
                h(
                  "div",
                  { className: "dsdr-card-head" },
                  h(
                    "div",
                    null,
                    h("div", { className: "dsdr-card-title" }, t("result.title", "生成结果")),
                    h("div", { className: "dsdr-card-desc" }, result.filename || ""),
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className: "dsdr-btn dsdr-btn-primary",
                      onClick: () => triggerDownload(result.url, result.filename),
                    },
                    t("result.download", "下载 XLSX"),
                  ),
                ),
                h(
                  "div",
                  { className: "dsdr-stats" },
                  h(
                    "div",
                    { className: "dsdr-stat" },
                    h("div", { className: "dsdr-stat-value" }, String((result.stats && result.stats.commits) || 0)),
                    h("div", { className: "dsdr-stat-label" }, t("result.stats.commits", "Git 提交")),
                  ),
                  h(
                    "div",
                    { className: "dsdr-stat" },
                    h("div", { className: "dsdr-stat-value" }, String((result.stats && result.stats.docs) || 0)),
                    h("div", { className: "dsdr-stat-label" }, t("result.stats.docs", "文档")),
                  ),
                  h(
                    "div",
                    { className: "dsdr-stat" },
                    h("div", { className: "dsdr-stat-value" }, String((result.stats && result.stats.activeDays) || 0)),
                    h("div", { className: "dsdr-stat-label" }, t("result.stats.activeDays", "有记录天数")),
                  ),
                  h(
                    "div",
                    { className: "dsdr-stat" },
                    h("div", { className: "dsdr-stat-value" }, String((result.stats && result.stats.sources) || 0)),
                    h("div", { className: "dsdr-stat-label" }, t("result.stats.sources", "数据源")),
                  ),
                ),
                result.ai
                  ? h(
                      "div",
                      { className: "dsdr-ai-result" },
                      h(
                        "div",
                        { className: "dsdr-hint" },
                        t("result.ai.title", "AI 分析") +
                          (result.ai.provider ? " · " + result.ai.provider + "/" + result.ai.model : "") +
                          (result.ai.cachedDays > 0 ? " · " + (localeIsEnglish ? "cache " : "缓存 ") + result.ai.cachedDays + (localeIsEnglish ? " day(s)" : " 天") : ""),
                      ),
                      result.ai.ok
                        ? h("div", { className: "dsdr-ai-text" }, result.ai.overall || t("result.ai.hint", "逐日 AI 摘要已写入 XLSX 的「AI分析」工作表。"))
                        : h("div", { className: "dsdr-ai-text dsdr-bad" }, t("result.ai.failed", "AI 分析未完成") + (result.ai.error ? "：" + result.ai.error : "")),
                    )
                  : null,
                result.sources && result.sources.length > 0
                  ? h(
                      "div",
                      { className: "dsdr-list" },
                      h("div", { className: "dsdr-hint" }, t("result.sources", "数据源状态")),
                      result.sources.map((source, index) =>
                        h(
                          "div",
                          { className: "dsdr-row", key: String(index) },
                          h("span", { className: "dsdr-dot " + (source.status || "ok") }),
                          h(
                            "div",
                            null,
                            h("span", { className: "dsdr-source-name" }, source.label || source.location || "—"),
                            source.branch ? h("span", { className: "dsdr-source-meta" }, " · " + source.branch) : null,
                            h("span", { className: "dsdr-source-meta" }, " · " + (source.count || 0) + " " + (source.kind === "git" ? t("result.unit.commits", "次提交") : t("result.unit.docs", "份文档"))),
                            h("div", { className: "dsdr-source-meta" }, source.message || ""),
                          ),
                        ),
                      ),
                    )
                  : null,
                result.warnings && result.warnings.length > 0
                  ? h(
                      "div",
                      { className: "dsdr-list" },
                      h("div", { className: "dsdr-hint dsdr-warn" }, t("result.warnings", "提示")),
                      result.warnings.map((warning, index) => h("div", { className: "dsdr-row", key: String(index) }, "• " + warning)),
                    )
                  : null,
              )
            : null,

          h("div", { className: "dsdr-footer" }, t("page.footer", "数据仅在本机处理；生成的 XLSX 包含日报汇总、Git明细、文档明细、数据源与说明。")),
        ),
      );
    }

    function apply(ctx) {
      installStyles(ctx);
      ctx.effect(() => ctx.locale.register(NS, { zh: zh, en: en }), "daily-report: locale");
      const t = ctx.locale.bind(NS);

      ctx.slots.inject("main", () =>
        ctx.slots.register(
          {
            name: "main",
            key: "daily-report",
          },
          (props) => h(DailyReportView, { ...props, ctx }),
        ),
      );

      ctx.slots.inject("sidebar.panellist", () =>
        ctx.slots.register(
          {
            name: "sidebar.panellist",
            id: "daily-report",
            order: 20,
            label: () => t("panel.title"),
          },
          (props) => h(PanelIcon, props),
        ),
      );
    }

    return { inject: ["slots", "locale"], apply: apply };
  },
});



