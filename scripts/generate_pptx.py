#!/usr/bin/env python3
"""
Script Generator PowerPoint (.pptx) untuk Presentasi CampusFolio (Team 3)
Kebutuhan: pip install python-pptx
Penggunaan: python scripts/generate_pptx.py
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333) # 16:9 Widescreen
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Color Palette
    C_NAVY_BG = RGBColor(9, 13, 22)
    C_CARD_BG = RGBColor(18, 24, 38)
    C_CARD_BORDER = RGBColor(40, 50, 75)
    C_WHITE = RGBColor(255, 255, 255)
    C_BLUE = RGBColor(59, 130, 246)
    C_TEAL = RGBColor(16, 185, 129)
    C_PURPLE = RGBColor(139, 92, 246)
    C_MUTED = RGBColor(148, 163, 184)
    C_LIGHT_BLUE = RGBColor(147, 197, 253)

    def set_slide_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = C_NAVY_BG

    def add_header(slide, category, title, subtitle, slide_num, total=19):
        # Category pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = f"• {category.upper()} •"
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_BLUE

        # Title
        t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(10.5), Inches(0.7))
        tf_t = t_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE

        # Subtitle
        s_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(10.5), Inches(0.4))
        tf_s = s_box.text_frame
        tf_s.word_wrap = True
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle
        p_s.font.size = Pt(12)
        p_s.font.color.rgb = C_MUTED

        # Slide Number
        num_box = slide.shapes.add_textbox(Inches(11.5), Inches(0.5), Inches(1.2), Inches(0.4))
        tf_num = num_box.text_frame
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = f"{slide_num:02d} / {total:02d}"
        p_num.font.size = Pt(12)
        p_num.font.color.rgb = C_MUTED

        # Divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.85), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(30, 41, 59)
        line.line.color.rgb = RGBColor(30, 41, 59)

    def add_card(slide, left, top, width, height, title, items, highlight_color=None):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        shape.fill.solid()
        shape.fill.fore_color.rgb = C_CARD_BG
        shape.line.color.rgb = highlight_color if highlight_color else C_CARD_BORDER
        shape.line.width = Pt(1.5 if highlight_color else 1)

        txBox = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.2), Inches(width - 0.4), Inches(height - 0.4))
        tf = txBox.text_frame
        tf.word_wrap = True

        p0 = tf.paragraphs[0]
        p0.text = title
        p0.font.size = Pt(15)
        p0.font.bold = True
        p0.font.color.rgb = highlight_color if highlight_color else C_WHITE
        p0.space_after = Pt(10)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"•  {item}"
            p.font.size = Pt(11)
            p.font.color.rgb = RGBColor(203, 213, 225)
            p.space_after = Pt(6)

    # ----------------------------------------------------
    # SLIDE 1: COVER
    # ----------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(1.5))
    tf1 = tbox.text_frame
    p = tf1.paragraphs[0]
    p.text = "CampusFolio"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    p2 = tf1.add_paragraph()
    p2.text = "Desain Arsitektur Aplikasi & Alur Pengguna Terintegrasi (Registrasi hingga Logout)"
    p2.font.size = Pt(20)
    p2.font.color.rgb = C_LIGHT_BLUE
    p2.space_before = Pt(10)

    add_card(s1, 1.0, 3.4, 5.5, 3.2, "Tentang Proyek (Team 3)", [
        "Jejaring sosial & portofolio akademik khusus mahasiswa universitas.",
        "Rekomendasi kolaborator cerdas berbasis AI teks (TF-IDF & Cosine Similarity).",
        "Validasi dokumen resmi SKPI, sertifikat, dan artikel ilmiah oleh Kaprodi.",
        "Moderasi konten cerdas berprinsip Human-in-the-Loop."
    ], C_BLUE)

    add_card(s1, 6.8, 3.4, 5.5, 3.2, "Tim Pengembang (Team 3)", [
        "Moh. Rifqi Dwi Ardiansyah (Rifqi) — Hacker (Lead Backend, DB, AI)",
        "Hakim — Hipster (Lead UI/UX, Design System, Mockup Stitch)",
        "Ramadhan (Rama) — Hustler (Product Strategy, AI Evaluation, Pitching)",
        "Antigravity AI (PM Assistant) & Tim — Governance & Sprint Tracking"
    ], C_TEAL)

    # ----------------------------------------------------
    # SLIDE 2: PROBLEM STATEMENT
    # ----------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Problem Space", "Latar Belakang & Problem Statement", "Kesenjangan dalam pembentukan tim proyek mahasiswa di lingkungan universitas.", 2)

    add_card(s2, 0.8, 2.2, 5.7, 4.6, "Problem Statement Resmi", [
        "Mahasiswa yang ingin membentuk tim proyek membutuhkan cara yang lebih mudah untuk menemukan rekan se-universitas dengan skill dan minat yang saling melengkapi.",
        "Keahlian dan portofolio mahasiswa saat ini tersebar di berbagai platform tanpa kurasi terpusat.",
        "Kondisi tersebut menyebabkan tim terbentuk seadanya tanpa komposisi kompetensi yang sesuai dengan kebutuhan riil proyek.",
        "CampusFolio hadir menyediakan profil terpusat, feed foto & teks, serta rekomendasi AI kolaborator dalam ruang kampus yang aman."
    ], RGBColor(245, 158, 11))

    add_card(s2, 6.8, 2.2, 5.7, 4.6, "4 Hambatan Utama Mahasiswa", [
        "Portofolio Tersebar: Karya berada terpisah di GitHub, Behance, Google Drive, tanpa bukti validasi resmi kampus.",
        "LinkedIn Terlalu Luas: Bersifat global industri, tidak memetakan ketersediaan teman satu angkatan atau lintas prodi.",
        "Pencarian Manual Melelahkan: Sulit mendeteksi mahasiswa yang memiliki keahlian saling melengkapi (complementary skills).",
        "Klaim SKPI Masih Manual: Mahasiswa kerepotan mengumpulkan sertifikat dan bukti artikel ilmiah di akhir masa studi."
    ], C_BLUE)

    # ----------------------------------------------------
    # SLIDE 3: SOLUSI 4 PILAR
    # ----------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Product Vision", "Solusi Produk: 4 Pilar Utama CampusFolio", "Kombinasi media sosial kampus, validasi akademik, dan machine learning cerdas.", 3)

    add_card(s3, 0.8, 2.2, 2.75, 4.6, "1. Portofolio & SKPI", [
        "Wadah 4 kategori:",
        "• Proyek Karya",
        "• Bukti SKPI",
        "• Sertifikat Keahlian",
        "• Artikel Ilmiah",
        "Diverifikasi langsung oleh Kaprodi dengan lencana resmi (Verified Badge)."
    ], C_BLUE)

    add_card(s3, 3.8, 2.2, 2.75, 4.6, "2. Rekomendasi AI", [
        "Pencocokan kolaborator:",
        "• TF-IDF Vectorizer",
        "• Cosine Similarity",
        "• Complementary Matching",
        "Menampilkan skor persentase (e.g. 88% Match) & alasan rasional."
    ], C_TEAL)

    add_card(s3, 6.8, 2.2, 2.75, 4.6, "3. Moderasi Human-Loop", [
        "Inspeksi teks cerdas:",
        "• AI Triage otomatis",
        "• Label Aman vs Review",
        "• Pelaporan pengguna",
        "Keputusan takedown tetap di tangan Kaprodi / Admin."
    ], C_PURPLE)

    add_card(s3, 9.8, 2.2, 2.75, 4.6, "4. Home Dashboard", [
        "Pusat aktivitas terpadu:",
        "• Linimasa feed foto+teks",
        "• Widget pertemanan",
        "• Ringkasan poin SKPI",
        "• Kartu rekomendasi partner proyek."
    ], RGBColor(245, 158, 11))

    # ----------------------------------------------------
    # SLIDE 4: ARSITEKTUR & TECH STACK
    # ----------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "System Architecture", "Arsitektur Sistem & Pilihan Teknologi (ADR-0001)", "Pemisahan presentation layer dan async processing layer yang skalabel.", 4)

    add_card(s4, 0.8, 2.2, 3.7, 4.6, "Frontend Layer", [
        "Web: Next.js (React 18/19, TypeScript)",
        "Mobile: React Native Expo (Android & iOS)",
        "Styling: TailwindCSS + Lucide React Icons",
        "State & Fetch: Axios & SWR Client",
        "Pemberian umpan balik visual instan dan tampilan responsif mobile-first."
    ], C_BLUE)

    add_card(s4, 4.8, 2.2, 3.7, 4.6, "Backend & AI Layer", [
        "API Framework: Python FastAPI (Async)",
        "Dokumentasi API: Swagger OpenAPI di /docs",
        "AI-1 Matcher: Scikit-Learn TF-IDF & Cosine Similarity",
        "AI-2 Moderasi: Triage klasifikasi teks kontekstual",
        "Prinsip Graceful Degradation jika modul AI offline."
    ], C_TEAL)

    add_card(s4, 8.8, 2.2, 3.7, 4.6, "Database & Storage", [
        "RDBMS: PostgreSQL via Supabase Cloud",
        "Media: Supabase Storage (Foto feed, PDF sertifikat, avatar)",
        "Keamanan: Enkripsi bcrypt untuk password hash",
        "Otentikasi: JWT Access Token dengan expirasi terkelola.",
        "10 Tabel terhubung dengan Foreign Key berindeks."
    ], C_PURPLE)

    # ----------------------------------------------------
    # SLIDE 5: AKTOR & RBAC
    # ----------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Access Control", "Analisis Aktor & Role-Based Access Control", "Hak akses terbagi proporsional sesuai fungsi akademik dan pengawasan kampus.", 5)

    add_card(s5, 0.8, 2.2, 5.7, 4.6, "Aktor Pengguna & Wewenang", [
        "1. Mahasiswa (Aktor Utama): Mengelola profil & skill, unggah portofolio SKPI/artikel ilmiah, posting foto+teks, tambah teman, blokir akun, laporkan postingan, dan eksplorasi rekomendasi AI.",
        "2. Moderator / Kaprodi: Memvalidasi dokumen portofolio SKPI mahasiswa prodinya, meninjau antrean postingan berstatus review, dan mengeksekusi takedown postingan melanggar.",
        "3. Admin Kemahasiswaan: Kontrol universitas menyeluruh lintas prodi, eskalasi laporan berat, audit sistem, dan manajemen akun.",
        "4. Layanan AI (Sistem): Komputasi kecocokan rekomendasi & pemindaian awal teks postingan."
    ], C_BLUE)

    # Check if use-case image exists
    uc_img = "docs/diagrams/use-case.png"
    if os.path.exists(uc_img):
        s5.shapes.add_picture(uc_img, Inches(6.8), Inches(2.2), width=Inches(5.7))

    # ----------------------------------------------------
    # SLIDE 6: PETA ALUR PENGGUNA (OVERVIEW)
    # ----------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "User Journey Map", "Peta Alur Pengguna: Registrasi hingga Logout", "10 Tahapan komprehensif interaksi mahasiswa di dalam platform CampusFolio.", 6)

    add_card(s6, 0.8, 2.2, 5.7, 4.6, "Fase 1: Onboarding & Eksplorasi", [
        "Tahap 1: Registrasi Akun (Validasi NIM, Email Kampus, Hash Bcrypt).",
        "Tahap 2: Login & Terbitan Sesi JWT (Redirect sesuai Role).",
        "Tahap 3: Onboarding Profil (Avatar, Bio, Kontak, Tagging Skill & Minat).",
        "Tahap 4: Eksplorasi Home Dashboard (Linimasa, Poin SKPI, Widget Teman).",
        "Tahap 5: Manajemen Pertemanan & Privasi (Kirim Teman / Blokir Pengguna)."
    ], C_BLUE)

    add_card(s6, 6.8, 2.2, 5.7, 4.6, "Fase 2: Kolaborasi, Validasi & Selesai", [
        "Tahap 6: Unggah Portofolio (Proyek, Bukti SKPI, Sertifikat, Artikel Ilmiah).",
        "Tahap 7: Verifikasi Kaprodi (Validasi Berkas, Poin SKPI, Verified Badge).",
        "Tahap 8: Posting Feed & Moderasi AI (Fokus Foto+Teks, AI-2 Triage).",
        "Tahap 9: Rekomendasi Kolaborator AI (TF-IDF Matcher 88% Relevan).",
        "Tahap 10: Pelaporan, Takedown & Logout Aman (Session Clearing)."
    ], C_TEAL)

    # Output file
    output_path = "docs/presentation/CampusFolio_Desain_Aplikasi.pptx"
    prs.save(output_path)
    print(f"[OK] Presentasi berhasil dibuat di: {output_path}")

if __name__ == "__main__":
    create_deck()
