// Stroke icons from the Ghotok design (24×24 viewBox, 2px stroke, round caps),
// stored as data so each front-end can render them with its own React component.
// Each icon is a list of [svgElement, attributes].

export const ICONS = {
  heart: [['path', { d: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z' }]],
  lock: [
    ['rect', { x: 5, y: 11, width: 14, height: 9, rx: 2 }],
    ['path', { d: 'M8 11V8a4 4 0 018 0v3' }],
  ],
  unlock: [
    ['rect', { x: 5, y: 11, width: 14, height: 9, rx: 2 }],
    ['path', { d: 'M8 11V8a4 4 0 017.5-2' }],
  ],
  check: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
  shield: [
    ['path', { d: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z' }],
    ['path', { d: 'M8.5 12l2.5 2.5 4.5-5' }],
  ],
  user: [
    ['circle', { cx: 12, cy: 8, r: 4 }],
    ['path', { d: 'M4 21c1-4 4-6 8-6s7 2 8 6' }],
  ],
  users: [
    ['circle', { cx: 9, cy: 8, r: 3.5 }],
    ['path', { d: 'M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5' }],
    ['path', { d: 'M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.8.7 3 2.4 3.5 5.2' }],
  ],
  menu: [['path', { d: 'M4 8h16M4 16h16' }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  sun: [
    ['circle', { cx: 12, cy: 12, r: 4 }],
    [
      'path',
      {
        d: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
      },
    ],
  ],
  moon: [['path', { d: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z' }]],
  search: [
    ['circle', { cx: 11, cy: 11, r: 7 }],
    ['path', { d: 'M20 20l-3.5-3.5' }],
  ],
  bell: [
    ['path', { d: 'M6 16V11a6 6 0 0112 0v5l1.5 2h-15z' }],
    ['path', { d: 'M10 21h4' }],
  ],
  phone: [
    ['path', { d: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z' }],
  ],
  mail: [
    ['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }],
    ['path', { d: 'M3 7l9 6 9-6' }],
  ],
  home: [['path', { d: 'M4 11l8-7 8 7v9H4z' }]],
  card: [
    ['rect', { x: 3, y: 6, width: 18, height: 13, rx: 2 }],
    ['path', { d: 'M3 10h18M16 15h2' }],
  ],
  inbox: [
    ['path', { d: 'M4 13l2.5-8h11L20 13v6H4z' }],
    ['path', { d: 'M4 13h5l1 2h4l1-2h5' }],
  ],
  settings: [
    ['circle', { cx: 12, cy: 12, r: 3 }],
    [
      'path',
      {
        d: 'M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2l-2.4-.9-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.4-2-1.6A7 7 0 0019 12z',
      },
    ],
  ],
  flag: [['path', { d: 'M5 21V4M5 4h11l-2 4 2 4H5' }]],
  share: [
    ['circle', { cx: 18, cy: 5, r: 2.5 }],
    ['circle', { cx: 6, cy: 12, r: 2.5 }],
    ['circle', { cx: 18, cy: 19, r: 2.5 }],
    ['path', { d: 'M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4' }],
  ],
  eyeOff: [
    [
      'path',
      {
        d: 'M3 3l18 18M10.6 6.1A9.7 9.7 0 0112 6c6 0 9.5 6 9.5 6a17 17 0 01-3.2 3.9M6.1 7.6A17 17 0 002.5 12S6 18 12 18a9.4 9.4 0 004.5-1.1M9.9 9.9a3 3 0 004.2 4.2',
      },
    ],
  ],
  upload: [['path', { d: 'M12 16V4M7 9l5-5 5 5M4 20h16' }]],
  trash: [['path', { d: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3' }]],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  chevronLeft: [['path', { d: 'M15 5l-7 7 7 7' }]],
  chevronRight: [['path', { d: 'M9 5l7 7-7 7' }]],
  arrowRight: [['path', { d: 'M5 12h14M13 6l6 6-6 6' }]],
  filter: [['path', { d: 'M4 6h16M7 12h10M10 18h4' }]],
  ticket: [
    ['path', { d: 'M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4z' }],
    ['path', { d: 'M13 7v10', strokeDasharray: '2 2' }],
  ],
  logout: [['path', { d: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10' }]],
  spark: [['path', { d: 'M12 3q0 9 9 9q-9 0-9 9q0-9-9-9q9 0 9-9z' }]],
  chart: [['path', { d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }]],
  list: [['path', { d: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01' }]],
  file: [
    ['path', { d: 'M14 3H6v18h12V7z' }],
    ['path', { d: 'M14 3v4h4M9 12h6M9 16h6' }],
  ],
  package: [
    ['path', { d: 'M3 7l9-4 9 4v10l-9 4-9-4z' }],
    ['path', { d: 'M3 7l9 4 9-4M12 11v10' }],
  ],
  refresh: [['path', { d: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7' }]],
  history: [
    ['path', { d: 'M3 12a9 9 0 103-6.7L3 8' }],
    ['path', { d: 'M3 3v5h5M12 7v5l3 2' }],
  ],
  id: [
    ['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }],
    ['circle', { cx: 9, cy: 11, r: 2 }],
    ['path', { d: 'M6 16c.5-1.5 1.6-2.2 3-2.2s2.5.7 3 2.2M15 10h3M15 14h3' }],
  ],
};
