'use client';

import { createContext, useContext } from 'react';

/** Plain anchor, used when no router link is provided. */
const Anchor = ({ href, ...rest }) => <a href={href} {...rest} />;

const UiContext = createContext({ Link: Anchor });

/**
 * Tells the UI kit how to render internal links: Next.js passes `next/link`, the
 * admin panel passes a react-router adapter. The component receives `href`.
 */
export function UiProvider({ linkComponent = Anchor, children }) {
  return <UiContext.Provider value={{ Link: linkComponent }}>{children}</UiContext.Provider>;
}

export function useUiLink() {
  return useContext(UiContext).Link;
}
