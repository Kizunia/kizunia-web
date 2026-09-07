"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PortfolioEditorDto } from "@/modules/portfolio/dtos";
import { UsernameDialog } from "@/modules/portfolio/frontend/components/username-dialog";



interface PortfolioEditorProps {
  portfolio: PortfolioEditorDto;
}

export function PortfolioEditor({
  portfolio,
}: PortfolioEditorProps) {
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Portfolio
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            {portfolio.displayName}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {portfolio.user.username
              ? `kizunia.com/u/${portfolio.user.username}`
              : "No username set — your portfolio is not publicly reachable yet."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setUsernameDialogOpen(true)}
        >
          Change Username
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Portfolio editor
        </p>

        <p className="mt-2 text-sm">
          Your portfolio has been created. The editor sections
          will be added here.
        </p>
      </div>

      <UsernameDialog
        open={usernameDialogOpen}
        onOpenChange={setUsernameDialogOpen}
        title="Change username"
        description="This changes your public portfolio URL. Links to your old username will stop working."
        submitLabel="Save"
        initialUsername={portfolio.user.username ?? ""}
      />
    </div>
  );
}