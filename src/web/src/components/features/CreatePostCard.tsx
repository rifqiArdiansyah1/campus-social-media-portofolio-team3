"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Image as ImageIcon, Users, X, Loader2, Send, Tag, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { SkillSelector, SelectedSkill } from "@/components/features/SkillSelector";

export interface CreatePostCardProps {
  onPostCreated?: (post: any) => void;
}

export function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [isi, setIsi] = useState("");
  const [tipe, setTipe] = useState<"umum" | "cari_anggota">("umum");
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [showSkillSelector, setShowSkillSelector] = useState(false);

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar tidak boleh melebihi 5 MB.");
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }

    // Validate MIME type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Format gambar harus JPEG, PNG, atau WEBP.");
      toast.error("Format gambar tidak didukung.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Immediately upload to backend storage
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post<{ path: string; url: string }>("/uploads/post-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedImagePath(res.data.path);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal mengunggah gambar");
      handleRemoveImage();
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setUploadedImagePath(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedIsi = isi.trim();
    if (!trimmedIsi) {
      setErrorMessage("Tuliskan narasi atau pertanyaan postingan Anda.");
      return;
    }

    if (tipe === "cari_anggota" && selectedSkills.length === 0) {
      setErrorMessage("Postingan rekrutmen tim wajib menyertakan minimal 1 tag keahlian.");
      setShowSkillSelector(true);
      return;
    }

    if (isUploadingImage) {
      toast.warning("Mohon tunggu hingga proses unggah foto selesai.");
      return;
    }

    try {
      setIsSubmitting(true);

      const skill_ids = selectedSkills
        .map((s) => s.skill_id)
        .filter((id): id is number => typeof id === "number");

      const payload = {
        isi: trimmedIsi,
        gambar_url: uploadedImagePath,
        tipe,
        skill_ids,
      };

      const res = await apiClient.post("/posts", payload);
      const newPost = res.data;

      if (newPost.status === "tayang") {
        toast.success("Postingan berhasil dipublikasikan ke linimasa!");
      } else {
        toast.info("Postingan Anda telah disimpan dan sedang ditinjau sebelum tampil ke publik.");
      }

      // Reset form
      setIsi("");
      setTipe("umum");
      setSelectedSkills([]);
      setShowSkillSelector(false);
      handleRemoveImage();

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Gagal membuat postingan";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = isi.trim().length > 0 && !isUploadingImage && !isSubmitting && (tipe !== "cari_anggota" || selectedSkills.length > 0);

  return (
    <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
      {/* Top Author Row & Post Type Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/20">
            {getInitials(user?.nama)}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 font-heading truncate">
              {user?.nama || "Mahasiswa"}
            </p>
            <p className="text-[11px] text-slate-500 font-body">
              {user?.jurusan || "CampusFolio Network"}
            </p>
          </div>
        </div>

        {/* Post Type Selector (Umum vs Cari Anggota) */}
        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTipe("umum")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              tipe === "umum"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Umum
          </button>
          <button
            type="button"
            onClick={() => {
              setTipe("cari_anggota");
              setShowSkillSelector(true);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              tipe === "cari_anggota"
                ? "bg-rose-50 text-rose-700 shadow-sm border border-rose-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-rose-600" />
            <span>Cari Tim</span>
          </button>
        </div>
      </div>

      {/* Caption Textarea */}
      <div>
        <textarea
          rows={3}
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          maxLength={2000}
          placeholder={
            tipe === "cari_anggota"
              ? "Jelaskan proyek lomba/skripsi, kriteria rekan yang dicari, dan batas waktu pendaftaran..."
              : "Bagikan progres riset, dokumentasi proyek, karya inovasi, atau diskusikan ide..."
          }
          className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-slate-50/70 border border-border-subtle rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none font-body"
        />
        <div className="flex justify-end mt-1 text-[10px] text-slate-400 font-mono">
          {isi.length} / 2000
        </div>
      </div>

      {/* Image Preview Dropzone */}
      {imagePreview && (
        <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <Image
            src={imagePreview}
            alt="Pratinjau foto postingan"
            fill
            className="object-cover"
          />
          {isUploadingImage && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-xs gap-2 backdrop-blur-xs">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Mengunggah foto...</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors shadow-sm"
            aria-label="Hapus foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Skill Tagging Section */}
      {(tipe === "cari_anggota" || showSkillSelector) && (
        <div className="p-3.5 rounded-xl bg-slate-50/90 border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Keahlian yang Dibutuhkan {tipe === "cari_anggota" && <span className="text-rose-500">*</span>}</span>
            </span>
            {tipe !== "cari_anggota" && (
              <button
                type="button"
                onClick={() => setShowSkillSelector(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Tutup
              </button>
            )}
          </div>
          <SkillSelector
            value={selectedSkills}
            onChange={setSelectedSkills}
            maxSkills={10}
            allowCreate={false}
          />
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage || Boolean(imagePreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-primary hover:bg-indigo-50/50 transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-primary" />
            <span>Foto</span>
          </button>

          {tipe !== "cari_anggota" && !showSkillSelector && (
            <button
              type="button"
              onClick={() => setShowSkillSelector(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-primary hover:bg-indigo-50/50 transition-colors"
            >
              <Tag className="w-4 h-4 text-slate-400" />
              <span>Tag Skill</span>
            </button>
          )}
        </div>

        {/* Submit Post Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Mengirim...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Publikasikan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
