import { ThemeProvider, CssBaseline } from "@mui/material";
import { useMode, ColorModeContext } from "./theme";
import {Routes, Route} from 'react-router-dom';

import Topbar from './scenes/global/Topbar';
import AppSidebar from './scenes/global/AppSidebar';
import Dashboard from './scenes/dashboard';
import Alerts from './scenes/alerts';
import Readings from './scenes/readings';


function App() {
  const [theme, colorMode] = useMode();


  return ( 
  <ColorModeContext.Provider value={colorMode}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className='app'>
        <AppSidebar />

        <main className='content' sx={{marginLeft: {sm: `240px`}, maxHeight: '100vh', overflow: 'auto'}}>
          <Topbar />
          
          <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path='/readings' element={<Readings />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  </ColorModeContext.Provider>
  );
}

export default App;