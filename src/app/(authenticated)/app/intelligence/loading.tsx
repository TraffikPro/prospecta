import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function IntelligenceLoading() {
  return <PageSkeleton width="list" rows={6} density="queue" />;
}
