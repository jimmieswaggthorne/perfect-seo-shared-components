'use client'
import { Links } from '@/perfect-seo-shared-components/data/types';
import Footer from '../Footer/Footer'
import Header from '../Header/Header'
import style from './Layout.module.scss'
import "bootstrap-icons/font/bootstrap-icons.css";
import Script from 'next/script';
import { SessionProvider } from "next-auth/react"
import { Suspense } from 'react';
interface LayoutProps extends React.HTMLProps<HTMLDivElement> {
  hideFooter?: boolean,
  current: string;
  links?: Links[];
  hasLogin?: boolean;
  getCredits?: boolean;
}

const Layout = ({ children, hideFooter, current, links, hasLogin = true, getCredits = false }: LayoutProps) => {

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" crossOrigin="anonymous" />
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false} refetchWhenOffline={false}>
        <Suspense>
          <Header current={current} links={links} hasLogin={hasLogin} getCredits={getCredits} />
        </Suspense>
        <main className={style.wrap}>
          {children}
        </main>
        {!hideFooter && <Footer current={current} />}
      </SessionProvider >
    </>
  )
}

export default Layout