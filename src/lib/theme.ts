/**
 * Bingelog Design System Tokens
 * Central designfil för färger, ytor och accenter.
 * Uppdatera här eller i globals.css för att ändra appens visuella profil.
 */

export const THEME = {
  colors: {
    // Grundytor
    ink: '#0F1218',        // Bakgrund, mörk text på ljus yta
    surface: '#171C25',    // Kort, paneler
    surface2: '#1E2531',   // Upphöjda ytor, aktiva flikar, hover
    line: '#2B3443',       // Kantlinjer, osedd/inaktiv stapel

    // Typografi
    text: '#ECE9E3',       // Primär text på mörk bakgrund
    muted: '#8D97A8',      // Sekundär text, metadata

    // Primär accent (Amber & steg i logotypens staplar)
    amber: '#E9A23B',      // Primär accent — knappar, aktiv position, 4:e stapeln
    amberMid: '#B5721E',   // Mellansteg i logotypens stapelövergång, 3:e stapeln
    amberDim: '#7A5A21',   // Dämpad accent — sedda avsnitt, 2:a stapeln

    // Status
    moss: '#6FA98A',       // Bekräftelse, "sedd"-status
  }
} as const;

export type ThemeColors = typeof THEME.colors;
