/**
 * Real, confirmed bug this fixes: WhatsApp links across the app were
 * built directly from whatever a user originally typed into a phone
 * field (e.g. "09010000000", the everyday local Nigerian format),
 * with zero normalization before being placed into a wa.me link.
 * WhatsApp's own link format requires the FULL international number
 * with country code and no leading zero (e.g. "2349010000000") - a
 * local-format number produces a wa.me link pointing at a number
 * that either doesn't exist or belongs to someone else, so WhatsApp
 * correctly (from its own perspective) reports "not on WhatsApp" or
 * an invalid link - the number itself was simply never in the format
 * WhatsApp needs, regardless of whether that same number is
 * perfectly correct and dialable as a phone call.
 */

/**
 * Normalizes a Nigerian phone number into the exact digits-only,
 * country-code-prefixed format WhatsApp's wa.me links require.
 * Handles every common way someone might type a Nigerian number:
 *   "09010000000"     (local, leading 0)      -> "2349010000000"
 *   "9010000000"      (local, no leading 0)   -> "2349010000000"
 *   "+234 901 000 0000" (already international, with symbols/spaces)
 *   "234-901-000-0000"
 *   "2349010000000"   (already correct)       -> unchanged
 * Returns null if the result doesn't look like a plausible Nigerian
 * mobile number at all (wrong length after normalization) - callers
 * should treat null as "don't render a WhatsApp link for this."
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Strip everything except digits - handles spaces, dashes,
  // parentheses, a leading "+", or any other formatting a person
  // might have typed.
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("234")) {
    // Already has the country code - leave as-is.
  } else if (digits.startsWith("0")) {
    // Local format with the leading 0 Nigerians normally dial with -
    // drop it and prepend the country code.
    digits = "234" + digits.slice(1);
  } else {
    // No country code and no leading 0 - assume it's a bare local
    // subscriber number (e.g. "9010000000") and prepend the country
    // code directly.
    digits = "234" + digits;
  }

  // A valid Nigerian number in this format is always exactly 13
  // digits: 234 + 10-digit local number. Anything else means the
  // original input wasn't really a usable phone number at all (too
  // short, too long, or garbage), so don't produce a misleading link.
  if (digits.length !== 13) return null;

  return digits;
}

/**
 * Builds a ready-to-use wa.me URL from a raw phone number, or null
 * if the number doesn't normalize to something valid - callers can
 * use this null to skip rendering a WhatsApp button/link entirely
 * rather than showing one that's guaranteed not to work.
 */
export function toWhatsAppLink(raw: string | null | undefined): string | null {
  const normalized = toWhatsAppNumber(raw);
  return normalized ? `https://wa.me/${normalized}` : null;
}

/**
 * Light, real-time formatting hint for phone input fields - not a
 * strict mask, just cleans obviously-wrong characters as the person
 * types (keeps only digits and a single leading "+"), so what ends
 * up stored is at least free of stray letters/symbols before
 * normalization ever runs.
 */
export function cleanPhoneInput(value: string): string {
  const hasPlus = value.trimStart().startsWith("+");
  const digitsOnly = value.replace(/\D/g, "");
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}
