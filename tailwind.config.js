/** @type {import('tailwindcss').Config} */

function customSpacing() {
    const maxSpace = 384;
    const spaces = {};

    for (let i = 2; i <= maxSpace; ) {
        const value = i + "px";
        spaces[value] = value;
        i = i + 2;
    }

    return spaces;
}

module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            screens: {
                desktop: { max: "1050px" },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            boxShadow: {
                "focus--primary": "0px 0px 0px 4px #EDF2F7",
                "focus--success": "0px 0px 0px 4px #F6FEF9",
                "focus--warning": "0px 0px 0px 4px #FFFCF5",
                "focus--error": "0px 0px 0px 4px #FFFBFA",
                "sm": "0px 3px 8px -1px rgba(50, 50, 71, 0.05)",
            },
            spacing: customSpacing(),
            borderRadius: {
                "4px": "4px",
                "8px": "8px",
                "12px": "12px",
                "16px": "16px",
                "20px": "20px",
                "24px": "24px",
                "100px": "100px",
            },
            fontSize: {
                10: ["10px", "150%"],
                12: ["12px", "20px"],
                14: ["14px", "22px"],
                16: ["16px", "24px"],
                18: ["18px", "30px"],
                20: ["20px", "30px"],
                24: ["24px", "35px"],
                h1: ["20px", "140%"],
                h2: ["18px", "140%"],
                h3: ["16px", "140%"],
                h4: ["14px", "140%"],
            },
            colors: {
                gray: {
                    25: "#FCFCFD",
                    50: "#F9FAFB",
                    100: "#F2F4F7",
                    200: "#E4E7EC",
                    300: "#D0D5DD",
                    400: "#98A2B3",
                    500: "#667085",
                    600: "#475467",
                    700: "#344054",
                    800: "#1D2939",
                    900: "#101828",
                },
                primary: {
                    25: "#EDF2F7",
                    50: "#DAE5F0",
                    100: "#B5CBE1",
                    200: "#91B1D1",
                    300: "#6699CC",
                    400: "#477DB3",
                    500: "#2E6399",
                    600: "#194D80",
                    700: "#0A3866",
                    800: "#00264D",
                    900: "#001A33",
                },
                success: {
                    25: "#F6FEF9",
                    50: "#ECFDF3",
                    100: "#D1FADF",
                    200: "#A6F4C5",
                    300: "#6CE9A6",
                    400: "#32D583",
                    500: "#12B76A",
                    600: "#039855",
                    700: "#027A48",
                    800: "#05603A",
                    900: "#054F31",
                },
                danger: {
                    25: "#FFFBFA",
                    50: "#FEF3F2",
                    100: "#FEE4E2",
                    200: "#FECDCA",
                    300: "#FDA29B",
                    400: "#F97066",
                    500: "#F04438",
                    600: "#D92D20",
                    700: "#B42318",
                    800: "#912018",
                    900: "#7A271A",
                },
                warning: {
                    25: "#FFFCF5",
                    50: "#FFFAEB",
                    100: "#FEF0C7",
                    200: "#FEDF89",
                    300: "#FEC84B",
                    400: "#FDB022",
                    500: "#F79009",
                    600: "#DC6803",
                    700: "#B54708",
                    800: "#93370D",
                    900: "#7A2E0E",
                },
                white: {
                    100: "rgba(255, 255, 255, 1)",
                    64: "rgba(255, 255, 255, 0.64)",
                    40: "rgba(255, 255, 255, 0.40)",
                    24: "rgba(255, 255, 255, 0.24)",
                    16: "rgba(255, 255, 255, 0.16)",
                    8: "rgba(255, 255, 255, 0.08)",
                    4: "rgba(255, 255, 255, 0.04)",
                },
                secondary: "#32587D",
                purple: "#5A53B3",
                "dark-green": "#327D63",
                "light-green": "#47B38D",
                black: "#16192C",
                "dark-grey": "#B2B2B2",
                transparent: "transparent",
            },
            animation: {
                "spin-slow": "spin 3s linear infinite",
            },
        },
    },
    plugins: [],
};
