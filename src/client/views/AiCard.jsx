import React from "react";
import { useApp } from "../context.jsx";
import { Card } from "../components/Card.jsx";
import { Switch } from "../components/Switch.jsx";
import { InfoDot } from "../icons.jsx";

export function AiCard() {
  const { settings, setSettings, useAi, setUseAi, aiInfo, t, confirm = async () => true } = useApp();
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
                "使用 AI 模型基于数据源内容总结概括，生成日报内容。",
              )}
            />
          </div>
        </div>
        <Switch
          checked={useAi}
          disabled={!aiInfo.available}
          label={t("ai.enable", "启用 AI 分析")}
          onChange={async (event) => {
            const nextChecked = event.target.checked;
            if (!nextChecked && useAi) {
              const accepted = await confirm({
                title: t("confirm.disableAi.title", "关闭 AI 分析？"),
                message: t(
                  "confirm.disableAi.message",
                  "关闭后生成日报将不再调用模型分析，已生成的 AI 结果不会删除。",
                ),
                confirmLabel: t("confirm.disable", "关闭"),
                cancelLabel: t("confirm.cancel", "取消"),
              });
              if (!accepted) return;
            }
            setUseAi(nextChecked);
          }}
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
              onChange={async (event) => {
                const selected = aiInfo.models.find(
                  (model) => model.id === event.target.value,
                );
                const nextModel = selected ? selected.id : "";
                if (nextModel === (settings.aiModel || "")) return;
                const accepted = await confirm({
                  title: t("confirm.changeModel.title", "切换 AI 模型？"),
                  message:
                    t("confirm.changeModel.message", "将切换到：") +
                    (selected ? selected.name || selected.id : t("ai.defaultModel", "默认模型")),
                  confirmLabel: t("confirm.switch", "切换"),
                  cancelLabel: t("confirm.cancel", "取消"),
                });
                if (!accepted) return;
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

