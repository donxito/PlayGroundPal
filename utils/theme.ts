import { Platform } from "react-native";

// Theme types
export type ThemeMode = "light" | "dark" | "auto";
export type FunColor =
  | "yellow"
  | "orange"
  | "pink"
  | "purple"
  | "teal"
  | "lime";

// Theme configuration
export interface ThemeConfig {
  mode: ThemeMode;
  funColor: FunColor;
  useHaptics: boolean;
  useAnimations: boolean;
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  mode: "auto",
  funColor: "teal",
  useHaptics: true,
  useAnimations: true,
};

// Fun color mappings
export const funColors = {
  yellow: "#fbbf24",
  orange: "#fb923c",
  pink: "#f472b6",
  purple: "#a78bfa",
  teal: "#14b8a6",
  lime: "#84cc16",
};

// Theme utility functions
export class ThemeUtils {
  /**
   * Get the current theme mode based on system preference
   */
  static getSystemThemeMode(): "light" | "dark" {
    // In a real app, this would check the system theme
    // For now, default to light mode
    return "light";
  }

  /**
   * Get the effective theme mode (auto resolves to system preference)
   */
  static getEffectiveThemeMode(config: ThemeConfig): "light" | "dark" {
    if (config.mode === "auto") {
      return this.getSystemThemeMode();
    }
    return config.mode;
  }

  /**
   * Get theme-aware color classes
   */
  static getColorClasses(config: ThemeConfig, isDark: boolean = false) {
    const baseClasses = {
      background: isDark ? "bg-gray-900" : "bg-background",
      surface: isDark ? "bg-gray-800" : "bg-surface",
      text: {
        primary: isDark ? "text-gray-100" : "text-text-primary",
        secondary: isDark ? "text-gray-300" : "text-text-secondary",
        muted: isDark ? "text-gray-400" : "text-text-muted",
      },
      border: isDark ? "border-gray-700" : "border-gray-300",
    };

    return baseClasses;
  }

  /**
   * Get fun color class based on user preference
   */
  static getFunColorClass(color: FunColor): string {
    return `text-fun-${color}`;
  }

  /**
   * Get fun color gradient based on user preference
   */
  static getFunColorGradient(color: FunColor): string {
    const gradients = {
      yellow: "from-fun-yellow to-fun-orange",
      orange: "from-fun-orange to-fun-yellow",
      pink: "from-fun-pink to-fun-purple",
      purple: "from-fun-purple to-fun-pink",
      teal: "from-fun-teal to-fun-lime",
      lime: "from-fun-lime to-fun-teal",
    };
    return gradients[color];
  }

  /**
   * Check if haptics should be used
   */
  static shouldUseHaptics(config: ThemeConfig): boolean {
    return config.useHaptics && Platform.OS !== "web";
  }

  /**
   * Check if animations should be used
   */
  static shouldUseAnimations(config: ThemeConfig): boolean {
    return config.useAnimations;
  }

  /**
   * Get animation class based on theme config
   */
  static getAnimationClass(config: ThemeConfig, animation: string): string {
    if (!this.shouldUseAnimations(config)) {
      return "";
    }
    return animation;
  }
}

// Theme context (for future React Context implementation)
export interface ThemeContextType {
  config: ThemeConfig;
  updateConfig: (updates: Partial<ThemeConfig>) => void;
  isDark: boolean;
  colors: ReturnType<typeof ThemeUtils.getColorClasses>;
}

// Export default theme utilities
export default ThemeUtils;
