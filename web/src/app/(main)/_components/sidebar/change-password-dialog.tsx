"use client";

import * as React from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { t } = useLocale();

  // reset fields whenever the dialog closes
  React.useEffect(() => {
    if (!open) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error(t("miscUiFillPasswords"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("miscUiPasswordMismatch"));
      return;
    }
    setSaving(true);
    api
      .changePassword(oldPassword, newPassword)
      .then(() => {
        toast.success(t("miscUiPasswordChanged"));
        onOpenChange(false);
      })
      .catch((err) => toast.error(`${t("miscUiChangeFailed")}: ${(err as Error).message}`))
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t("miscUiChangePassword")}</DialogTitle>
            <DialogDescription>
              {t("miscUiChangePasswordDescPre")} <b>ARTEX</b>
              {t("miscUiChangePasswordDescPost")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-old">{t("miscUiCurrentPassword")}</Label>
              <Input
                id="cp-old"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                disabled={saving}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-new">{t("newPassword")}</Label>
              <Input
                id="cp-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                disabled={saving}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-confirm">{t("miscUiConfirmNewPassword")}</Label>
              <Input
                id="cp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                disabled={saving}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("miscUiChanging") : t("miscUiConfirmChange")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
