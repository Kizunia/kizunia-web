import PageWrapper from "@/components/page-wrapper";
import { ProfileEditor } from "@/modules/portfolio/frontend/components/editor/profile/profile-editor";

export default function PortfolioProfilePage() {
  return (
    <PageWrapper breadcrumbs={[]} >
      <ProfileEditor />
    </PageWrapper>
  );
}
