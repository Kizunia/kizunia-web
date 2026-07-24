import UpdateHackathonForm from "./_components/UpdateHackathonForm";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UpdateHackathonForm hackathonId={id} />;
}