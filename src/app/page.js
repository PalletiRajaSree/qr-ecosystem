"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { QRCodeCanvas } from "qrcode.react";

export default function Home() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [loadingTest, setLoadingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState("");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const [qrList, setQrList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");

  // 1) Check auth on mount
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);
      if (!user) {
        window.location.href = "/auth";
        return;
      }
      await loadQrList(user);
    };
    init();
  }, []);

  const testLoadQrCodes = async () => {
    try {
      setLoadingTest(true);
      setTestError("");
      setTestResult(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTestError("Not logged in.");
        return;
      }

      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("user_id", user.id)
        .limit(5);

      if (error) {
        console.error("Supabase error:", error);
        setTestError(error.message);
        return;
      }

      console.log("QR codes from Supabase (test):", data);
      setTestResult(data);
    } catch (e) {
      console.error(e);
      setTestError(e.message);
    } finally {
      setLoadingTest(false);
    }
  };

  const loadQrList = async (currentUser) => {
    try {
      setLoadingList(true);
      setListError("");

      const userToUse = currentUser || user;
      if (!userToUse) return;

      const { data, error } = await supabase
        .from("qr_codes")
        .select(
          `
          id,
          name,
          slug,
          destination_url,
          description,
          logo_url,
          is_active,
          created_at,
          qr_scans (
            id,
            scanned_at
          )
        `
        )
        .eq("user_id", userToUse.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load list error:", error);
        setListError(error.message);
        return;
      }

      const withCounts =
        data?.map((row) => ({
          ...row,
          scan_count: row.qr_scans ? row.qr_scans.length : 0,
          last_scanned_at:
            row.qr_scans && row.qr_scans.length > 0
              ? row.qr_scans[row.qr_scans.length - 1].scanned_at
              : null,
        })) || [];

      setQrList(withCounts);
    } catch (e) {
      console.error(e);
      setListError(e.message);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCreateQr = async (e) => {
    e.preventDefault();
    setCreateMessage("");

    if (!name || !url) {
      setCreateMessage("Please enter both name and destination URL.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    try {
      setCreating(true);

      const randomPart = Math.random().toString(36).substring(2, 8);
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") +
        "-" +
        randomPart;

      const { data, error } = await supabase
        .from("qr_codes")
        .insert([
          {
            name,
            slug,
            destination_url: url,
            description,
            logo_url: logoUrl,
            type: "url",
            is_active: true,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Create QR error:", error);
        setCreateMessage(`Error: ${error.message}`);
        return;
      }

      console.log("Created QR:", data);
      setCreateMessage(`Created QR with slug: ${data.slug}`);
      setName("");
      setUrl("");
      setDescription("");
      setLogoUrl("");
      await loadQrList(user);
    } catch (err) {
      console.error(err);
      setCreateMessage(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (qr) => {
    try {
      const { error } = await supabase
        .from("qr_codes")
        .update({ is_active: !qr.is_active })
        .eq("id", qr.id)
        .eq("user_id", user.id);

      if (!error) {
        await loadQrList(user);
      } else {
        console.error("Toggle active error:", error);
        alert("Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p>Checking authentication...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center py-10 px-4">
      <header className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-1">
            QR Nexus — Smart QR Ecosystem
          </h1>
          <p className="text-slate-300 text-sm">
            RT-4: Advanced Smart QR Code Ecosystem Platform.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2 text-lg">1. Test Supabase connection</h2>
        <button
          onClick={testLoadQrCodes}
          disabled={loadingTest}
          className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-sm font-medium disabled:opacity-60"
        >
          {loadingTest ? "Testing..." : "Load first 5 qr_codes (yours)"}
        </button>

        {testError && (
          <p className="text-red-400 mt-3 text-sm">Error: {testError}</p>
        )}

        {testResult && (
          <pre className="mt-3 max-w-full text-xs bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </section>

      <section className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3 text-lg">2. Create a QR record</h2>

        <form onSubmit={handleCreateQr} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">QR Name</label>
            <input
              type="text"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="Cafe Menu - Table 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Destination URL</label>
            <input
              type="url"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="https://example.com/menu"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description (optional)</label>
            <input
              type="text"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="Short note about this QR"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Logo URL (optional)</label>
            <input
              type="url"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-sm font-medium disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create QR"}
          </button>
        </form>

        {createMessage && (
          <p className="mt-3 text-sm text-slate-300">{createMessage}</p>
        )}
      </section>

      <section className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">3. Your QR codes</h2>
          <button
            onClick={() => loadQrList()}
            disabled={loadingList}
            className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium disabled:opacity-60"
          >
            {loadingList ? "Refreshing..." : "Refresh list"}
          </button>
        </div>

        {listError && (
          <p className="text-red-400 mb-2 text-sm">Error: {listError}</p>
        )}

        {qrList.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No QR codes yet. Create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-slate-800">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Name
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Description
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Destination URL
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    QR Code
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Active
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Toggle
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Created at
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Scans
                  </th>
                  <th className="px-3 py-2 border-b border-slate-800 text-left">
                    Last scanned
                  </th>
                </tr>
              </thead>
              <tbody>
                {qrList.map((qr) => {
                  const qrUrl = `https://qr-ecosystem-kfmxod9uz-palletirajasrees-projects.vercel.app/q/${qr.slug}`;

                  return (
                    <tr
                      key={qr.id}
                      className="odd:bg-slate-900 even:bg-slate-950"
                    >
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.name}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.description || "-"}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.destination_url}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        <div className="bg-white p-1 inline-block rounded">
                          <QRCodeCanvas value={qrUrl} size={64} />
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.is_active ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        <button
                          onClick={() => handleToggleActive(qr)}
                          className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700"
                        >
                          {qr.is_active ? "Disable" : "Enable"}
                        </button>
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.created_at
                          ? new Date(qr.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.scan_count ?? 0}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-800">
                        {qr.last_scanned_at
                          ? new Date(qr.last_scanned_at).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
