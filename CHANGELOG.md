# Changelog

All notable changes to the **CampusFolio** project are documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] — 2026-11-12 (Academic Capstone Release)

### Added
- **Core Authentication & RBAC (US-01, M01):**
  - Kampus email domain enforcement (`@campus.ac.id`) & NIM authentication.
  - Mitigated timing attack on password verification with dummy hash evaluation.
  - Minimalist JWT token payload (stateless DB querying for role & prodi changes).
- **Student Profile & Skill Management (US-02, US-03, M02):**
  - Full CRUD for student bio, contact URLs, graduation year, and academic info.
  - Multi-level skill management (`pemula`, `menengah`, `mahir`) and collaborative interests.
- **Student Search & Detail Profile (US-04, US-05, M03):**
  - Multi-filter search (by name, department/prodi, skills) with mutual block exclusion.
  - Public profile view with anti-leak privacy protection (HTTP 404 for blocked viewers).
- **Campus Post Feed & Publishing (US-06, US-07, M05):**
  - Chronological feed with cursor/offset pagination.
  - Post creation with optional image attachment and dual post types (`umum` and `cari_anggota`).
- **Student Networking & Privacy (US-13, US-14, M06):**
  - Bidirectional friendship request workflow (Send, Accept, Reject, Cancel).
  - Mutual blocking system that automatically dissolves friendships and enforces symmetric HTTP 404 across 8 surfaces (*Zero-Leakage Principle*).
- **Portfolio & Official SKPI Verification (US-11, US-12, M07):**
  - Multi-category portfolio uploads (Proyek, Bukti SKPI, Sertifikat Kompetensi, Artikel Ilmiah).
  - FIFO review queue for Kaprodi with prodi isolation and cumulative SKPI point calculation.
- **AI-2: Content Moderation & Triage (US-15, US-16, US-17, M08):**
  - Advanced Heuristic Pipeline with Unicode NFKC normalization, Cyrillic homoglyph restoration, zero-width space strip, and selective leetspeak decoding.
  - User violation reporting system (`reports`) with categories.
  - Department-isolated takedown workflow for Kaprodi and administrative quarantine for Super Admin.
- **AI-1: Intelligent Partner Recommender (US-08, US-09, US-10, M09, M10):**
  - TF-IDF + Cosine Similarity matching engine for project team formation.
  - Transparent rational explanations (*Explainable AI*) and user feedback loop (`POST /recommendations/feedback`).
  - Graceful degradation: automatic keyword fallback on latency timeout (> 3.000 ms).
- **Integrated Home Dashboard (US-18, M11):**
  - Role-based consolidated summary endpoint (`GET /api/v1/dashboard/summary`).
  - Student: SKPI points, portfolio review status, incoming friend requests, mini AI collaborator spotlight.
  - Kaprodi: Prodi-isolated portfolio review queue and feed moderation queue.
  - Admin: University-wide moderation metrics, takedown management, and student stats.
- **Comprehensive Quality Assurance & Finalization (M13):**
  - 166 passing automated backend tests (`pytest`).
  - 64 passing automated web tests (`vitest`).
  - 16 passing automated mobile tests (`vitest`) + strict TypeScript validation (`tsc --noEmit`).
  - Clean production Next.js 14 build (14 static pages generated, 0 SSR/hydration errors).
  - Production Gate Guard in `main.py` rejecting insecure secrets and wildcard CORS.
  - Idempotent demo seeder with relative timestamps (`python seed.py --reset --demo`).

### Changed
- Refactored `07-ai-hypothesis.md` to clearly define the 4 mandatory AI pillars.
- Partitioned moderation evaluation dataset into a 30-sample Dev Set and a 50-sample Held-out Test Set.
- Raised CI mobile runner node version to Node 22 for React Native & Vitest compatibility.
- Hardened database schemas to 13 official tables (`docs/schema.sql`).

### Fixed
- Fixed seeder demo keyword argument mismatch (`pelapor_id` and status `"baru"` on `Report`, and removed `actor_id` on `Notification`).
- Migrated FastAPI startup handler from deprecated `@app.on_event("startup")` to Starlette/FastAPI `lifespan` async context manager.
- Resolved Ruff linter issues across backend and AI evaluation scripts (`F401`, `I001`, `W293`, `E741`, `F841`).
- Enhanced seeder table reset sequence to cleanly drop `portfolio_skills` before `portfolio_items`.

### Excluded (Out of Scope for v1.0.0)
- Likes, comments, and direct message chat are excluded from this release to adhere strictly to the approved 18 User Stories and preserve content moderation boundaries.
