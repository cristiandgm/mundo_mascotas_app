export const colors = {
  // Brand Primary (Oro Metálico & Champagne de Mundo Mascotas Luxury)
  primary: {
    DEFAULT: '#D4AF37', // Oro Metálico de Lujo
    light: '#F5D061',   // Champagne Gold brillante
    lighter: '#FEF3C7', // Oro suave
    dark: '#AA7C11',    // Bronce dorado profundo
    glow: 'rgba(212, 175, 55, 0.3)',
  },

  // Brand Secondary (Ámbar cálido / Oro solar)
  accent: {
    DEFAULT: '#F59E0B', // Amber 500
    light: '#FBBF24',   // Amber 400
    lighter: '#FEF3C7', // Amber 100
    dark: '#D97706',    // Amber 600
    glow: 'rgba(245, 158, 11, 0.25)',
  },

  // Dark Palette (Black & Gold Obsidian Luxury)
  dark: {
    bg: '#050508',          // Negro obsidiana puro, profundidad OLED
    card: '#0E1017',        // Tarjeta oscura grafito
    cardElevated: '#161922',// Elementos interactivos elevados
    border: '#242836',      // Borde sutil de alto contraste
    borderFocus: '#D4AF37', // Borde activo en oro brillante
    textPrimary: '#FFFFFF', // Blanco puro
    textSecondary: '#A1A1AA', // Gris zinc claro
    textMuted: '#71717A',    // Gris tenue
  },

  // Light Palette (Modo Claro Elegante)
  light: {
    bg: '#FAFAFA',          // Blanco marfil
    card: '#FFFFFF',        // Blanco puro
    cardElevated: '#F4F4F5',// Gris platino
    border: '#E4E4E7',      // Borde claro
    borderFocus: '#D4AF37',
    textPrimary: '#09090B', // Negro carbón
    textSecondary: '#52525B',
    textMuted: '#A1A1AA',
  },

  // Functional / Feedback
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Gradients
  gradients: {
    primary: ['#F5D061', '#D4AF37'] as const,   // Gradiente Oro Metálico brillante
    accent: ['#F59E0B', '#D97706'] as const,    // Gradiente Ámbar cálido
    goldCard: ['#281E0B', '#0E1017'] as const,  // Fondo de Tarjeta VIP Black & Gold
    darkCard: ['#161922', '#0A0C10'] as const,
    glassBorder: ['rgba(212, 175, 55, 0.35)', 'rgba(255, 255, 255, 0.05)'] as const,
    heroOverlay: ['rgba(5, 5, 8, 0.2)', '#050508'] as const,
  },
};
