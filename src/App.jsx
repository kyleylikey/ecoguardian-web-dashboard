import './App.css'

import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { theme } from './theme';

// components
import { CollapsedDesktop } from './views/global/CollapsedDesktop.jsx';

function App() {

  return (
    <MantineProvider theme={theme} defaultColorScheme='light'>
      <ModalsProvider>
        <CollapsedDesktop />
      </ModalsProvider>
    </MantineProvider>
  )
}

export default App
