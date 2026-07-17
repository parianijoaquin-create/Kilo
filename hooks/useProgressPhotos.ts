"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/imageResize";

const BUCKET = "progress-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 h; alcanza para la sesión de visualización.

export interface ProgressPhoto {
  id: string;
  storage_path: string;
  taken_at: string;
  weight_kg: number | null;
  note: string | null;
  /** URL firmada para mostrar la imagen (se resuelve al cargar). */
  url: string | null;
}

interface NewPhoto {
  weight_kg?: number | null;
  note?: string | null;
}

export function useProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const uploadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: qErr } = await supabase
        .from("progress_photos")
        .select("id, storage_path, taken_at, weight_kg, note")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false });

      if (cancelled) return;
      if (qErr || !data) {
        setError(qErr?.message ?? null);
        setLoading(false);
        return;
      }

      const rows = data as Omit<ProgressPhoto, "url">[];
      const paths = rows.map((r) => r.storage_path);
      const signed = paths.length
        ? (await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)).data
        : [];
      const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

      if (!cancelled) {
        setPhotos(rows.map((r) => ({ ...r, url: urlByPath.get(r.storage_path) ?? null })));
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const addPhoto = useCallback(async (file: File, meta: NewPhoto = {}) => {
    if (uploadingRef.current) return { error: "Ya se está subiendo una foto" };
    uploadingRef.current = true;
    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: "No autenticado" };

      const blob = await resizeImage(file);
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) return { error: upErr.message };

      const { data: row, error: insErr } = await supabase
        .from("progress_photos")
        .insert({
          user_id: user.id,
          storage_path: path,
          taken_at: new Date().toISOString(),
          weight_kg: meta.weight_kg ?? null,
          note: meta.note?.trim() || null,
        })
        .select("id, storage_path, taken_at, weight_kg, note")
        .single();

      if (insErr || !row) {
        // Rollback del storage si falló el insert, para no dejar huérfanos.
        await supabase.storage.from(BUCKET).remove([path]);
        return { error: insErr?.message ?? "No se pudo guardar la foto" };
      }

      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);

      const newPhoto: ProgressPhoto = {
        ...(row as Omit<ProgressPhoto, "url">),
        url: signed?.signedUrl ?? null,
      };
      setPhotos((prev) => [newPhoto, ...prev]);
      return { error: null };
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }, [supabase]);

  const deletePhoto = useCallback(async (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (!target) return { error: "Foto no encontrada" };

    const { error: delErr } = await supabase
      .from("progress_photos")
      .delete()
      .eq("id", id);
    if (delErr) return { error: delErr.message };

    await supabase.storage.from(BUCKET).remove([target.storage_path]);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  }, [supabase, photos]);

  return { photos, loading, uploading, error, addPhoto, deletePhoto };
}
