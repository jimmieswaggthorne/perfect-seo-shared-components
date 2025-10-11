import { getPlanStatus, getPostStatus } from "@/perfect-seo-shared-components/services/services";
import { useEffect, useState } from "react";
import TypeWriterText from "../TypeWriterText/TypeWriterText";

const ContentStatusItem = ({ item, deleteContent, idx }) => {
  const [status, setStatus] = useState('Processing');
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(false)
  const [loading, setLoading] = useState(false)
  const { guid } = item;
  const pullStatus = () => {
    getPlanStatus(guid).then(res => {
      if (res.data?.status) {
        setStatus(res.data.status)
      } else {
        if (res.data) {
          setError(res.data[0]?.error)
          // if (!retry) {
          // setRetry(true)
          // setTimeout(() => {
          //   pullStatus()
          // }, 10000)
          // }

        }
      }

    })
      .catch(err => {
        console.log(err)
        // if (!retry) {
        //   setRetry(true)
        //   setTimeout(() => {
        //     pullStatus()
        //   }, 10000)
        // }
        setError(err.response.data.message)
      })
  }

  useEffect(() => {
    let interval;
    if (guid && ['Finished', 'GUID Not Found'].includes(status) === false && !error) {
      setRetry(false)
      pullStatus()
      interval = setInterval(() => {
        pullStatus()
      }, 5000)
    }
    return () => clearInterval(interval)

  }, [guid, status, error])

  return (
    <li className="card p-3 bg-secondary">
      <div className="row d-flex align-items-center justify-content-between g-3">
        {error ?
          <div className="text-capitalize text-warning col-10 col-md-8"><TypeWriterText withBlink string={error} /></div>


          :
          <>
            <div className="text-capitalize col-12 col-md-4">
              <span className="d-md-none text-primary me-1"><strong>Keyword</strong></span> {item?.target_keyword}
            </div>
            <div className="capitalize d-none d-lg-block col-4">{item?.domain_name}</div>
            <div className="col-12 col-md-8 col-lg-4 d-flex align-items-center justify-content-between">
              <div className="text-capitalize text-primary"><span className="d-md-none text-white me-1"><strong>Status</strong></span><TypeWriterText withBlink string={status} />
              </div>
            </div>
          </>}
      </div>
    </li >
  )
}

export default ContentStatusItem