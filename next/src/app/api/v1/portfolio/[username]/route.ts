import { PortfolioController } from "@/modules/portfolio/backend/controller";


export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{
      username: string;
    }>;
  },
) {
  const { username } = await params;

  return PortfolioController.findPublicByUsername(
    username,
  );
}