import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function LeadsLoading() {
  return <PageSkeleton width="list" rows={8} density="queue" />;
}
