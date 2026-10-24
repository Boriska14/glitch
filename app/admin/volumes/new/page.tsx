import { requireAdmin } from "@/lib/auth";
import { getAllVolumes } from "@/lib/volumes";
import { usingSupabase } from "@/lib/db";
import VolumeForm from "@/components/admin/VolumeForm";

export default async function NewVolume() {
  await requireAdmin();
  const all = await getAllVolumes(true);
  return <VolumeForm isNew nextNumber={Math.max(0, ...all.map((v) => v.number)) + 1} storageEnabled={usingSupabase} />;
}
