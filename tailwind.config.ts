import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "hot-pink": "#FF0077",
        "hot-pink-dark": "#DC1F69",
        "hot-pink-extra-dark": "#B8275B",
        "hot-pink-bg": "#FFE8EE",
        "off-black": "#101720",
        "grey-8": "#2A3447",
        "grey-7": "#526482",
        "grey-6": "#7989A6",
        "grey-5": "#ABB8CF",
        "grey-4": "#CED9EB",
        "grey-3": "#DFE7F5",
        "grey-2": "#EBF1FB",
        "grey-1": "#F7FAFF",
        violet: "#5461C8",
        purple: "#963CBD",
        teal: "#008291",
        "action-green": "#00FF88",
        error: "#DA3441",
        success: "#008851",
        warning: "#F6C26D",
      },
      fontFamily: {
        faktum: ["Faktum", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "15px",
      },
    },
  },
  plugins: [],
};

export default config;
