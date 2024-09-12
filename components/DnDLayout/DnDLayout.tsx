"use client"
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { BrowserView, MobileView } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { Links } from '@/perfect-seo-shared-components/data/types';
import Footer from '../Footer/Footer'
import Header from '../Header/Header'
import style from './DnDLayout.module.scss'
import "bootstrap-icons/font/bootstrap-icons.css";
import Script from 'next/script';


interface DnDLayoutProps extends React.HTMLProps<HTMLDivElement> {
  hideFooter?: boolean,
  current: string;
  links?: Links[];
  hasLogin?: boolean;
  getCredits?: boolean;
}

const DnDLayout = ({ children, hideFooter, current, links, hasLogin = true, getCredits = false }: DnDLayoutProps) => {

  return (
    <>
      <BrowserView>
        <DndProvider backend={HTML5Backend} >
          <Header current={current} links={links} hasLogin={hasLogin} getCredits={getCredits} />
          <main className={style.wrap}>
            {children}
          </main>
          {!hideFooter && <Footer current={current} />}
        </DndProvider>
      </BrowserView>
      <MobileView>
        <DndProvider backend={TouchBackend} options={{ ignoreContextMenu: true, enableMouseEvents: true }}>
          <Header current={current} links={links} hasLogin={hasLogin} getCredits={getCredits} />
          <main className={style.wrap}>
            {children}
          </main>
          {!hideFooter && <Footer current={current} />}
        </DndProvider>
      </MobileView>
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossOrigin="anonymous" />

    </>
  )
}

export default DnDLayout