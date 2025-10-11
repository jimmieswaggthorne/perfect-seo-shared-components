'use client'
import { getAhrefsUrlRating, getGSCSearchAnalytics } from "@/perfect-seo-shared-components/services/services"
import { useEffect, useMemo, useState } from "react"
import LoadSpinner from "../LoadSpinner/LoadSpinner";

const ReportLine = ({ post, startDate, endDate, domain_name }) => {
  const [loading, setLoading] = useState(false)
  const [gscData, setGscData] = useState<any[]>([])
  const [ahrefsRating, setAhrefsRating] = useState<number>(0)
  const [ahrefLoading, setAhrefLoading] = useState<boolean>(false)

  const gscTotals = useMemo(() => {
    return gscData.reduce((acc, obj) => {
      acc.clicks += obj.total_clicks
      acc.impressions += obj.total_impressions
      acc.keywords += 1
      acc.ctr += obj.avg_ctr
      acc.position += obj.avg_position
      return acc
    }, { clicks: 0, impressions: 0, keywords: 0, ctr: 0, position: 0 })

  }, [gscData])

  const fetchGSC = () => {
    setLoading(true)
    let reqObj = {
      start_date: startDate,
      end_date: endDate,
      page_url: post.live_post_url,
      keyword: true
    }
    getGSCSearchAnalytics({ ...reqObj, domain: domain_name })
      .then((res) => {
        setGscData(res.data.data)
        setLoading(false)
      })
  }

  const fetchAhrefs = () => {
    setAhrefLoading(true)
    let reqObj = {
      start_date: startDate,
      end_date: endDate,
      page_url: post.live_post_url,
    }
    getAhrefsUrlRating(reqObj)
      .then((res) => {
        console.log(res.data)
        let ahref_rating: any = res.data?.data?.reduce((acc, obj) => acc + obj?.url_rating, 0) / res.data?.data.length
        setAhrefsRating(ahref_rating)
        setAhrefLoading(false)
      })

  }

  useEffect(() => {
    fetchGSC();
    fetchAhrefs();
  }, [startDate, endDate, post.live_post_url])

  return (
    <div className="card p-3">
      <div className="d-flex row align-items-center">
        <div className="col-12">
          {post.title}
        </div>
        <div className="col-8 relative">
          {loading ?
            <div className="w-100">
              <LoadSpinner />
            </div> :
            <>
              <div className="d-flex justify-content-between">

                <div className="col-3">
                  {gscTotals?.clicks > 0 &&
                    <>
                      <span className="me-2 text-primary">Clicks</span>
                      <span>{gscTotals?.clicks?.toLocaleString()}</span>
                    </>}
                </div>
                <div className="col-3">
                  {gscTotals?.impressions > 0 &&
                    <>
                      <span className="me-2 text-primary">Impressions</span>
                      <span>{gscTotals?.impressions?.toLocaleString()}</span>
                    </>}
                </div>
                <div className="col-3">

                  {gscTotals?.avg_ctr > 0 &&
                    <>
                      <span className="me-2 text-primary">CTR</span>
                      <span>{(gscTotals?.avg_ctr * 100).toFixed(1)}%</span>
                    </>
                  }
                </div>
                <div className="col-3">
                  {gscTotals?.position > 0 &&
                    <>
                      <span className="me-2 text-primary">Position</span>
                      <span>{gscTotals?.position?.toFixed(3)}</span>
                    </>}
                </div>
              </div>
            </>}
        </div>
        <div className="col-4">
          {ahrefLoading ?
            <div className="w-100"><LoadSpinner />
            </div> :
            <>
              <span className="me-2 text-primary">AHREFs Rating</span>
              <span>{ahrefsRating}</span>
            </>}
        </div>
      </div>
    </div>
  );
};
export default ReportLine