import { useEffect, useState } from "react";
import TypeWriterText from "../TypeWriterText/TypeWriterText";

const PostStatusItem = ({ guid, item, deletePost, idx, loading }) => {
  const [status, setStatus] = useState();
  const [error, setError] = useState(null)


  useEffect(() => {
    if (item?.status) {
      setStatus(item?.status)
    }
  }, [item?.status])


  return (
    <li key={guid} className="card p-3 bg-secondary">
      <div className="row d-flex align-items-center justify-content-between g-3">
        <div className="text-capitalize col-12 col-md-6 col-lg-4
        "><span className="d-md-none text-primary me-1"><strong>Title</strong></span> {item?.title}</div>
        <div className="capitalize d-none d-lg-block col-4">{item?.client_domain}</div>
        <div className="col-12 col-md-6 col-lg-4 d-flex align-items-center justify-content-between justify-content-end">
          <div className="text-capitalize text-primary text-end"><span className="d-md-none text-primary me-1"><strong>Status</strong></span><TypeWriterText withBlink string={status} /></div>
        </div>

      </div>
    </li>
  )
}

export default PostStatusItem