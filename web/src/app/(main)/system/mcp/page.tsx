"use client";

import * as React from "react";

import { PlusIcon, RefreshCwIcon, ServerIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import type { Agent, MCPServer, MCPTool } from "@/lib/types";

type Transport = "stdio" | "http" | "sse";
type FormState = {
  name: string;
  transport: Transport;
  command: string;
  args: string;
  url: string;
  env: string;
  insecure: boolean;
  timeoutSeconds: string;
};
const emptyForm: FormState = {
  name: "",
  transport: "stdio",
  command: "",
  args: "",
  url: "",
  env: "",
  insecure: false,
  timeoutSeconds: "",
};

export default function MCPPage() {
  const { t } = useLocale();
  const [servers, setServers] = React.useState<MCPServer[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [visibility, setVisibility] = React.useState<Record<number, string[]>>({});

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MCPServer | null>(null); // null = add mode
  const [tab, setTab] = React.useState<"config" | "tools">("config");
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [tools, setTools] = React.useState<MCPTool[]>([]);
  const [toolsLoading, setToolsLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(() => {
    api
      .agents()
      .then(setAgents)
      .catch(() => {});
    api
      .mcpServers()
      .then((ss) => {
        setServers(ss);
        ss.forEach((s) =>
          api
            .resourceVisibility("mcp", s.id)
            .then((ids) => setVisibility((v) => ({ ...v, [s.id]: ids })))
            .catch(() => {}),
        );
      })
      .catch(() => {});
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);

  function setF(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function parseEnv(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        if (key) out[key] = trimmed.slice(idx + 1).trim();
      }
    }
    return out;
  }
  function envToText(env: Record<string, string> | undefined): string {
    return Object.entries(env ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setTools([]);
    setTab("config");
    setOpen(true);
  }

  function openEdit(s: MCPServer) {
    setEditing(s);
    setForm({
      name: s.name,
      transport: s.transport,
      command: s.command ?? "",
      args: (s.args ?? []).join(" "),
      url: s.url ?? "",
      env: envToText(s.env),
      insecure: s.insecure ?? false,
      timeoutSeconds: s.timeout_seconds ? String(s.timeout_seconds) : "",
    });
    setTab("config");
    setOpen(true);
    loadTools(s.id);
  }

  async function loadTools(id: number) {
    setToolsLoading(true);
    try {
      setTools(await api.mcpTools(id));
    } catch {
      setTools([]);
    } finally {
      setToolsLoading(false);
    }
  }

  async function saveForm() {
    if (!form.name.trim()) {
      toast.error(t("toolsUiFillName"));
      return;
    }
    if (form.transport === "stdio" && !form.command.trim()) {
      toast.error(t("toolsUiFillCommand"));
      return;
    }
    if (form.transport !== "stdio" && !form.url.trim()) {
      toast.error(t("toolsUiFillRemoteUrl"));
      return;
    }
    setSaving(true);
    try {
      const base =
        form.transport !== "stdio"
          ? {
              transport: form.transport,
              url: form.url.trim(),
              command: "",
              args: [] as string[],
              env: parseEnv(form.env), // in remote mode env holds request headers
              insecure: form.insecure,
              ...(Number.isFinite(Number(form.timeoutSeconds)) && Number(form.timeoutSeconds) > 0
                ? { timeout_seconds: Number(form.timeoutSeconds) }
                : {}),
            }
          : {
              transport: "stdio" as const,
              command: form.command.trim(),
              args: form.args.trim() ? form.args.trim().split(/\s+/) : [],
              env: parseEnv(form.env),
              insecure: false,
            };
      await api.saveMcpServer({
        ...(editing ? { id: editing.id } : {}),
        name: form.name.trim(),
        enabled: editing ? editing.enabled : true,
        ...base,
      });
      toast.success(editing ? t("findingSaved") : t("toolsUiMcpServerAdded"));
      if (!editing) setOpen(false);
      load();
    } catch (e) {
      toast.error(t("saveFailed") + ": " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshTools() {
    if (!editing) return;
    setRefreshing(true);
    try {
      const fetched = await api.refreshMcpServer(editing.id);
      setTools(fetched);
      toast.success(`${fetched.length} ${t("toolsUiFoundToolsSuffix")}`);
      load();
    } catch (e) {
      toast.error(t("toolsUiRefreshFailed") + ": " + (e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  async function removeServer(s: MCPServer) {
    try {
      await api.deleteMcpServer(s.id);
      toast.success(`${t("statusDeleted")}: ${s.name}`);
      setOpen(false);
      load();
    } catch (e) {
      toast.error(t("deleteFailed") + ": " + (e as Error).message);
    }
  }

  async function toggleEnabled(s: MCPServer) {
    try {
      await api.saveMcpServer({ ...s, enabled: !s.enabled });
      load();
    } catch (e) {
      toast.error(t("operationFailed") + ": " + (e as Error).message);
    }
  }

  async function toggleVisibility(serverId: number, agentId: string, agentName: string) {
    const on = (visibility[serverId] ?? []).includes(agentId);
    try {
      await api.toggleVisibility(agentId, "mcp", serverId, !on);
      toast.success(`${on ? t("toolsUiVisibilityRevoked") : t("toolsUiVisibilityGranted")} "${agentName}"`);
      load();
    } catch (e) {
      toast.error(t("operationFailed") + ": " + (e as Error).message);
    }
  }

  function renderForm() {
    return (
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>{t("toolsUiTransport")}</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.transport === "stdio" ? "default" : "outline"}
              onClick={() => setF({ transport: "stdio" })}
            >
              {t("toolsUiTransportStdio")}
            </Button>
            <Button
              type="button"
              variant={form.transport === "http" ? "default" : "outline"}
              onClick={() => setF({ transport: "http" })}
            >
              {t("toolsUiTransportHttp")}
            </Button>
            <Button
              type="button"
              variant={form.transport === "sse" ? "default" : "outline"}
              onClick={() => setF({ transport: "sse" })}
            >
              {t("toolsUiTransportSse")}
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="m-name">{t("workspaceName")}</Label>
          <Input
            id="m-name"
            placeholder="filesystem"
            value={form.name}
            onChange={(e) => setF({ name: e.target.value })}
          />
        </div>
        {form.transport === "stdio" ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="m-cmd">{t("toolsUiCommandLabel")}</Label>
              <Input
                id="m-cmd"
                className="font-mono"
                placeholder="npx"
                value={form.command}
                onChange={(e) => setF({ command: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-args">{t("toolsUiArguments")}</Label>
              <Input
                id="m-args"
                className="font-mono"
                placeholder="-y @modelcontextprotocol/server-filesystem /data"
                value={form.args}
                onChange={(e) => setF({ args: e.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="m-url">{t("toolsUiRemoteUrl")}</Label>
            <Input
              id="m-url"
              className="font-mono"
              placeholder="https://mcp.example.com/mcp"
              value={form.url}
              onChange={(e) => setF({ url: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.insecure} onCheckedChange={(v) => setF({ insecure: v === true })} />
              {t("toolsUiSkipTls")}
            </label>
            <Label htmlFor="m-timeout">{t("toolsUiRequestTimeout")}</Label>
            <Input
              id="m-timeout"
              type="number"
              min={5}
              placeholder="120"
              value={form.timeoutSeconds}
              onChange={(e) => setF({ timeoutSeconds: e.target.value })}
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="m-env">
            {form.transport !== "stdio" ? t("toolsUiRequestHeadersHelp") : t("toolsUiEnvHelp")}
          </Label>
          <Textarea
            id="m-env"
            className="font-mono"
            placeholder={form.transport !== "stdio" ? "Authorization=Bearer xxxx" : "API_KEY=xxxx\nFOO=bar"}
            value={form.env}
            onChange={(e) => setF({ env: e.target.value })}
          />
        </div>
      </div>
    );
  }

  function renderTools() {
    return (
      <div className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {tools.length} {t("cmdUiToolsCount")}
          </span>
          <Button size="sm" variant="outline" disabled={refreshing} onClick={refreshTools}>
            <RefreshCwIcon className={refreshing ? "animate-spin" : ""} /> {t("workspaceRefresh")}
          </Button>
        </div>
        {toolsLoading ? (
          <p className="text-muted-foreground text-sm">{t("toolsUiLoading")}</p>
        ) : tools.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("toolsUiNoToolsDiscovered")}</p>
        ) : (
          <div className="flex flex-col divide-y">
            {tools.map((tool) => (
              <div key={tool.name} className="py-2.5">
                <code className="font-mono text-sm">{tool.name}</code>
                {tool.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{tool.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("navMcp")}</h1>
        <p className="text-muted-foreground text-sm">{t("toolsUiMcpPageDescription")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={openAdd}
          className="text-foreground/70 border-foreground/70 hover:bg-muted/60 hover:shadow-sm flex min-h-[116px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition"
        >
          <PlusIcon className="size-6" />
          <span className="text-sm">{t("toolsUiAddMcp")}</span>
        </button>

        {servers.map((s) => (
          <Card
            key={s.id}
            onClick={() => openEdit(s)}
            className="hover:border-primary/60 cursor-pointer gap-3 transition hover:shadow-sm"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <ServerIcon className="text-muted-foreground size-4 shrink-0" />
                <CardTitle className="truncate text-base">{s.name}</CardTitle>
                <Badge variant="outline" className="uppercase">
                  {s.transport}
                </Badge>
                {s.last_connect_ok === false ? (
                  <Badge
                    variant="destructive"
                    className="max-w-55 truncate font-normal"
                    title={s.last_connect_err ?? t("toolsUiConnectFailed")}
                  >
                    {t("toolsUiDownPrefix")}{" "}
                    {s.last_connect_err ? s.last_connect_err.slice(0, 60) : t("toolsUiConnectFailed")}
                  </Badge>
                ) : s.last_connect_ok === true ? (
                  <Badge variant="secondary" className="font-normal">
                    {t("toolsUiOkPrefix")} {s.last_connect_at ? new Date(s.last_connect_at).toLocaleTimeString() : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground font-normal">
                    {t("toolsUiNotConnected")}
                  </Badge>
                )}
                <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={() => toggleEnabled(s)}
                    aria-label={t("toolsUiEnable")}
                  />
                  <Button size="icon" variant="outline" aria-label={t("delete")} onClick={() => removeServer(s)}>
                    <Trash2Icon className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-muted-foreground text-sm">
                {s.tools && s.tools.length > 0 ? `${s.tools.length} ${t("cmdUiToolsCount")}` : t("toolsUiNoToolsYet")}
              </p>
              <div className="grid gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-muted-foreground text-xs">{t("toolsUiVisibilityPerAgent")}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {agents.map((a) => (
                    <label key={a.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={(visibility[s.id] ?? []).includes(a.id)}
                        onCheckedChange={() => toggleVisibility(s.id, a.id, a.name)}
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full data-[side=right]:sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? editing.name : t("toolsUiAddMcpServer")}</SheetTitle>
            <SheetDescription>{t("toolsUiTransportHelp")}</SheetDescription>
          </SheetHeader>

          {editing ? (
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "config" | "tools")}
              className="flex min-h-0 flex-1 flex-col px-4"
            >
              <TabsList>
                <TabsTrigger value="config">{t("toolsUiConfig")}</TabsTrigger>
                <TabsTrigger value="tools">
                  {t("agentUiTools")}
                  {tools.length ? ` (${tools.length})` : ""}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="config" className="min-h-0 flex-1 overflow-y-auto">
                {renderForm()}
                <div className="flex gap-2 pt-2 pb-6">
                  <Button onClick={saveForm} disabled={saving}>
                    {t("save")}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="tools" className="min-h-0 flex-1 overflow-y-auto">
                {renderTools()}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
              {renderForm()}
              <div className="pt-2 pb-6">
                <Button onClick={saveForm} disabled={saving}>
                  <PlusIcon /> {t("notifyAddAction")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
