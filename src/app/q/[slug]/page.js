import { supabase } from "../../../lib/supabaseClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QrRedirectPage(props) {
  const params = await props.params;
  const { slug } = params;

  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, destination_url, is_active, expires_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 px-4">
        <h1 className="text-2xl font-semibold mb-2">QR not found</h1>
        <p className="text-slate-300">
          This QR code does not exist or has been removed.
        </p>
      </main>
    );
  }

  const now = new Date();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;

  if (!data.is_active || (expiresAt && expiresAt < now)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 px-4">
        <h1 className="text-2xl font-semibold mb-2">QR expired or inactive</h1>
        <p className="text-slate-300">
          This QR code is no longer active. Please contact the owner.
        </p>
      </main>
    );
  }

  // record one scan in qr_scans table
  await supabase.from("qr_scans").insert([
    {
      qr_id: data.id,
      scanned_at: new Date().toISOString(),
    },
  ]);

  redirect(data.destination_url);
}
