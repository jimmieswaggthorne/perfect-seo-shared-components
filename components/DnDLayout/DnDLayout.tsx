"use client"
// Import necessary modules and components
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { BrowserView, MobileView } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { Links } from '@/perfect-seo-shared-components/data/types';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
import style from '../Layout/Layout.module.scss'
import Script from 'next/script';
import { SessionProvider, useSession } from "next-auth/react";
import { Suspense, useEffect } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import { populateBulkGSC } from '@/perfect-seo-shared-components/services/services';




// Define the props for the DnDLayout component
interface DnDLayoutProps extends React.HTMLProps<HTMLDivElement> {
  hideFooter?: boolean,
  current: string;
  links?: Links[];
  hasLogin?: boolean;
  getCredits?: boolean;
}

// Main DnDLayout component
const DnDLayout = ({ children, hideFooter, current, links, hasLogin = true, getCredits = false }: DnDLayoutProps) => {
  return (
    <>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false} refetchWhenOffline={false}>
        {/* Use BrowserView and MobileView to render different layouts based on the device type */}
        <BrowserView>
          <DndProvider backend={HTML5Backend}>
            <Suspense>
              <Header current={current} links={links} hasLogin={hasLogin} getCredits={getCredits} />
            </Suspense>
            <main className={style.wrap}>
              {children}
            </main>
            {!hideFooter && <Footer current={current} />}
          </DndProvider>
        </BrowserView>
        <MobileView>
          <DndProvider backend={TouchBackend} options={{ ignoreContextMenu: true, enableMouseEvents: true }}>
            <Suspense>
              <Header current={current} links={links} hasLogin={hasLogin} getCredits={getCredits} />
            </Suspense>
            <main className={style.wrap}>
              {children}
            </main>
            {!hideFooter && <Footer current={current} />}
          </DndProvider>
        </MobileView>
      </SessionProvider >
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" crossOrigin="anonymous" />
    </>
  );
}

export default DnDLayout;