import React from "react";
import { useApp } from "../context.jsx";
import { InfoDot, ScanIcon, TestIcon } from "../icons.jsx";

function GroupPicker({
  groups,
  activeGroup,
  editing,
  draftName,
  setDraftName,
  onChoose,
  onSubmit,
  onCancel,
  t,
}) {
  if (editing) {
    return (
      <div className="dsdr-group-edit">
        <input
          className="dsdr-input dsdr-group-name"
          value={draftName}
          autoFocus={true}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
            if (event.key === "Escape") onCancel();
          }}
          placeholder={t("group.namePlaceholder", "分组名称")}
          aria-label={editing === "rename" ? t("group.rename", "重命名分组") : t("group.add", "新建分组")}
        />
        <button type="button" className="dsdr-btn dsdr-btn-primary" onClick={onSubmit}>
          {editing === "rename" ? t("group.save", "保存") : t("group.create", "创建")}
        </button>
        <button type="button" className="dsdr-btn" onClick={onCancel}>
          {t("confirm.cancel", "取消")}
        </button>
      </div>
    );
  }
  return (
    <select
      className="dsdr-input dsdr-group-select"
      value={activeGroup ? activeGroup.id : ""}
      onChange={(event) => onChoose(event.target.value)}
      aria-label={t("group.current", "当前分组")}
    >
      {groups.map((group) => (
        <option value={group.id} key={group.id}>
          {group.name}
        </option>
      ))}
      <option value="__new__">{"+ " + t("group.add", "新建分组") + "…"}</option>
      <option value="__rename__">{t("group.rename", "重命名分组") + "…"}</option>
      {groups.length > 1 ? (
        <option value="__remove__">{t("group.remove", "删除分组") + "…"}</option>
      ) : null}
    </select>
  );
}

export function DataSourceCard() {
  const {
    settings,
    setSettings,
    updateGit,
    removeGit,
    addGit,
    updateDoc,
    removeDoc,
    addDoc,
    showScan,
    scanDir,
    setScanDir,
    scanAndAdd,
    scanning,
    scanError,
    scanMessage,
    pickScanDirectory,
    toggleScan,
    testSources,
    testingSources,
    testError,
    testResults,
    dataSourceTab,
    setDataSourceTab,
    groups = [],
    activeGroup = null,
    groupEditing = "",
    groupDraft = "",
    setGroupDraft = () => {},
    chooseGroup = () => {},
    submitGroup = () => {},
    cancelGroupEdit = () => {},
    switchGroup = () => {},
    addGroup = () => false,
    renameGroup = () => false,
    removeGroup = async () => false,    confirm = async () => true,
    t,
  } = useApp();
  return (
    <>
      <section className="dsdr-card dsdr-datasource-tabs">
        <div className="dsdr-card-head">
          <div>
            <div className="dsdr-title-with-info">
              <div className="dsdr-card-title">
                {t("datasource.title", "数据源配置")}
              </div>
              <InfoDot
                text={t(
                  "datasource.desc",
                  "生成日报的内容来源，可以是 Git 仓库或本地文档。",
                )}
              />
            </div>
          </div>
          <div className="dsdr-actions dsdr-datasource-actions">
            <GroupPicker
              groups={groups}
              activeGroup={activeGroup}
              editing={groupEditing}
              draftName={groupDraft}
              setDraftName={setGroupDraft}
              onChoose={chooseGroup}
              onSubmit={submitGroup}
              onCancel={cancelGroupEdit}
              t={t}
            />
            <button
              type="button"
              className="dsdr-btn dsdr-btn-with-icon"
              onClick={testSources}
              disabled={testingSources}
            >
              <TestIcon size={14} />
              <span>
                {testingSources
                  ? t("test.testing", "测试中…")
                  : t("test.button", "测试数据源")}
              </span>
            </button>
          </div>
        </div>
        <div className="dsdr-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={dataSourceTab === "git"}
            className={
              "dsdr-tab" + (dataSourceTab === "git" ? " is-active" : "")
            }
            onClick={() => setDataSourceTab("git")}
          >
            {t("datasource.git", "Git 仓库")}
            <span className="dsdr-tab-count">
              {String(settings.git.length)}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={dataSourceTab === "docs"}
            className={
              "dsdr-tab" + (dataSourceTab === "docs" ? " is-active" : "")
            }
            onClick={() => setDataSourceTab("docs")}
          >
            {t("datasource.docs", "本地文档")}
            <span className="dsdr-tab-count">
              {String(settings.docs.length)}
            </span>
          </button>
        </div>
        {testError ? <div className="dsdr-error">{testError}</div> : null}
        {testResults && testResults.length > 0 ? (
          <div className="dsdr-test-results">
            {testResults.map((source, index) => (
              <div className="dsdr-row" key={String(index)}>
                <span className={"dsdr-dot " + (source.status || "ok")} />
                <div>
                  <span className="dsdr-source-name">
                    {source.label || source.location || "—"}
                  </span>
                  <span className="dsdr-source-meta">
                    {" · " +
                      (source.status === "error"
                        ? t("status.error", "失败")
                        : t("test.ok", "正常"))}
                  </span>
                  <div className="dsdr-source-meta">{source.message || ""}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
      <section
        className="dsdr-card dsdr-datasource-panel"
        style={{
          display: dataSourceTab === "git" ? undefined : "none",
        }}
      >
        <div className="dsdr-card-head">
          <div>
            <div className="dsdr-card-title">
              {t("git.title", "Git 仓库")}
            </div>
          </div>
          <div className="dsdr-actions">
            <button
              type="button"
              className="dsdr-btn dsdr-btn-with-icon"
              onClick={toggleScan}
            >
              <ScanIcon size={14} />
              <span>{t("scan.open", "扫描目录")}</span>
            </button>
            <button type="button" className="dsdr-btn" onClick={addGit}>
              {"+ " + t("git.add", "添加仓库")}
            </button>
          </div>
        </div>
        <div className="dsdr-filter-row">
          <label className="dsdr-check">
            <input
              type="checkbox"
              checked={settings.mineOnly !== false}
              onChange={async (event) => {
                const nextChecked = event.target.checked;
                if (!nextChecked && settings.mineOnly !== false) {
                  const accepted = await confirm({
                    title: t("confirm.mineOnly.title", "统计全部作者的提交？"),
                    message: t(
                      "confirm.mineOnly.message",
                      "取消后日报会包含所有作者的提交，提交量可能明显增加。",
                    ),
                    confirmLabel: t("confirm.mineOnly.confirm", "取消勾选"),
                    cancelLabel: t("confirm.cancel", "取消"),
                  });
                  if (!accepted) return;
                }
                setSettings((previous) => ({
                  ...previous,
                  mineOnly: nextChecked,
                }));
              }}
            />
            <span>{t("git.mine", "仅统计我的提交")}</span>
          </label>
          <label className="dsdr-check">
            <input
              type="checkbox"
              checked={settings.excludeMerges !== false}
              onChange={(event) =>
                setSettings((previous) => ({
                  ...previous,
                  excludeMerges: event.target.checked,
                }))
              }
            />
            <span>{t("git.excludeMerges", "排除 merge commit")}</span>
          </label>
          {settings.mineOnly !== false ? (
            <div className="dsdr-field dsdr-filter-author">
              <label className="dsdr-label" htmlFor="dsdr-author-emails">
                {t("git.authorEmails", "作者邮箱（可选）")}
              </label>
              <input
                id="dsdr-author-emails"
                className="dsdr-input"
                value={settings.authorEmails || ""}
                placeholder={t(
                  "git.authorEmailsHint",
                  "留空自动读取各仓库 git config；多个邮箱用逗号分隔",
                )}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    authorEmails: event.target.value,
                  }))
                }
              />
            </div>
          ) : null}
        </div>
        {showScan ? (
          <div className="dsdr-scan">
            <div className="dsdr-scan-title">
              {t("scan.title", "从目录批量添加")}
            </div>
            <div className="dsdr-card-desc">
              {t(
                "scan.desc",
                "扫描目录下最多 6 层的 Git 仓库，已存在的会自动跳过。",
              )}
            </div>
            <div className="dsdr-scan-row">
              <div className="dsdr-field">
                <label className="dsdr-label" htmlFor="dsdr-scan-dir">
                  {t("scan.placeholder", "要扫描的目录，例如 E:\\sunline\\SBG")}
                </label>
                <input
                  id="dsdr-scan-dir"
                  className="dsdr-input"
                  value={scanDir}
                  placeholder={t(
                    "scan.placeholder",
                    "要扫描的目录，例如 E:\\sunline\\SBG",
                  )}
                  onChange={(event) => setScanDir(event.target.value)}
                />
              </div>
              <div className="dsdr-actions">
                <button
                  type="button"
                  className="dsdr-btn dsdr-btn-primary"
                  onClick={scanAndAdd}
                  disabled={scanning}
                >
                  {scanning
                    ? t("scan.scanning", "正在扫描…")
                    : t("scan.scan", "扫描并添加")}
                </button>
                <button
                  type="button"
                  className="dsdr-btn"
                  onClick={pickScanDirectory}
                  disabled={scanning}
                >
                  {t("scan.pick", "选择目录")}
                </button>
              </div>
            </div>
            {scanError ? <div className="dsdr-error">{scanError}</div> : null}
            {scanMessage ? (
              <div className="dsdr-hint dsdr-ok">{scanMessage}</div>
            ) : null}
          </div>
        ) : null}
        {settings.git.length === 0 ? (
          <div className="dsdr-empty">
            {t("git.empty", "还没有 Git 仓库。")}
          </div>
        ) : (
          settings.git.map((item, index) => (
            <div className="dsdr-source" key={item._key}>
              <div className="dsdr-field">
                <label className="dsdr-label">
                  {t("git.location", "仓库地址或本地路径")}
                </label>
                <input
                  className="dsdr-input"
                  value={item.location}
                  placeholder={t(
                    "git.placeholder",
                    "https://…/repo.git 或 D:\\code\\repo",
                  )}
                  onChange={(event) =>
                    updateGit(index, {
                      location: event.target.value,
                    })
                  }
                />
              </div>
              <div className="dsdr-field">
                <label className="dsdr-label">{t("git.branch", "分支")}</label>
                <input
                  className="dsdr-input"
                  value={item.branch}
                  placeholder="main"
                  onChange={(event) =>
                    updateGit(index, {
                      branch: event.target.value,
                    })
                  }
                />
              </div>
              <button
                type="button"
                className="dsdr-btn dsdr-btn-danger dsdr-icon-btn"
                title={t("remove", "移除")}
                aria-label={t("remove", "移除")}
                onClick={() => removeGit(index)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </section>
      <section
        className="dsdr-card dsdr-datasource-panel"
        style={{
          display: dataSourceTab === "docs" ? undefined : "none",
        }}
      >
        <div className="dsdr-card-head">
          <div>
            <div className="dsdr-card-title">
              {t("docs.title", "本地文档")}
            </div>
          </div>
          <div className="dsdr-actions">
            <button type="button" className="dsdr-btn" onClick={addDoc}>
              {"+ " + t("docs.add", "添加文档/目录")}
            </button>
          </div>
        </div>
        {settings.docs.length === 0 ? (
          <div className="dsdr-empty">
            {t("docs.empty", "还没有本地文档。")}
          </div>
        ) : (
          settings.docs.map((item, index) => (
            <div className="dsdr-source dsdr-source-docs" key={item._key}>
              <div className="dsdr-field">
                <label className="dsdr-label">
                  {t("docs.location", "文件或目录路径")}
                </label>
                <input
                  className="dsdr-input"
                  value={item.location}
                  placeholder={t("docs.placeholder", "C:\\notes 或 ./docs")}
                  onChange={(event) =>
                    updateDoc(index, {
                      location: event.target.value,
                    })
                  }
                />
              </div>
              <div className="dsdr-field">
                <label className="dsdr-label">
                  {t("docs.label", "显示名称（可选）")}
                </label>
                <input
                  className="dsdr-input"
                  value={item.label}
                  placeholder={t("optional", "可选")}
                  onChange={(event) =>
                    updateDoc(index, {
                      label: event.target.value,
                    })
                  }
                />
              </div>
              <button
                type="button"
                className="dsdr-btn dsdr-btn-danger dsdr-icon-btn"
                title={t("remove", "移除")}
                aria-label={t("remove", "移除")}
                onClick={() => removeDoc(index)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </section>
    </>
  );
}





