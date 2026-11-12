import React from "react";
import { API, cleanSettings, uid } from "../helpers.js";

export function useDataSources({
  settings,
  setSettings,
  useAi,
  range,
  exportFormat,
  sessionId,
  ctx,
  t,
  errorMessageFromPayload,
  confirm = async () => true,
}) {
  const [showScan, setShowScan] = React.useState(false);
  const [scanDir, setScanDir] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState("");
  const [scanError, setScanError] = React.useState("");
  const [testingSources, setTestingSources] = React.useState(false);
  const [testResults, setTestResults] = React.useState(null);
  const [testError, setTestError] = React.useState("");
  const [dataSourceTab, setDataSourceTab] = React.useState("git");

  function updateGit(index, patch) {
    setSettings((previous) => ({
      ...previous,
      git: previous.git.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateDoc(index, patch) {
    setSettings((previous) => ({
      ...previous,
      docs: previous.docs.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
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

  async function removeGit(index) {
    const item = settings.git[index] || {};
    const label = item.label || item.location || t("git.unnamed", "未命名仓库");
    const accepted = await confirm({
      title: t("confirm.removeGit.title", "删除 Git 仓库？"),
      message: t("confirm.removeGit.message", "将从当前配置中移除：") + label,
      confirmLabel: t("confirm.remove", "删除"),
      cancelLabel: t("confirm.cancel", "取消"),
      danger: true,
    });
    if (!accepted) return;
    setSettings((previous) => ({
      ...previous,
      git: previous.git.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function removeDoc(index) {
    const item = settings.docs[index] || {};
    const label = item.label || item.location || t("doc.unnamed", "未命名文档");
    const accepted = await confirm({
      title: t("confirm.removeDoc.title", "删除本地文档？"),
      message: t("confirm.removeDoc.message", "将从当前配置中移除：") + label,
      confirmLabel: t("confirm.remove", "删除"),
      cancelLabel: t("confirm.cancel", "取消"),
      danger: true,
    });
    if (!accepted) return;
    setSettings((previous) => ({
      ...previous,
      docs: previous.docs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function testSources() {
    if (testingSources) return;
    setTestingSources(true);
    setTestError("");
    setTestResults(null);
    try {
      const response = await fetch(API + "/test-sources", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          settings: cleanSettings(settings, useAi, range, exportFormat),
          sessionId,
        }),
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
      setTestResults(Array.isArray(payload.sources) ? payload.sources : []);
    } catch (err) {
      setTestError(
        err && err.message ? err.message : t("test.failed", "测试数据源失败"),
      );
    } finally {
      setTestingSources(false);
    }
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
      setScanError(
        err && err.message ? err.message : t("scan.failed", "扫描目录失败"),
      );
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
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
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
      const existing = new Set(
        settings.git.map(
          (item) => item.location.toLowerCase() + "\u0000" + item.branch,
        ),
      );
      const additions = [];
      for (const repo of repos) {
        if (
          !repo ||
          typeof repo.location !== "string" ||
          repo.location.length === 0
        )
          continue;
        const key =
          repo.location.toLowerCase() + "\u0000" + (repo.branch || "");
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
        setSettings((previous) => ({
          ...previous,
          git: [...previous.git, ...additions],
        }));
      }
      const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
      setScanMessage(
        repos.length === 0
          ? t("scan.empty", "该目录下没有发现 Git 仓库。")
          : t("scan.found", "发现") +
              " " +
              repos.length +
              " · " +
              t("scan.added", "新增") +
              " " +
              additions.length +
              (warnings.length > 0 ? " · " + warnings.join(" ") : ""),
      );
    } catch (err) {
      setScanError(
        err && err.message ? err.message : t("scan.failed", "扫描目录失败"),
      );
    } finally {
      setScanning(false);
    }
  }

  return {
    showScan,
    scanDir,
    setScanDir,
    scanning,
    scanMessage,
    scanError,
    testingSources,
    testResults,
    testError,
    dataSourceTab,
    setDataSourceTab,
    updateGit,
    updateDoc,
    addGit,
    addDoc,
    removeGit,
    removeDoc,
    testSources,
    toggleScan,
    pickScanDirectory,
    scanAndAdd,
  };
}


