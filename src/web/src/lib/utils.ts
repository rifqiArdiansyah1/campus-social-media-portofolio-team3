/**
 * Utility helper functions for campusfolio-web
 */

/**
 * Extracts up to 2 uppercase initials from a person's name
 * e.g., "Moh. Rifqi Dwi Ardiansyah" -> "MR", "Dewi Sartika" -> "DS", "Rizky" -> "R"
 */
export function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}
