import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAllVolumes } from "@/lib/volumes";
import { usingSupabase } from "@/lib/db";
import VolumeForm from "@/components/admin/VolumeForm";

export default async function EditVolume({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const v = (await getAllVolumes(true)).find((x) => x.slug === slug);
  if (!v) notFound();
  return <VolumeForm initial={v} isNew={false} nextNumber={v.number} storageEnabled={usingSupabase} />;
}
