import { useDisclosure } from '@mantine/hooks';
import { AppShell, Group, Text, ActionIcon, useMantineColorScheme, useComputedColorScheme, useMantineTheme } from '@mantine/core';

import { Nav }  from './Nav.jsx';

// router
import { Routes, Route } from 'react-router-dom';

// views
import Dashboard from '../dashboard.jsx';
import Alerts from '../alerts.jsx';
import Readings from '../readings.jsx';
import Nodes from '../nodes.jsx';

//icons
import { 
  SunIcon,
  MoonIcon,
  ListIcon,
  ArrowLineLeftIcon
} from "@phosphor-icons/react";

export function CollapsedDesktop() {
  const theme = useMantineTheme();
  const colors = theme.colors;

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <AppShell
      padding={0}
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      styles={{
        main: ({
          paddingLeft: desktopOpened ? 300 : 0,
          paddingRight: 0,
          maxWidth: '100%',
          width: '100%',
          transition: 'padding-left 0.3s',
        }),
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* ✅ Mobile Toggle - Show ListIcon when closed, ArrowLineLeftIcon when open */}
            <ActionIcon
              onClick={toggleMobile}
              variant="subtle"
              size="sm"
              hiddenFrom="sm"
              aria-label="Toggle mobile navigation"
            >
              {mobileOpened ? (
                <ArrowLineLeftIcon size={22} />
              ) : (
                <ListIcon size={22} weight="duotone" />
              )}
            </ActionIcon>

            {/* ✅ Desktop Toggle - Show ListIcon when closed, ArrowLineLeftIcon when open */}
            <ActionIcon
              onClick={toggleDesktop}
              variant="light"
              size="lg"
              visibleFrom="sm"
              aria-label="Toggle desktop navigation"
            >
              {desktopOpened ? (
                <ArrowLineLeftIcon size={22} />
              ) : (
                <ListIcon size={22} />
              )}
            </ActionIcon>

            <Text fw={700} style={{ fontFamily: 'Parkinsans, sans-serif' }}>
              EcoGuardian
            </Text>
          </Group>

          <ActionIcon
            onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
            variant="light"
            color="chocolate-plum"
            size="lg"
            aria-label="Toggle color scheme"
          >
            {computedColorScheme === 'light' ? (
              <MoonIcon 
                size={20} 
                weight='duotone' 
                color={theme.colors['chocolate-plum'][7]} // ✅ Access color from theme
              />
            ) : (
              <SunIcon 
                size={20} 
                weight='duotone' 
                color={theme.colors['chocolate-plum'][7]} // ✅ Optional: add color for sun icon too
              />
            )}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Nav />
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/nodes" element={<Nodes />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}