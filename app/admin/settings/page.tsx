import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/volumes";
import { usingSupabase } from "@/lib/db";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function Settings() {
  await requireAdmin();
  return (
    <>
      <div className="adm-head"><h1>Réglages</h1></div>
      <SettingsForm site={await getSite(true)} canChangePassword={usingSupabase} />
    </>
  );
}
