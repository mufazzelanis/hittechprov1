/** @type {import('tailwindcss').Config} */
// Colors are CSS variables (see app/globals.css `:root` / `:root[data-theme="light"]`), written as
// space-separated RGB so Tailwind's opacity modifiers (bg-panel/50, text-mist/60, ...) keep working.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // The header's full desktop menu needs ~1174px of its own content plus breathing room before it
      // can show without wrapping - narrower than that (down to `lg`/`xl`) it wraps or overlaps, and the
      // stock `xl`/`2xl` don't line up with where the mobile bottom tab bar hides, leaving a dead zone
      // with neither nav visible. `nav` is the single, deliberately-chosen breakpoint both use.
      screens: {
        nav: "1300px",
      },
      colors: {
        ink: v("--ink"),
        panel: v("--panel"),
        panel2: v("--panel2"),
        line: v("--line"),
        mist: v("--mist"),
        fg: v("--fg"),
        brand: {
          DEFAULT: v("--brand"),
          dark: v("--brand-dark"),
          light: v("--brand-light"),
        },
        gold: v("--gold"),
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px -15px rgba(232,53,43,0.45)",
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 20% 20%, rgba(232,53,43,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(232,178,59,0.08), transparent 35%)",
      },
    },
  },
  plugins: [],
};
