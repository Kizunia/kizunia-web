import { ProjectController } from "@/modules/projects/backend/controller";
import { NextRequest } from "next/server";

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) =>
  ProjectController.delete(request, (await params).id);