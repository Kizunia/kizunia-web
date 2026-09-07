"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { PortfolioEmptyState } from "@/modules/portfolio/frontend/components/portfolio-empty-state";
import { PortfolioEditorLoading } from "@/modules/portfolio/frontend/components/editor/portfolio-editor-loading";
import { usePortfolioStore } from "@/modules/portfolio/frontend/store/portfolio.store";
import { PortfolioEditor } from "@/modules/portfolio/frontend/components/editor/portfolio-editor";
import { UsernameDialog } from "@/modules/portfolio/frontend/components/username-dialog";


export default function PortfolioPage() {
  const session = authClient.useSession();

  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);

  const portfolio = usePortfolioStore(
    (state) => state.portfolio,
  );

  const isLoading = usePortfolioStore(
    (state) => state.isLoading,
  );

  const isCreating = usePortfolioStore(
    (state) => state.isCreating,
  );

  const getMine = usePortfolioStore(
    (state) => state.getMine,
  );

  const createPortfolio = usePortfolioStore(
    (state) => state.createPortfolio,
  );

  useEffect(() => {
    void getMine();
  }, [getMine]);

  const handleCreate = () => {
    // Portfolio URLs are keyed by username. If the actor already has one,
    // create normally; otherwise collect it first via a minimal popup and
    // continue creation once it's set, instead of redirecting elsewhere.
    if (session.data?.user.username) {
      void createPortfolio();
      return;
    }

    setUsernameDialogOpen(true);
  };

  if (isLoading) {
    return <PortfolioEditorLoading />;
  }

  return (
    <>
      {!portfolio ? (
        <PortfolioEmptyState isCreating={isCreating} onCreate={handleCreate} />
      ) : (
        <PortfolioEditor portfolio={portfolio} />
      )}

      <UsernameDialog
        open={usernameDialogOpen}
        onOpenChange={setUsernameDialogOpen}
        title="Set your username"
        description="Your portfolio's public URL is based on your username. Choose one to continue creating your portfolio."
        submitLabel="Continue"
        onSuccess={() => {
          void createPortfolio();
        }}
      />
    </>
  );
}