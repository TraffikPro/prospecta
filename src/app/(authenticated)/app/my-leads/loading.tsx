import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function MyLeadsLoading() {
  return <PageSkeleton width="list" rows={6} density="queue" />;
}
