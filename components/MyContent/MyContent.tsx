'use client'
import en from '@/assets/en.json';
import classNames from 'classnames'
import styles from './MyContent.module.scss'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText'
import { usePathname, useRouter } from 'next/navigation'
import PostsList from '@/perfect-seo-shared-components/components/PostsList/PostsList'
import PlansList from '@/perfect-seo-shared-components/components/PlansList/PlansList'
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux'
import SearchSelect from '@/perfect-seo-shared-components/components/SearchSelect/SearchSelect'
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client'
import { urlSanitization } from '@/perfect-seo-shared-components/utils/conversion-utilities';
import BulkPostComponent from '../BulkPostGenerator/BulkPostComponent';
import CheckGoogleDomains from '../CheckGoogleDomains/CheckGoogleDomains';
import { checkDomainCSSFile, getSynopsisInfo } from '@/perfect-seo-shared-components/services/services';
import BulkContentComponent from '../BulkContentGenerator/BulkContentComponent';
import OutlinesList from '../OutlinesList/OutlinesList';
import BrandHeader from '../BrandHeader/BrandHeader';
import LoadSpinner from '../LoadSpinner/LoadSpinner';
import { selectDomains, selectDomainsInfo, selectEmail, selectIsAdmin, selectIsLoading, selectIsLoggedIn, selectSettings, selectUser, setUserSettings } from '@/perfect-seo-shared-components/lib/features/User'
import Tooltip from '../Tooltip';
import Reports from '../Reports/Reports';
import css from 'styled-jsx/css';


export interface MyContentProps {
  currentDomain?: string;
  hideTitle?: boolean;
}

const MyContent = ({ currentDomain, hideTitle = false }: MyContentProps) => {
  const router = useRouter();
  const pathname = usePathname()
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('tab');
  const domainParam = searchParams.get('domain');


  const settings = useSelector(selectSettings);
  const domainsInfo = useSelector(selectDomainsInfo)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const isAdmin = useSelector(selectIsAdmin)
  const isLoading = useSelector(selectIsLoading)
  const domain_access = useSelector(selectDomains)
  const email = useSelector(selectEmail)

  const [selectedTab, setSelectedTab] = useState('content-plans')
  const [domain, setDomain] = useState(currentDomain || null)
  const [selected, setSelected] = useState(null)
  const [domains, setDomains] = useState([])
  const [reverify, setReverify] = useState(false)
  const [dataTracked, setDataTracked] = useState(false)
  const [synopsis, setSynopsis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let data = null;
    if ((currentDomain || domain) && domainsInfo) {
      let checkDomain = currentDomain || domain
      data = domainsInfo.find(obj => obj?.domain === checkDomain)
      if (data !== null) {
        getSynopsisInfo(checkDomain)
          .then(res => {
            checkDomainCSSFile(checkDomain)
            if (res.data) {
              setSynopsis(res?.data[0])
            }
            else {
              setSynopsis(null)

            }
          })
      }
    }
    else {
      console.log(data)
      setSynopsis(data)
    }

  }, [currentDomain, domainsInfo, domain])

  useEffect(() => {
    if (email && domain && !dataTracked) {
      supabase
        .from('user_history')
        .insert({ email: email, domain: domain, transaction_data: { page: 'my-content', tab: selectedTab || queryParam || 'posts' }, product: en?.product, action: "View Content", type: "VIEW" })
        .select('*')
        .then(res => {
          setDataTracked(true)
        })
    }
  }, [domain, selected, selectedTab, email, dataTracked])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const clickHandler = (e, val) => {
    e.preventDefault()
    let url = `${pathname}?tab=${val}`
    if (domain) {
      url += `&domain=${domain}`
    }
    router.replace(url)
  }

  useEffect(() => {
    if (queryParam) {
      if (['bulk-content', 'bulk-posts'].includes(queryParam) && domainParam) {
        router.replace(`${pathname}?tab=${queryParam}`)
        setSelectedTab(queryParam)
      }
      else {
        setSelectedTab(queryParam)
      }
    }
  }, [queryParam])



  const TabData = useMemo(() => {

    let tabListStart = [{ key: "content-plans", title: "Content Plans" },
    { key: "outlines", title: "Outlines" },
    { key: "posts", title: "Posts" }]
    let bulkTabs = [
      { key: "bulk-content", title: "Bulk Content Plans" },
      { key: "bulk-posts", title: "Bulk Posts" },]

    if (isAdmin && domain) {
      tabListStart = [...tabListStart, { key: "reports", title: "Reports" }]
    }
    return [...tabListStart, ...bulkTabs]
  }, [isAdmin, domain])

  const searchDomainChangeHandler = (e) => {
    if (e) {
      setDomain(e?.value);
      setSelected(e)
      setDataTracked(false)
      router.replace(pathname + '?' + createQueryString("domain", e.value))
    }
    else {
      setDomain(null);
      setSelected(null)
      setSynopsis(null)
      router.replace(pathname)
    }
  };

  const supabase = createClient();

  const fetchDomains = () => {
    supabase
      .from("domains")
      .select("*")
      .eq("blocked", false)
      .eq("hidden", false)
      .order("domain", { ascending: true })
      .then((res) => {
        if (res.data?.length > 0) {
          setDomains(res?.data);
        }

      });
  };

  const checkDomain = (domain) => {
    if (domain) {
      supabase
        .from('domains')
        .select("*")
        .eq('domain', urlSanitization(domain))
        .then(res => {
          if (res.data.length === 0) {
            supabase
              .from('domains')
              .insert([
                { 'domain': urlSanitization(domain) }
              ])
              .select("*")
              .then(res => {
              })
          }
        })
    }
  }

  const domainsList = useMemo(() => {
    let list: any = []
    if (isAdmin) {
      list = [...list, ...domains?.sort((a, b) => a.domain.localeCompare(b.domain)).map(({ domain }) => ({ label: domain, value: domain }))]
    }
    else if (domain_access?.length > 0) {
      list = [...list, ...domain_access.map((domain) => {
        return domain?.siteUrl?.toLowerCase()
      })].sort((a, b) => a?.localeCompare(b)).map((domain) => {
        checkDomain(domain)
        return ({ label: domain, value: domain })
      });
    }
    if (list?.length > 0) {
      if (!isAdmin) {
        setDomain(list[0].value);
        setSelected(list[0]);
      }
      list = list.reduce((acc, current) => {
        if (!acc.find(item => item.value === current.value)) {
          return [...acc, current]
        }
        else {
          return acc
        }
      }, [])
    }
    return list

  }, [domain_access, domains, isAdmin])


  useEffect(() => {
    if (domainsList?.length > 0) {
      if (currentDomain) {
        setDomain(currentDomain)
        setSelected({ label: currentDomain, value: currentDomain })
        return setLoading(false)
      } else if (domainParam) {
        if (domainParam.includes("/")) {
          let newDomainParam = domainParam.replaceAll("/", "");
          setDomain(newDomainParam)
          setSelected({ label: newDomainParam, value: newDomainParam })
          router.replace(pathname + '?' + createQueryString("domain", newDomainParam))
          return setLoading(false)
        }

        else {
          setDomain(domainParam)
          setSelected({ label: domainParam, value: domainParam })
          return setLoading(false)
        }
      }
      else if (settings?.global?.defaultDomain) {
        setDomain(settings.global.defaultDomain)
        setSelected({ label: settings.global.defaultDomain, value: settings.global.defaultDomain })
        return setLoading(false)
      }

      else {
        return setLoading(false)
      }
    }
  }, [currentDomain, settings, domainsList])

  const isAuthorized = useMemo(() => {
    let bool = true;
    if (isLoading) {
      return true
    } else if (isAdmin) {
      return true
    } else if (domain_access?.length > 0 && domain_access.map(({ siteUrl }) => siteUrl).length > 0) {
      if (currentDomain) {
        let domain = currentDomain;
        bool = (domain_access.map(({ siteUrl }) => siteUrl).includes(domain?.toLowerCase()))
      }
      else if (selected?.value) {
        let domain = selected.value
        bool = (domain_access.map(({ siteUrl }) => siteUrl).includes(domain?.toLowerCase()))
      }
      else {
        bool = true
      }


    }
    if (bool === false && email && (currentDomain || selected?.value) && (domainsList || domain_access)) {
      supabase
        .from('user_history')
        .insert({ email: email, domain: currentDomain || selected?.value, transaction_data: { domains: domainsList || domain_access }, product: en.product, action: "Unauthorized My Content", type: "UNAUTHORIZED" })
        .select('*')
        .then(res => {
        })
    }
    return bool
  }, [currentDomain, selected, domainsList, domain_access, isLoading])


  const isDefaultDomain = useMemo(() => {
    let bool = false;
    if (settings?.global?.defaultDomain) {
      console.log(settings?.global?.defaultDomain, selected?.value)
      if (selected?.value === settings?.global?.defaultDomain) {
        bool = true
      }
    }
    return bool
  }, [settings?.global?.defaultDomain, selected])

  const addDefaultHandler = (e?) => {
    e?.preventDefault();
    let global = settings?.global || {}
    supabase
      .from('settings')
      .update({ global: { ...global, defaultDomain: selected?.value } })
      .eq('email', email)
      .select('*')
      .then(res => {
        setUserSettings({ ...settings, global: { ...global, defaultDomain: selected?.value } })
      })

  }
  useEffect(() => {
    if (isAdmin) {
      fetchDomains();
    }
  }, [isAdmin])




  if (isAuthorized === false && isLoading === false) {
    return (
      <div className="container-fluid container-xl strip-padding">
        <div className='row d-flex align-items-center justify-content-center'>
          <h1 className="text-3xl font-bold text-center mb-3"><TypeWriterText string={isLoggedIn ? `You are not authorized to view content for ${currentDomain || selected?.value || 'this domain'}` : 'Log in to view your content'} withBlink /></h1>
          <div className='col-12 col-lg-8 mt-3 d-flex justify-content-center'>
            {reverify ?
              <CheckGoogleDomains />
              :
              <button onClick={() => setReverify(true)} className='btn btn-primary'>Re-verify Domain Access</button>}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading === false && isLoggedIn === false) {
    return (
      <div className="container-fluid container-xl strip-padding d-flex justify-content-center align-items-center">
        <h1><TypeWriterText string="Please login to continue" withBlink /></h1>
      </div>
    )
  }

  return (
    <>
      {hideTitle ? null :
        <div className='container-fluid container-xl'>
          <div className='card p-3 bg-secondary my-3'>
            <div className='row g-3 align-items-center justify-content-between'>
              {(synopsis && ['bulk-content', 'bulk-posts'].includes(selectedTab) === false) ?
                <>
                  <BrandHeader synopsis={synopsis} />
                </> :
                <div className='col'>
                  <h1 className="text-start mb-0 text-primary"><TypeWriterText string={selectedTab.includes("bulk") ? 'Upload for all domains' : selected ? `Content for ${domain}` : 'Your Content'} withBlink /></h1>
                </div>
              }
              {(domainsList?.length > 0 && ['bulk-content', 'bulk-posts'].includes(selectedTab) === false && !currentDomain) &&
                <div className='col-12 d-flex align-items-center'>
                  <div className='bg-primary card p-3'>
                    <div className='row d-flex align-items-end g-2 min-350'>
                      <div className='col'>
                        <div className='formField'>
                          <label className='formField-label text-white'>Select a Domain or clear input for content by email address</label>
                          <SearchSelect
                            onChange={searchDomainChangeHandler}
                            options={domainsList}
                            isLoading={!domainsList}
                            value={selected || null}
                            placeholder="Select a Domain"
                            bottomSpacing={false}
                            className='w-100'
                          />
                        </div>
                      </div>
                      <div className="col-auto mb-2">
                        <Tooltip>
                          Clear search field to see all content by email
                        </Tooltip>
                      </div>
                      {(!isDefaultDomain && selected) && <div className='col-auto'>
                        <a className='text-white' onClick={addDefaultHandler}>Make Default</a>
                      </div>}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
      <div className='container-xl content-fluid rc relative'>
        {/* {isLoading && <LoadSpinner />} */}
        <div className={styles.tabWrap}>
          <ul className="nav nav-tabs mb-0 w-100">
            {TabData.map((tab) => {

              const tabClasses = classNames('nav-link',
                { 'active': tab.key === selectedTab })
              let tabKey = `${tab.key}-tab`
              return (
                <li className="nav-item" key={tabKey}>
                  <button onClick={(e) => clickHandler(e, tab.key)} id={tabKey} data-bs-toggle={tab.key} data-bs-target="#outline" role={tab.key} aria-controls={tab.key} aria-selected={selectedTab === tab.key} className={tabClasses} name={tab.key}>{tab.title}</button>
                </li>
              )
            })}
          </ul>
          <div className="tab-content  mb-3" id="myTabContent">
            <div className={`tab-pane fade ${selectedTab === 'outlines' && 'show active'}`} id="outlines" role="tabpanel" aria-labelledby="outlines-tab">
              <div className='tab p-3'>
                <Suspense fallback={<LoadSpinner />}>
                  <OutlinesList active={!loading && selectedTab === 'outlines'} domain_name={currentDomain || domain} />
                </Suspense>
              </div>
            </div>
            <div className={`tab-pane fade ${selectedTab === 'posts' && 'show active'}`} id="posts" role="tabpanel" aria-labelledby="posts-tab">
              <div className='tab p-3'>
                <Suspense fallback={<LoadSpinner />}>
                  <PostsList active={!loading && selectedTab === 'posts'} domain_name={currentDomain || domain} />
                </Suspense>
              </div>
            </div>
            <div className={`tab-pane fade ${selectedTab === 'content-plans' && 'show active'}`} id="content-plans" role="tabpanel" aria-labelledby="content-plans-tab">
              <div className='tab p-3'>
                <Suspense fallback={<h1>fallback</h1>}>
                  <PlansList active={!loading && selectedTab === 'content-plans'} domain_name={currentDomain || domain} />
                </Suspense>
              </div>
            </div>
            <div className={`tab-pane fade ${selectedTab === 'reports' && 'show active'}`} id="reports" role="tabpanel" aria-labelledby="reports-tab">
              <div className='tab p-3'>
                {/* <Suspense fallback={<LoadSpinner />}> */}
                <Reports active={!loading && selectedTab === 'reports'} domain_name={currentDomain || domain} />
                {/* </Suspense> */}
              </div>
            </div>
            <div className={`tab-pane fade ${selectedTab === 'bulk-content' && 'show active'}`} id="bulk-content" role="tabpanel" aria-labelledby="bulk-content-tab">
              <div className='tab p-3'>
                <Suspense fallback={<LoadSpinner />}>
                  <BulkContentComponent currentDomain={currentDomain} active={!loading && selectedTab === 'bulk-content'} />
                </Suspense>
              </div>
            </div>
            <div className={`tab-pane fade ${selectedTab === 'bulk-posts' && 'show active'}`} id="bulk-posts" role="tabpanel" aria-labelledby="bulk-posts-tab">
              <div className='tab p-3'>
                <Suspense fallback={<LoadSpinner />}>
                  <BulkPostComponent currentDomain={currentDomain} active={!loading && selectedTab === 'bulk-posts'} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="strip-padding container-fluid container-xl d-flex align-items-center justify-content-center">
            <h2 className='text-center text-primary'><TypeWriterText string="No domain selected" withBlink /></h2>
          </div> */}
      </div>
    </>
  )
}

export default MyContent 