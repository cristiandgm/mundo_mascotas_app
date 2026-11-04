export const colors = {
  // Brand Primary (Azul Cielo & Cian de Mundo Mascotas)
  primary: {
    DEFAULT: '#0284C7', // Sky 600
    light: '#38BDF8',   // Sky 400
    lighter: '#E0F2FE', // Sky 100
    dark: '#0369A1',    // Sky 700
    glow: 'rgba(2, 132, 199, 0.25)',
  },

  // Brand Secondary (Dorado / Ámbar cálido)
  accent: {
    DEFAULT: '#F59E0B', // Amber 500
    light: '#FBBF24',   // Amber 400
    lighter: '#FEF3C7', // Amber 100
    dark: '#D97706',    // Amber 600
    glow: 'rgba(245, 158, 11, 0.25)',
  },

  // Dark Palette (Modo Oscuro Ultra Moderno)
  dark: {
    bg: '#0B1120',          // Slate casi negro, profundidad OLED
    card: '#131D31',        // Tarjeta oscura elevada
    cardElevated: '#1B263F', // Elementos interactivos
    border: '#1E293B',      // Borde sutil
    borderFocus: '#0284C7', // Borde activo
    textPrimary: '#F8FAFC', // Blanco hielo
    textSecondary: '#94A3B8', // Gris perla
    textMuted: '#64748B',    // Gris tenue
  },

  // Light Palette (Modo Claro Fresco)
  light: {
    bg: '#F8FAFC',          // Blanco perla frío
    card: '#FFFFFF',        // Blanco puro
    cardElevated: '#F1F5F9',// Gris suave
    border: '#E2E8F0',      // Borde sutil claro
    borderFocus: '#0284C7',
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },

  // Functional / Feedback
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Gradients
  gradients: {
    primary: ['#0284C7', '#06B6D4'] as const,
    accent: ['#F59E0B', '#EA580C'] as const,
    darkCard: ['#162035', '#0F172A'] as const,
    glassBorder: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.03)'] as const,
    heroOverlay: ['rgba(11, 17, 32, 0.2)', '#0B1120'] as const,
  },
};

