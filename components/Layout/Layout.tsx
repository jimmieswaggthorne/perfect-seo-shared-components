import { Links } from '@/perfect-seo-shared-components/data/types';
import Footer from '../Footer/Footer'
import Header from '../Header/Header'
import style from './Layout.module.scss'
import store from '@/perfect-seo-shared-components/store';
import { Provider } from "react-redux";


interface LayoutProps extends React.HTMLProps<HTMLDivElement> {
  hideFooter?: boolean,
  current: string;
  links?: Links[];
}

const Layout = ({ children, hideFooter, current, links }: LayoutProps) => {

  return (
    <>
      <Provider store={store}>
        <Header current={current} links={links} />
        <main className={style.wrap}>
          {children}
        </main>
        {!hideFooter && <Footer current={current} />}
      </Provider>
    </>
  )
}

export default Layout