/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.tsx", "./src/**/*.ts"],
  important: true,
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C2C1FF",
          100: "#0F0564",
          200: "#272377",
          300: "#3E3C8F",
          400: "#5655A8",
          500: "#6F6EC3",
          600: "#8988DF",
          700: "#A3A2FC",
          800: "#C2C1FF",
          900: "#E2DFFF",
        },
        secondary: {
          DEFAULT: "#C6C4DD",
          100: "#1A1A2C",
          200: "#2F2F42",
          300: "#464559",
          400: "#5D5C71",
          500: "#76758B",
          600: "#908EA5",
          700: "#ABA9C1",
          800: "#C6C4DD",
          900: "#E3E0F9",
        },
        tertiary: {
          DEFAULT: "#EAB9D2",
          100: "#2F1124",
          200: "#472639",
          300: "#603C50",
          400: "#7A5368",
          500: "#946B81",
          600: "#B0849B",
          700: "#CD9EB6",
          800: "#EAB9D2",
          900: "#FFD8EB",
        },
        error: {
          DEFAULT: "#FFB4AB",
          100: "#410002",
          200: "#690005",
          300: "#93000A",
          400: "#BA1A1A",
          500: "#DE3730",
          600: "#FF5449",
          700: "#FF897D",
          800: "#FFB4AB",
          900: "#FFDAD6",
        },
        neutral: {
          100: "#1C1B1F",
          200: "#313034",
          300: "#47464A",
          400: "#5F5E62",
          500: "#78767A",
          600: "#929094",
          700: "#ADAAAF",
          800: "#C9C5CA",
          900: "#E5E1E6",
        },
        neutralVariant: {
          100: "#1B1B23",
          200: "#302F38",
          300: "#47464F",
          400: "#5F5D67",
          500: "#787680",
          600: "#918F9A",
          700: "#ACAAB4",
          800: "#C8C5D0",
          900: "#E4E1EC",
        },
        onPrimary: "#272377",
        primaryContainer: "#3E3C8F",
        onPrimaryContainer: "#E2DFFF",
        primaryFixed: "#E2DFFF",
        primaryFixedDim: "#C2C1FF",
        onPrimaryFixed: "#0F0564",
        onPrimaryFixedVariant: "#3E3C8F",
        onSecondary: "#2F2F42",
        secondaryContainer: "#464559",
        onSecondaryContainer: "#E3E0F9",
        secondaryFixed: "#E3E0F9",
        secondaryFixedDim: "#C6C4DD",
        onSecondaryFixed: "#1A1A2C",
        onSecondaryFixedVariant: "#464559",
        onTertiary: "#472639",
        tertiaryContainer: "#603C50",
        onTertiaryContainer: "#FFD8EB",
        tertiaryFixed: "#FFD8EB",
        tertiaryFixedDim: "#EAB9D2",
        onTertiaryFixed: "#2F1124",
        onTertiaryFixedVariant: "#603C50",
        onError: "#690005",
        errorContainer: "#93000A",
        onErrorContainer: "#FFDAD6",
        surface: "#131316",
        surfaceDim: "#131316",
        surfaceBright: "#313034",
        surfaceContainerLowest: "#0E0E11",
        surfaceContainerLow: "#1C1B1F",
        surfaceContainer: "#201F23",
        surfaceContainerHigh: "#2A292D",
        surfaceContainerHighest: "#353438",
        onSurface: "#C9C5CA",
        onSurfaceVariant: "#C8C5D0",
        outline: "#918F9A",
        outlineVariant: "#47464F",
        inverseSurface: "#E5E1E6",
        inverseOnSurface: "#1C1B1F",
        inversePrimary: "#5655A8",
        scrim: "#000000",
        shadow: "#000000",

        white: "#FFFFFF",
        black: "#000000",
      },
      backgroundColor: {
        hoverOverlay: "rgba(0, 0, 0, 0.08)",
        focusOverlay: "rgba(0, 0, 0, 0.12)",
        dragOverlay: "rgba(0, 0, 0, 0.16)",
      },
    },
    fontFamily: {
      roboto: ["Roboto", "sans-serif"],
    },
    boxShadow: {
      1: "0px 1px 2px 0px rgba(0, 0, 0, 0.30), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
      2: "0px 1px 2px 0px rgba(0, 0, 0, 0.30), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
      3: "0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
      4: "0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
      5: "0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",
    },
  },
  plugins: [
    ({ addUtilities, theme, e }) => {
      const colors = theme("colors")
      const removeAutofillStylesUtilities = {}

      Object.keys(colors).forEach((colorName) => {
        const colorValue = colors[colorName]
        const className = `.input-bg-${e(colorName)}`

        removeAutofillStylesUtilities[
          `
          ${className}:-webkit-autofill,
          ${className}:-webkit-autofill:hover,
          ${className}:-webkit-autofill:focus,
          ${className}:-webkit-autofill:active`
        ] = {
          "-webkit-box-shadow": `0 0 0 30px ${colorValue} inset`,
          "-webkit-text-fill-color": "#C9C5CA",
          "-webkit-mask-image": "-webkit-radial-gradient(white, black)",
          "-webkit-mask-composite": "destination-out",
        }
      })

      addUtilities(removeAutofillStylesUtilities, ["responsive", "hover"])

      addUtilities(
        {
          ".primaryHoverOverlay": {
            position: "relative",
          },
          ".primaryHoverOverlay:hover::after": {
            content: '""',
            borderRadius: "9999px",
            backgroundColor: "rgba(39, 35, 119, 0.08)",
            position: "absolute",
            top: "0",
            left: "0",
            bottom: "0",
            right: "0",
          },
          ".primaryFocusOverlay": {
            position: "relative",
          },
          ".primaryFocusOverlay:focus::after": {
            content: '""',
            borderRadius: "9999px",
            backgroundColor: "rgba(39, 35, 119, 0.12)",
            position: "absolute",
            top: "0",
            left: "0",
            bottom: "0",
            right: "0",
          },
          ".outlineHoverOverlay": {
            position: "relative",
          },
          ".outlineHoverOverlay:hover::after": {
            content: '""',
            borderRadius: "9999px",
            backgroundColor: "rgba(103, 80, 164, 0.1)",
            position: "absolute",
            top: "0",
            left: "0",
            bottom: "0",
            right: "0",
          },
          ".outlineFocusOverlay": {
            position: "relative",
          },
          ".outlineFocusOverlay:focus::after": {
            content: '""',
            borderRadius: "9999px",
            backgroundColor: "rgba(53, 52, 56, 0.3)",
            position: "absolute",
            top: "0",
            left: "0",
            bottom: "0",
            right: "0",
          },
        },
        ["responsive", "hover", "focus", "active"],
      )
    },
  ],
}
