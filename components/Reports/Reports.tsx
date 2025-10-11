import { useEffect, useMemo, useState } from 'react'
import styles from './Reports.module.scss'
import Table, { TableColumnArrayProps } from '@/perfect-seo-shared-components/components/Table/Table'
import { getAhrefsDomainRating, getAhrefsUrlRating, getGSCLiveURLReport, getGSCSearchAnalytics, getPostsByDomain, populateBulkGSC } from '@/perfect-seo-shared-components/services/services'
import moment from 'moment-timezone'
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText'
import usePaginator from '@/perfect-seo-shared-components/hooks/usePaginator'
import LoadSpinner from '../LoadSpinner/LoadSpinner'
import * as Request from "@/perfect-seo-shared-components/data/requestTypes";
import { useSession } from 'next-auth/react'
export interface PlanListProps {
  domain_name: string;
  url?: string;
  active: boolean;
}
const Reports = ({ domain_name, active }: PlanListProps) => {
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [startDate, setStartDate] = useState(moment().subtract(29, "days").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().subtract(1, "days").format("YYYY-MM-DD"))
  const paginator = usePaginator()

  const [tableData, setTableData] = useState<any[]>([])
  const [urlData, setUrlData] = useState<any[]>(null)
  const [summaryData, setSummaryData] = useState<any>(null)
  const { data: session }: any = useSession()
  useEffect(() => {
    if (session?.token) {
      const token = typeof session?.token === 'string' ? JSON.parse(session.token) : session?.token;
      populateBulkGSC(token)
    }

  }, [active, session?.token])



  const fetchInfo = async () => {
    setLoading(true)
    setUrlData(null)
    let gscReqObj: Request.GSCRequest = {
      domain: domain_name,
      start_date: startDate,
      end_date: endDate,
    }

    // const ahrefsGlobalData = await getAhrefsDomainRating({ ...gscReqObj, domain: domain_name })
    // let rating = ahrefsGlobalData.data?.data?.reduce((acc, obj) => acc + obj?.domain_rating || 0, 0)
    // if (rating > 0) {
    //   rating = (rating / ahrefsGlobalData?.data?.data.length).toFixed(1)
    // }
    // else rating = null
    // Submitted and indexed
    try {
      const postResults = await getPostsByDomain(domain_name, { ...paginator.paginationObj, page: paginator.currentPage, has_live_post_url: true })
      paginator.setItemCount(postResults.count)
      const postData = postResults.data
      setTableData(postData)
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryInfo = async () => {
    setSummaryData(null)
    setSummaryLoading(true)
    getGSCLiveURLReport({
      domain: domain_name,
      start_date: startDate,
      end_date: endDate,
      limit: 1,
    })
      .then(res => {
        setSummaryData(res.data.data)
        setSummaryLoading(false)
      })
      .catch(err => {
        setSummaryLoading(false)
      })


  }

  const retrievePostsGscInfo = async (data) => {
    let newGSCData = await Promise.all(data.map(async (obj, i) => {
      if (i === 0) return obj
      if (obj?.index_status !== 'Submitted and indexed') {
        return obj
      }
      let reqObj = {
        start_date: startDate,
        end_date: endDate,
        page_url: obj.live_post_url,
        keyword: false
      }
      const { data } = await getGSCSearchAnalytics({ ...reqObj, domain: domain_name })
      let newData = {
        ...obj,
        title: obj.title,
        total_clicks: data?.data?.length > 0 ? data.data.reduce((prev, curr) => prev + curr?.total_clicks, 0) : 'N/A',
        total_impressions: data?.data?.length > 0 ? data.data.reduce((prev, curr) => prev + curr?.total_impressions, 0) : 'N/A',
        avg_ctr_percent: data?.data?.length > 0 ? data.data.reduce((prev, curr) => prev + curr?.avg_ctr_percent, 0) : 'N/A',
        avg_position: data?.data?.length > 0 ? data.data.reduce((prev, curr) => prev + curr?.avg_position, 0) : 'N/A',
      }
      // const ahrefsData = await getAhrefsUrlRating(reqObj)
      // let ahref_rating: any = ahrefsData.data?.data?.reduce((acc, obj) => acc + obj?.url_rating || 0, 0)
      // if (ahref_rating > 0) {
      //   ahref_rating = (ahref_rating / ahrefsData?.data?.data.length).toFixed(1)
      // }
      // else {
      //   ahref_rating = null
      // }
      // if (ahref_rating) {
      //   return { ...newData, ahref_rating }
      // }
      // else 
      return newData
    }))
    setUrlData(newGSCData)
  }

  useEffect(() => {
    if (tableData?.length > 1) {
      retrievePostsGscInfo(tableData)
    }
  }, [tableData])


  useEffect(() => {
    let interval;
    if (active) {
      fetchInfo();
      interval = setInterval(fetchInfo, 300000)
    }

    return () => {
      clearInterval(interval);
    }
  }, [domain_name, paginator?.currentPage, paginator?.limit, active])

  useEffect(() => {
    if (active && domain_name) {
      fetchSummaryInfo()
    }
  }, [domain_name, startDate, endDate, active])

  const renderTotalClicks = (obj, i) => {
    if (urlData?.length > 0) {
      let newPost = urlData.find(post => post.title === obj.title)
      let totalClicks = newPost?.total_clicks >= 0 ? newPost?.total_clicks?.toLocaleString() : null

      return totalClicks
    }
    else {
      return null
    }
  }
  const renderTotalImpression = (obj, i) => {
    if (urlData?.length > 0) {
      let newPost = urlData.find(post => post.title === obj.title)
      let totalImpressions = newPost?.total_impressions >= 0 ? newPost?.total_impressions?.toLocaleString() : null

      return totalImpressions

    }
    else {
      return null
    }
  }
  const renderAverageCTR = (obj, i) => {
    if (urlData?.length > 0) {
      let newPost = urlData.find(post => post.title === obj.title)
      let avgCTR = newPost?.avg_ctr_percent >= 0 ? `${newPost?.avg_ctr_percent.toFixed(1)}%` : null

      return avgCTR

    }
    else {
      return <LoadSpinner withBackground={false} />
    }
  }
  const renderAveragePosition = (obj, i) => {
    if (urlData?.length > 0) {
      let newPost = urlData.find(post => post.title === obj.title)
      let totalImpressions = newPost?.avg_position >= 0 ? newPost?.avg_position?.toFixed(3) : null

      return totalImpressions

    }
    else {
      return null
    }
  }

  const renderTitle = (obj) => (
    <div className="d-flex flex-column">
      <p className='mb-0'>{obj.title}</p>
      {obj.live_post_url && <a href={obj.live_post_url} target="_blank" rel="noreferrer" className='text-primary text-wrap title-max mb-0 pb-0'>...{obj.live_post_url.replace("https://", "").replace("www.", "").replace(obj.client_domain, "")}</a>
      }
    </div>
  )

  const formatKeyToTitle = (key) => {
    return key.split("_").map(word => {
      if (['seo', 'url'].includes(word)) {
        return word.toUpperCase()
      } else {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
    }
    ).join(" ")
  }
  const gscColumnArray: TableColumnArrayProps[] = [
    { id: 'title', Header: 'Title', accessor: renderTitle, cellClassName: 'title-max', headerClassName: 'bg-transparent' },
    { id: 'total_clicks', Header: 'Total Clicks', accessor: renderTotalClicks, headerClassName: 'bg-transparent' },
    { id: 'total_impressions', Header: 'Total Impressions', accessor: renderTotalImpression, headerClassName: 'bg-transparent' },
    { id: 'avg_ctr_percent', Header: 'Average CTR', accessor: renderAverageCTR, cellClassName: "relative", headerClassName: 'bg-transparent' },
    { id: 'avg_position', Header: 'Average Position', accessor: renderAveragePosition, headerClassName: 'bg-transparent' },
    // { id: 'ahref_rating', Header: 'AHREFs Rating', accessor: 'ahref_rating', headerClassName: 'bg-transparent text-white' },
  ];

  const summarySections = useMemo(() => {
    let sections = [];
    if (summaryData) {
      sections = Object.keys(summaryData)
    }
    return sections
  }, [summaryData])



  return (
    <div className={styles.wrap}>
      <div className='row g-3 d-flex justify-content-between align-items-end mb-3'>
        <div className='col-12 d-flex justify-content-between align-items-end'>
          <h2>
            <TypeWriterText string="Google Search Console and AHREF Ratings" withBlink />
          </h2>
          <p className='mb-0'>
            <span className="text-primary me-2">Dates</span>
            {moment(startDate).format("M/D/YY")} to {moment(endDate).format("M/D/YY")}</p>
        </div>
      </div>
      <div className='row d-flex justify-content-between align-items-start g-3'>
        {!domain_name &&
          <h5><TypeWriterText withBlink string="Please select a domain to view the reports" /></h5>}
        {summaryData && <div className='col-12 relative'>
          <h4 className="text-primary mb-3">Summary</h4>
          {summaryData ?
            <div className="table-wrap table-responsive card bg-secondary">
              <table className="table table-responsive">
                {summarySections?.length > 0 && summarySections.map((obj, i) => {
                  return (
                    <>
                      <thead key={`summary-section-${i}`}>
                        <tr>
                          <th colSpan={5} className="text-center">{formatKeyToTitle(obj)}
                          </th>
                        </tr>
                        <tr>
                          <th className="bg-transparent">Type</th>
                          <th className="bg-transparent">Clicks</th>
                          <th className="bg-transparent">Impressions</th>
                          <th className="bg-transparent">CTR</th>
                          <th className="bg-transparent">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(summaryData[obj])?.map((data, i) => {
                          let lineData = summaryData[obj][data]
                          return (
                            <tr key={`summary-section-data-${i}`}>
                              <td>{formatKeyToTitle(data)}</td>

                              <td>{lineData?.total_clicks >= 0 ? lineData?.total_clicks?.toLocaleString() : lineData?.clicks_percentage > 0 ? `${lineData.clicks_percentage}%` : null}</td>

                              <td>{lineData?.total_impressions >= 0 ? lineData?.total_impressions?.toLocaleString() : lineData?.impressions_percentage > 0 ? `${lineData?.impressions_percentage}%` : null}</td>

                              <td>{lineData?.avg_ctr_percent >= 0 ? `${lineData?.avg_ctr_percent.toFixed(1)}%` : lineData?.ctr_difference > 0 ? `${lineData?.ctr_difference}%` : null}</td>

                              <td>{lineData?.avg_position >= 0 ? lineData?.avg_position?.toFixed(3) : lineData?.position_difference > 0 ? `${lineData?.position_difference?.toFixed(3)}` : null}</td>
                            </tr>
                          )
                        })
                        }
                      </tbody>
                    </>
                  )
                })}
              </table>
            </div>
            : summaryLoading ? <LoadSpinner /> : <h5><TypeWriterText withBlink string="The are no summary results for the given parameters" /></h5>}
        </div>}
        {tableData.length >= 0 && <div className='col-12 relative'>
          <h4 className="text-primary mb-3">By Post</h4>
          {tableData.length > 0 ?
            <div className="card bg-secondary"><Table rawData={tableData} columnArray={gscColumnArray} className="relative" /></div>
            : loading ? <LoadSpinner /> : <h5><TypeWriterText withBlink string="The are no post results for the given parameters" /></h5>}
        </div>}
        <div className='col-auto d-flex justify-content-center'>
          {paginator.renderComponent()}
        </div>
      </div>
    </div>
  )

}

export default Reports
