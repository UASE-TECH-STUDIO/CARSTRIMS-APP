/**
 * Shared color-combo picker for Design Studio (item I) - used across
 * ID Cards, Business Documents, and Marketing Materials so every
 * category offers the same set of presets rather than each defining
 * its own separately.
 *
 * A curated set of paired colors rather than a freeform color wheel,
 * so any combination a dealer picks still looks intentional and
 * professional rather than risking an accidental clash. "accent" is
 * a design's primary/background color; "text" is the secondary
 * color used for contrast text, borders, or highlight details -
 * exactly which role each plays depends on the specific design,
 * same as any two-tone template.
 */
export interface ColorScheme {
  id: string;
  name: string;
  accent: string;
  text: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: "orange",    name: "Orange & Charcoal",  accent: "#F47B20", text: "#1A1A1A" },
  { id: "navy",      name: "Navy & Gold",        accent: "#1E3A5F", text: "#C9A84C" },
  { id: "green",     name: "Forest & Cream",     accent: "#1D5C3A", text: "#F5F0E6" },
  { id: "burgundy",  name: "Burgundy & Cream",   accent: "#7A1F2B", text: "#F5F0E6" },
  { id: "black",     name: "Black & Orange",     accent: "#111111", text: "#F47B20" },
  { id: "teal",      name: "Teal & White",       accent: "#0F6E6E", text: "#FFFFFF" },
  { id: "royal",     name: "Royal Blue & Silver",accent: "#1D3F8C", text: "#D4D4D4" },
  { id: "crimson",   name: "Crimson & Black",    accent: "#B0202E", text: "#1A1A1A" },
  { id: "graphite",  name: "Graphite & Amber",   accent: "#3A3A3A", text: "#F5A623" },
  { id: "plum",      name: "Plum & Rose Gold",   accent: "#4A2545", text: "#D9A9A0" },
  { id: "sapphire",  name: "Sapphire & White",   accent: "#0B4F8A", text: "#FFFFFF" },
  { id: "olive",     name: "Olive & Cream",      accent: "#5B5F37", text: "#F5F0E6" },
];
