"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { resizeImage } from "@/lib/imageResize";

const BUCKET = "progress-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 h; alcanza para la sesión de visualización.
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

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
  const { userId, loading: authLoading } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    let cancelled = false;

    async function load() {
      const { data, error: qErr } = await supabase
        .from("progress_photos")
        .select("id, storage_path, taken_at, weight_kg, note")
        .eq("user_id", userId)
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
  }, [supabase, userId, authLoading]);

  const addPhoto = useCallback(async (file: File, meta: NewPhoto = {}) => {
    if (uploadingRef.current) return { error: "Ya se está subiendo una foto" };
    uploadingRef.current = true;
    setUploading(true);
    setError(null);

    try {
      const fail = (message: string) => {
        setError(message);
        return { error: message };
      };
      if (!userId) return fail("No autenticado");
      if (!file.type.startsWith("image/")) return fail("Elegí un archivo de imagen válido");
      if (file.size > MAX_PHOTO_BYTES) return fail("La imagen no puede superar los 15 MB");

      const blob = await resizeImage(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) return fail(upErr.message);

      const { data: row, error: insErr } = await supabase
        .from("progress_photos")
        .insert({
          user_id: userId,
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
        return fail(insErr?.message ?? "No se pudo guardar la foto");
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
    } catch {
      const message = "No se pudo procesar o subir la foto";
      setError(message);
      return { error: message };
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }, [supabase, userId]);

  const deletePhoto = useCallback(async (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (!target) return { error: "Foto no encontrada" };

    const { error: delErr } = await supabase
      .from("progress_photos")
      .delete()
      .eq("id", id);
    if (delErr) {
      setError(delErr.message);
      return { error: delErr.message };
    }

    await supabase.storage.from(BUCKET).remove([target.storage_path]);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  }, [supabase, photos]);

  return { photos, loading: authLoading || (!!userId && loading), uploading, error, addPhoto, deletePhoto };
}
