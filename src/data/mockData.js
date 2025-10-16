import { tokens } from "../theme";

export const mockDataAlerts = [
  // Recent Active Alerts (Sep 30, 2025)
  {
    id: 1,
    type: "Wildfire Risk",
    node: "Node 1",
    timestamp: "2025-09-30 16:55:00",
    severity: "Moderate",
    res_ack_timestamp: "",
    status: "Active",
  },
  {
    id: 2,
    type: "Illegal Logging",
    node: "Node 2",
    timestamp: "2025-09-30 16:45:00",
    res_ack_timestamp: "",
    status: "Active",
  },
  {
    id: 3,
    type: "Poaching",
    node: "Node 3",
    timestamp: "2025-09-30 16:35:00",
    res_ack_timestamp: "",
    status: "Active",
  },
  {
    id: 4,
    type: "Wildfire Risk",
    node: "Node 1",
    timestamp: "2025-09-30 16:25:00",
    severity: "High",
    res_ack_timestamp: "",
    status: "Active",
  },
  {
    id: 5,
    type: "Illegal Logging",
    node: "Node 2",
    timestamp: "2025-09-30 16:15:00",
    res_ack_timestamp: "",
    status: "Active",
  },
  {
    id: 6,
    type: "Poaching",
    node: "Node 3",
    timestamp: "2025-09-30 16:05:00",
    res_ack_timestamp: "",
    status: "Active",
  },

  // Resolved Alerts (yesterday, Sep 29, 2025)
  {
    id: 7,
    type: "Wildfire Risk",
    node: "Node 1",
    timestamp: "2025-09-29 14:10:00",
    severity: "Low",
    res_ack_timestamp: "2025-09-29 14:20:00",
    status: "Resolved",
  },
  {
    id: 8,
    type: "Illegal Logging",
    node: "Node 2",
    timestamp: "2025-09-29 13:55:00",
    res_ack_timestamp: "2025-09-29 14:05:00",
    status: "Resolved",
  },
  {
    id: 9,
    type: "Poaching",
    node: "Node 3",
    timestamp: "2025-09-29 13:40:00",
    res_ack_timestamp: "2025-09-29 13:50:00",
    status: "Resolved",
  },
  {
    id: 10,
    type: "Wildfire Risk",
    node: "Node 1",
    timestamp: "2025-09-29 13:25:00",
    severity: "Low",
    res_ack_timestamp: "2025-09-29 13:35:00",
    status: "Resolved",
  },
  {
    id: 11,
    type: "Illegal Logging",
    node: "Node 2",
    timestamp: "2025-09-29 13:10:00",
    res_ack_timestamp: "2025-09-29 13:20:00",
    status: "Resolved",
  },
  {
    id: 12,
    type: "Poaching",
    node: "Node 3",
    timestamp: "2025-09-29 12:55:00",
    res_ack_timestamp: "2025-09-29 13:05:00",
    status: "Resolved",
  },
  {
    id: 13,
    type: "Wildfire Risk",
    node: "Node 1",
    timestamp: "2025-09-29 12:40:00",
    severity: "Low",
    res_ack_timestamp: "2025-09-29 12:50:00",
    status: "Resolved",
  },
  {
    id: 14,
    type: "Illegal Logging",
    node: "Node 2",
    timestamp: "2025-09-29 12:25:00",
    res_ack_timestamp: "2025-09-29 12:35:00",
    status: "Resolved",
  },
  {
    id: 15,
    type: "Poaching",
    node: "Node 3",
    timestamp: "2025-09-29 12:10:00",
    res_ack_timestamp: "2025-09-29 12:20:00",
    status: "Resolved",
  },
];

export const mockDataReadings = [
  { id: 1, timestamp: "2025-09-30T16:03:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 2, timestamp: "2025-09-30T16:05:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 3, timestamp: "2025-09-30T16:07:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 4, timestamp: "2025-09-30T16:09:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 5, timestamp: "2025-09-30T16:11:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 6, timestamp: "2025-09-30T16:13:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 7, timestamp: "2025-09-30T16:15:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 8, timestamp: "2025-09-30T16:17:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 9, timestamp: "2025-09-30T16:19:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 10, timestamp: "2025-09-30T16:21:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 11, timestamp: "2025-09-30T16:23:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 12, timestamp: "2025-09-30T16:25:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 13, timestamp: "2025-09-30T16:27:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 14, timestamp: "2025-09-30T16:29:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 15, timestamp: "2025-09-30T16:31:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 16, timestamp: "2025-09-30T16:33:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 17, timestamp: "2025-09-30T16:35:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 18, timestamp: "2025-09-30T16:37:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 19, timestamp: "2025-09-30T16:39:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 20, timestamp: "2025-09-30T16:41:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 21, timestamp: "2025-09-30T16:43:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 22, timestamp: "2025-09-30T16:45:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 23, timestamp: "2025-09-30T16:47:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 24, timestamp: "2025-09-30T16:49:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 25, timestamp: "2025-09-30T16:51:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 },
  { id: 26, timestamp: "2025-09-30T16:53:00", node: "Node 2", temp: 29, humidity: 86, co_lvl: 4 },
  { id: 27, timestamp: "2025-09-30T16:55:00", node: "Node 3", temp: 41, humidity: 26, co_lvl: 18 },
  { id: 28, timestamp: "2025-09-30T16:55:00", node: "Node 1", temp: 33, humidity: 64, co_lvl: 6 }, // Last reading at 4:55 PM
];

export const mockDataNodes = [
  {
    id: 1,
    name: "Node 1",
    status: "Active",
  },
  {
    id: 2,
    name: "Node 2",
    status: "Inactive",
  },
  {
    id: 3,
    name: "Node 3",
    status: "Active",
  },
  {
    id: 4,
    name: "Node 4",
    status: "Active",
  },
  {
    id: 5,
    name: "Node 5",
    status: "Inactive",
  },
];

export const mockBarData = [
  {
    country: "AD",
    "hot dog": 137,
    "hot dogColor": "hsl(229, 70%, 50%)",
    burger: 96,
    burgerColor: "hsl(296, 70%, 50%)",
    kebab: 72,
    kebabColor: "hsl(97, 70%, 50%)",
    donut: 140,
    donutColor: "hsl(340, 70%, 50%)",
  },
  {
    country: "AE",
    "hot dog": 55,
    "hot dogColor": "hsl(307, 70%, 50%)",
    burger: 28,
    burgerColor: "hsl(111, 70%, 50%)",
    kebab: 58,
    kebabColor: "hsl(273, 70%, 50%)",
    donut: 29,
    donutColor: "hsl(275, 70%, 50%)",
  },
  {
    country: "AF",
    "hot dog": 109,
    "hot dogColor": "hsl(72, 70%, 50%)",
    burger: 23,
    burgerColor: "hsl(96, 70%, 50%)",
    kebab: 34,
    kebabColor: "hsl(106, 70%, 50%)",
    donut: 152,
    donutColor: "hsl(256, 70%, 50%)",
  },
  {
    country: "AG",
    "hot dog": 133,
    "hot dogColor": "hsl(257, 70%, 50%)",
    burger: 52,
    burgerColor: "hsl(326, 70%, 50%)",
    kebab: 43,
    kebabColor: "hsl(110, 70%, 50%)",
    donut: 83,
    donutColor: "hsl(9, 70%, 50%)",
  },
  {
    country: "AI",
    "hot dog": 81,
    "hot dogColor": "hsl(190, 70%, 50%)",
    burger: 80,
    burgerColor: "hsl(325, 70%, 50%)",
    kebab: 112,
    kebabColor: "hsl(54, 70%, 50%)",
    donut: 35,
    donutColor: "hsl(285, 70%, 50%)",
  },
  {
    country: "AL",
    "hot dog": 66,
    "hot dogColor": "hsl(208, 70%, 50%)",
    burger: 111,
    burgerColor: "hsl(334, 70%, 50%)",
    kebab: 167,
    kebabColor: "hsl(182, 70%, 50%)",
    donut: 18,
    donutColor: "hsl(76, 70%, 50%)",
  },
  {
    country: "AM",
    "hot dog": 80,
    "hot dogColor": "hsl(87, 70%, 50%)",
    burger: 47,
    burgerColor: "hsl(141, 70%, 50%)",
    kebab: 158,
    kebabColor: "hsl(224, 70%, 50%)",
    donut: 49,
    donutColor: "hsl(274, 70%, 50%)",
  },
];

export const mockLineData = [
  {
    id: "japan",
    color: tokens("dark").green[500],
    data: [
      {
        x: "plane",
        y: 101,
      },
      {
        x: "helicopter",
        y: 75,
      },
      {
        x: "boat",
        y: 36,
      },
      {
        x: "train",
        y: 216,
      },
      {
        x: "subway",
        y: 35,
      },
      {
        x: "bus",
        y: 236,
      },
      {
        x: "car",
        y: 88,
      },
      {
        x: "moto",
        y: 232,
      },
      {
        x: "bicycle",
        y: 281,
      },
      {
        x: "horse",
        y: 1,
      },
      {
        x: "skateboard",
        y: 35,
      },
      {
        x: "others",
        y: 14,
      },
    ],
  },
  {
    id: "france",
    color: tokens("dark").blue[300],
    data: [
      {
        x: "plane",
        y: 212,
      },
      {
        x: "helicopter",
        y: 190,
      },
      {
        x: "boat",
        y: 270,
      },
      {
        x: "train",
        y: 9,
      },
      {
        x: "subway",
        y: 75,
      },
      {
        x: "bus",
        y: 175,
      },
      {
        x: "car",
        y: 33,
      },
      {
        x: "moto",
        y: 189,
      },
      {
        x: "bicycle",
        y: 97,
      },
      {
        x: "horse",
        y: 87,
      },
      {
        x: "skateboard",
        y: 299,
      },
      {
        x: "others",
        y: 251,
      },
    ],
  },
  {
    id: "us",
    color: tokens("dark").red[200],
    data: [
      {
        x: "plane",
        y: 191,
      },
      {
        x: "helicopter",
        y: 136,
      },
      {
        x: "boat",
        y: 91,
      },
      {
        x: "train",
        y: 190,
      },
      {
        x: "subway",
        y: 211,
      },
      {
        x: "bus",
        y: 152,
      },
      {
        x: "car",
        y: 189,
      },
      {
        x: "moto",
        y: 152,
      },
      {
        x: "bicycle",
        y: 8,
      },
      {
        x: "horse",
        y: 197,
      },
      {
        x: "skateboard",
        y: 107,
      },
      {
        x: "others",
        y: 170,
      },
    ],
  },
];