"use client";

import { useEffect } from "react";

import { PortfolioEditor } from "@/modules/portfolio/frontend/components/portfolio-editor";
import { PortfolioEmptyState } from "@/modules/portfolio/frontend/components/portfolio-empty-state";
import { PortfolioEditorLoading } from "@/modules/portfolio/frontend/components/portfolio-editor-loading";
import { usePortfolioStore } from "@/modules/portfolio/frontend/store/portfolio.store";


export default function PortfolioPage() {
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

  if (isLoading) {
    return <PortfolioEditorLoading />;
  }

  if (!portfolio) {
    return (
      <PortfolioEmptyState
        isCreating={isCreating}
        onCreate={() => {
          void createPortfolio();
        }}
      />
    );
  }

  return <PortfolioEditor portfolio={portfolio} />;
}