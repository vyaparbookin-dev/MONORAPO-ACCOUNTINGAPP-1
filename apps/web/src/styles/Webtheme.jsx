import theme from "./theme";

export const webTheme = {
  ...theme,
  layout: {
    headerHeight: "64px",
    sidebarWidth: "240px",
    contentPadding: "1.5rem",
  },
  components: {
    button: {
      default: {
        background: theme.colors.primary,
        color: "#fff",
        borderRadius: theme.radius.md,
      },
      secondary: {
        background: theme.colors.secondary,
        color: "#000",
      },
    },
    card: {
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadow.sm,
      padding: "1rem",
      background: "#fff",
    },
  },
};