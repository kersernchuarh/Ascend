"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Download, Trash2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportAllData, importAllData, resetAllData } from "@/persistence/export-import";

/**
 * "The user's only insurance against local-only storage" (PRODUCT_BLUEPRINT.md
 * §18) — flagged as a v1 requirement since Phase 2, never built until now
 * (§28 gap #10). Export/import work on the raw storage layer directly, not
 * through any entity provider's hooks — deliberately: this feature
 * shouldn't need to know or care how many entity types exist. Both import
 * and reset reload the page on success, the one place in this app that's
 * the honest choice rather than a shortcut: every provider only reads
 * storage once, on mount, so nothing short of a real reload makes newly
 * written data (or a real reset back to zero) actually show up everywhere.
 */
function DataCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ascend-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;
    setImportError(null);
    setPendingImportFile(file);
  }

  async function confirmImport() {
    if (!pendingImportFile) return;
    try {
      const text = await pendingImportFile.text();
      const parsed: unknown = JSON.parse(text);
      const result = importAllData(parsed);
      if (!result.ok) {
        setImportError(result.error);
        setPendingImportFile(null);
        return;
      }
      window.location.reload();
    } catch {
      setImportError("That file isn't valid JSON.");
      setPendingImportFile(null);
    }
  }

  function confirmReset() {
    resetAllData();
    window.location.reload();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Your data"
          description="Everything lives only in this browser — export a backup, or move it to another device"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="size-3.5" />
            Export data
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Import data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileSelected}
            className="hidden"
            aria-label="Choose an Ascend export file to import"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setResetDialogOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Reset all data
          </Button>
        </div>
        {importError ? (
          <p className="flex items-center gap-1.5 text-caption text-red">
            <AlertTriangle className="size-3.5 shrink-0" />
            {importError}
          </p>
        ) : null}
      </CardContent>

      <Dialog open={pendingImportFile != null} onOpenChange={(open) => !open && setPendingImportFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace your current data?</DialogTitle>
            <DialogDescription>
              Importing &ldquo;{pendingImportFile?.name}&rdquo; replaces every task, deliverable, habit,
              calendar event, session, and preference currently in Ascend. This can&apos;t be undone
              unless you&apos;ve exported your current data first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingImportFile(null)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>Replace and reload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all data?</DialogTitle>
            <DialogDescription>
              This permanently deletes every task, deliverable, subject, habit, calendar event, and
              session — and returns Ascend to its first-run welcome screen. This can&apos;t be undone
              unless you&apos;ve exported your data first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export { DataCard };
