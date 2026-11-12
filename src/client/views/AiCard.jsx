import React from "react";
import { useApp } from "../context.jsx";
import { Card } from "../components/Card.jsx";
import { Switch } from "../components/Switch.jsx";
import { InfoDot } from "../icons.jsx";

export function AiCard() {
  const { settings, setSettings, useAi, setUseAi, aiInfo, t } = useApp();
  return (
    <Card>
      <div className="dsdr-card-head">
        <div>
          <div className="dsdr-title-with-info">
            <div className="dsdr-card-title dsdr-ai-title">
              {t("ai.title", "AI 分析")}
            </div>
            <InfoDot
              text={t(
                "ai.desc",
                "使用当前默认模型分析提交说明、代码变更和文档摘要，生成按天简要总结。",
              )}
            />
          </div>
        </div>
        <Switch
          checked={useAi}
          disabled={!aiInfo.available}
          label={t("ai.enable", "启用 AI 分析")}
          onChange={(event) => setUseAi(event.target.checked)}
        />
      </div>
      <div className="dsdr-hint">
        {aiInfo.available
          ? t("ai.model", "当前模型：") +
            (settings.aiModel
              ? (settings.aiProvider ? settings.aiProvider + "/" : "") +
                settings.aiModel
              : aiInfo.provider + "/" + aiInfo.model) +
            " · " +
            t("ai.cost", "会增加生成时间和模型 token 消耗。")
          : t("ai.unavailable", "当前没有可用的默认模型。")}
      </div>
      <div className="dsdr-ai-options">
        <div className="dsdr-field">
          <label className="dsdr-label" htmlFor="dsdr-ai-template">
            {t("ai.template", "分析风格")}
          </label>
          <select
            id="dsdr-ai-template"
            className="dsdr-input"
            value={settings.aiTemplate || "concise"}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                aiTemplate: event.target.value,
              }))
            }
          >
            <option value="concise">{t("ai.template.concise", "简洁")}</option>
            <option value="detailed">
              {t("ai.template.detailed", "详细")}
            </option>
            <option value="manager">
              {t("ai.template.manager", "管理汇报")}
            </option>
          </select>
        </div>
        <div className="dsdr-field">
          <label className="dsdr-label" htmlFor="dsdr-ai-model">
            {t("ai.modelSelect", "模型")}
          </label>
          {aiInfo.models && aiInfo.models.length > 0 ? (
            <select
              id="dsdr-ai-model"
              className="dsdr-input"
              value={settings.aiModel || ""}
              onChange={(event) => {
                const selected = aiInfo.models.find(
                  (model) => model.id === event.target.value,
                );
                setSettings((previous) => ({
                  ...previous,
                  aiProvider: selected ? selected.provider : "",
                  aiModel: selected ? selected.id : "",
                }));
              }}
            >
              <option value="">
                {t("ai.defaultModel", "默认模型") +
                  "（" +
                  aiInfo.provider +
                  "/" +
                  aiInfo.model +
                  "）"}
              </option>
              {aiInfo.models.map((model) => (
                <option value={model.id} key={model.provider + "/" + model.id}>
                  {model.name || model.id}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="dsdr-ai-model"
              className="dsdr-input"
              value={settings.aiModel || ""}
              placeholder={t("ai.defaultModel", "默认模型")}
              onChange={(event) =>
                setSettings((previous) => ({
                  ...previous,
                  aiProvider: "",
                  aiModel: event.target.value,
                }))
              }
            />
          )}
        </div>
      </div>
    </Card>
  );
}

