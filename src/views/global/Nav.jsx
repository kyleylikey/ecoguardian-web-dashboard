import { useState } from 'react';
import { SegmentedControl } from '@mantine/core';
import classes from './Nav.module.css';

//icons
import { 
    SquaresFour,
    Warning,
    ListBullets,
    ChartBar,
    CirclesThreeIcon
 } from "@phosphor-icons/react";

// router tabs and links
import { Link } from 'react-router-dom';

const tabs = {
  general: [
    { link: '/dashboard', label: "Ranger's Dashboard", icon: SquaresFour },
    { link: '/alerts', label: 'Alerts', icon: Warning },
    { link: '/readings', label: 'Readings', icon: ListBullets },
    { link: '/nodes', label: 'Sensor Nodes', icon: CirclesThreeIcon },
  ],
//   statistics: [
//     { link: '/statistics', label: 'Bar Chart', icon: ChartBar },
//   ],
};

export function Nav() {
  const [section, setSection] = useState('general');
  const [active, setActive] = useState("Ranger's Dashboard");

  const links = tabs[section].map((item) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.link}
        className={classes.link}
        data-active={item.label === active || undefined}
        key={item.label}
        onClick={() => setActive(item.label)}
      >
        <Icon className={classes.linkIcon} size={20} />
        <span>{item.label}</span>
      </Link>
    );
  });

  return (
    <nav className={classes.navbar}>
      <div>
        {/* <SegmentedControl
          value={section}
          onChange={setSection}
          transitionTimingFunction="ease"
          fullWidth
          data={[
            { label: 'System', value: 'general' },
            { label: 'Statistics', value: 'statistics' },
          ]}
        /> */}
      </div>

      <div className={classes.navbarMain}>
        {links}
      </div>

      {/* <div className={classes.footer}>
      </div> */}
    </nav>
  );
}