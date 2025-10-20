import {createContext, useState, useMemo} from 'react';
import {createTheme} from '@mui/material/styles';

// color design tokens
export const tokens = (mode) => ({
    ...(mode === 'dark' 
        ? {
            grey: {
                100: "#e0e0e0",
                200: "#c2c2c2",
                300: "#a3a3a3",
                400: "#858585",
                500: "#666666",
                600: "#525252",
                700: "#3d3d3d",
                800: "#292929",
                900: "#141414",
            },

            black: {
                100: "#d0d1d5",
                200: "#a1a4ab",
                300: "#727681",
                400: "#1F2A40",
                500: "#141b2d",
                600: "#101624",
                700: "#0c101b",
                800: "#080b12",
                900: "#040509",
            },

            green: {
                100: "#e8ecdf",
                200: "#d1d9bf",
                300: "#bbc79f",
                400: "#a4b47f",
                500: "#8da15f",
                600: "#71814c",
                700: "#556139",
                800: "#384026",
                900: "#1c2013"
            },

            blue: {
                100: "#cce6e6",
                200: "#99cccc",
                300: "#66b3b3",
                400: "#339999",
                500: "#008080",
                600: "#006666",
                700: "#004d4d",
                800: "#003333",
                900: "#001a1a"
            }, 
 
            brown: {
                100: "#e1dad6",
                200: "#c4b6ad",
                300: "#a69184",
                400: "#896d5b",
                500: "#6b4832",
                600: "#563a28",
                700: "#402b1e",
                800: "#2b1d14",
                900: "#150e0a"
            },

            red: {
                100: "#ffcccc",
                200: "#ff9999",
                300: "#ff6666",
                400: "#ff3333",
                500: "#ff0000",
                600: "#cc0000",
                700: "#990000",
                800: "#660000",
                900: "#330000"
            },

            orange: {
                100: "#ffedcc",
                200: "#ffdb99",
                300: "#ffc966",
                400: "#ffb733",
                500: "#ffa500",
                600: "#cc8400",
                700: "#996300",
                800: "#664200",
                900: "#332100"
            },

            yellow: {
                100: "#fff7cc",
                200: "#ffef99",
                300: "#ffe766",
                400: "#ffdf33",
                500: "#ffd700",
                600: "#ccac00",
                700: "#998100",
                800: "#665600",
                900: "#332b00"
            },
        } 
        // ----------------------------------------------
        : {
            grey: {
                100: "#141414",
                200: "#292929",
                300: "#3d3d3d",
                400: "#525252",
                500: "#666666",
                600: "#858585",
                700: "#a3a3a3",
                800: "#c2c2c2",
                900: "#e0e0e0",
            },

            black: {
                100: "#040509",
                200: "#080b12",
                300: "#0c101b",
                400: "#f2f0f0", //manually changed
                500: "#141b2d",
                600: "#1F2A40",
                700: "#727681",
                800: "#a1a4ab",
                900: "#d0d1d5",
            },

            green: {
                100: "#1c2013",
                200: "#384026",
                300: "#556139",
                400: "#71814c",
                500: "#8da15f",
                600: "#a4b47f",
                700: "#bbc79f",
                800: "#d1d9bf",
                900: "#e8ecdf",
            }, 

            blue: {
                100: "#001a1a",
                200: "#003333",
                300: "#004d4d",
                400: "#006666",
                500: "#008080",
                600: "#339999",
                700: "#66b3b3",
                800: "#99cccc",
                900: "#cce6e6",
            }, 

            brown: {
                100: "#150e0a",
                200: "#2b1d14",
                300: "#402b1e",
                400: "#563a28",
                500: "#6b4832",
                600: "#896d5b",
                700: "#a69184",
                800: "#c4b6ad",
                900: "#e1dad6",
            }, 

            red: {
                100: "#330000",
                200: "#660000",
                300: "#990000",
                400: "#cc0000",
                500: "#ff0000",
                600: "#ff3333",
                700: "#ff6666",
                800: "#ff9999",
                900: "#ffcccc",
            },

            orange: {
                100: "#332100",
                200: "#664200",
                300: "#996300",
                400: "#cc8400",
                500: "#ffa500",
                600: "#ffb733",
                700: "#ffc966",
                800: "#ffdb99",
                900: "#ffedcc",
            },

            yellow: {
                100: "#332b00",
                200: "#665600",
                300: "#998100",
                400: "#ccac00",
                500: "#ffd700",
                600: "#ffdf33",
                700: "#ffe766",
                800: "#ffef99",
                900: "#fff7cc",
            },
        })
});

// mui theme settings
export const themeSettings = (mode) => {
    const colors = tokens(mode);
    return {
        palette: {
            mode: mode,
            ...(mode === 'dark'
                ? {
                    green: {
                        main: colors.green[300],
                    },
                    blue: {
                        main: colors.blue[300],
                    },
                    brown: {
                        main: colors.brown[300],
                    },
                    grey: {
                        dark: colors.grey[700],
                        main: colors.grey[500],
                        light: colors.grey[300],
                    },
                    background: {
                        default: colors.black[500],
                    },
                    red: {
                        main: colors.red[400],
                    },
                    orange: {
                        main: colors.orange[400],
                    },  
                    yellow: {
                        main: colors.yellow[400],
                    }
                } 
                
                : {
                    green: {
                        main: colors.green[300],
                    },
                    blue: {
                        main: colors.blue[300],
                    },
                    brown: {
                        main: colors.brown[300],
                    },
                    grey: {
                        dark: colors.grey[700],
                        main: colors.grey[500],
                        light: colors.grey[300],
                    },
                    background: {
                        default: "#fcfcfc",
                    },
                    red: {
                        main: colors.red[400],
                    },
                    orange: {
                        main: colors.orange[400],
                    },  
                    yellow: {
                        main: colors.yellow[400],
                    }
                }

            ),
        },
        typography: {
            fontFamily: ["Parkinsans", "sans-serif"].join(","),
            fontSize: 13,
                h1: {
                    fontFamily: ["Parkinsans", "sans-serif"].join(","),
                    fontSize: 40,
                },
                h2: {
                    fontFamily: ["Parkinsans", "sans-serif"].join(","),
                    fontSize: 32,
                },
                h3: {
                    fontFamily: ["Parkinsans", "sans-serif"].join(","),
                    fontSize: 24,
                },
                h4: {
                    fontFamily: ["Parkinsans", "sans-serif"].join(","),
                    fontSize: 20,
                },
                h5: {
                    fontFamily: ["Parkinsans", "sans-serif"].join(","),
                    fontSize: 16,
                },
                h6: {
                    fontFamily: ["Parkinsans", "sans-serif"].join(","),
                    fontSize: 14,
                }
        }
    };
};

//context for color mode
export const ColorModeContext = createContext({
    toggleColorMode: () => {}
});

export const useMode = () => {
    const [mode, setMode] = useState("light");  
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => 
                setMode((prev) => (prev === "light" ? "dark" : "light"))
        }), 
        []
    );

    const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
    return [theme, colorMode];
}