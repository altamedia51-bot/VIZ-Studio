/**
 * VIZ Studio - Font Manager & Google Fonts Curator
 */

export interface FontOption {
  name: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  googleFont: boolean;
}

export const POPULAR_GOOGLE_FONTS: FontOption[] = [
  { name: 'Inter', category: 'sans-serif', googleFont: true },
  { name: 'Montserrat', category: 'sans-serif', googleFont: true },
  { name: 'Poppins', category: 'sans-serif', googleFont: true },
  { name: 'Oswald', category: 'sans-serif', googleFont: true },
  { name: 'Bebas Neue', category: 'display', googleFont: true },
  { name: 'Playfair Display', category: 'serif', googleFont: true },
  { name: 'Cinzel', category: 'serif', googleFont: true },
  { name: 'Orbitron', category: 'display', googleFont: true },
  { name: 'Pacifico', category: 'handwriting', googleFont: true },
  { name: 'Lobster', category: 'display', googleFont: true },
  { name: 'Abril Fatface', category: 'display', googleFont: true },
  { name: 'Anton', category: 'sans-serif', googleFont: true },
  { name: 'Fira Code', category: 'monospace', googleFont: true },
  { name: 'Press Start 2P', category: 'display', googleFont: true },
  { name: 'Righteous', category: 'display', googleFont: true },
  { name: 'Russo One', category: 'sans-serif', googleFont: true },
  { name: 'Sacramento', category: 'handwriting', googleFont: true },
  { name: 'Cinzel Decorative', category: 'display', googleFont: true },
  { name: 'Syne', category: 'sans-serif', googleFont: true },
  { name: 'Space Grotesk', category: 'sans-serif', googleFont: true },
  { name: 'Caveat', category: 'handwriting', googleFont: true },
  { name: 'Dancing Script', category: 'handwriting', googleFont: true },
  { name: 'Comfortaa', category: 'display', googleFont: true },
  { name: 'UnifrakturMaguntia', category: 'display', googleFont: true },
  { name: 'Satisfy', category: 'handwriting', googleFont: true },
  { name: 'Permanent Marker', category: 'handwriting', googleFont: true },
  { name: 'Bungee', category: 'display', googleFont: true },
  { name: 'Special Elite', category: 'display', googleFont: true },
];

const loadedFonts = new Set<string>();

export function loadGoogleFont(fontName: string): void {
  if (loadedFonts.has(fontName)) return;

  const fontOption = POPULAR_GOOGLE_FONTS.find((f) => f.name === fontName);
  if (!fontOption || !fontOption.googleFont) return;

  const formattedName = fontName.replace(/ /g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:ital,wght@0,400;0,700;0,900;1,400&display=swap`;
  document.head.appendChild(link);

  loadedFonts.add(fontName);
}

export async function loadCustomFontFile(file: File): Promise<string> {
  const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  const buffer = await file.arrayBuffer();
  const font = new FontFace(fontName, buffer);
  await font.load();
  document.fonts.add(font);
  loadedFonts.add(fontName);
  return fontName;
}
