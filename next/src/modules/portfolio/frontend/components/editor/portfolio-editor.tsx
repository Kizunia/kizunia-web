import { PortfolioEditorDto } from "@/modules/portfolio/dtos";



interface PortfolioEditorProps {
  portfolio: PortfolioEditorDto;
}

export function PortfolioEditor({
  portfolio,
}: PortfolioEditorProps) {
  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Portfolio
        </p>

        <h1 className="text-2xl font-semibold tracking-tight">
          {portfolio.displayName}
        </h1>
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
    </div>
  );
}