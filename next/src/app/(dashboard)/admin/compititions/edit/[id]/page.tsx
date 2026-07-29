import { Card, CardHeader, CardContent } from "@/components/ui/card";


import UpdateHackathonForm from "./_components/UpdateHackathonForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;


  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">This page is depricated, use /admin/compititions/id </h2>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={'/admin/compititions'}>
              Go to /admin/compititions
            </Link>
          </Button>
        </CardContent>
         
    </Card>
  )
  return <UpdateHackathonForm hackathonId={id} />;
}