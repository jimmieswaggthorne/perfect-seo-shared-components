import { useEffect, useState } from "react"
import { createPost, getSynopsisInfo, saveContentPlanPost } from "@/perfect-seo-shared-components/services/services"
import moment from "moment-timezone"
import { useSelector } from "react-redux";
import { selectEmail } from "@/perfect-seo-shared-components/lib/features/User";
import { ContentType, Outline } from "@/perfect-seo-shared-components/data/types";
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client";
import StatusActionBar from "../StatusActionBar/StatusActionBar"

const OutlineItem = ({ outline, refresh, domain_name }) => {
  const [localOutline, setLocalOutline] = useState<Outline>(outline)
  const supabase = createClient()
  const email = useSelector(selectEmail)


  useEffect(() => {
    if (outline) {
      setLocalOutline(outline)
    }
  }, [outline])

  useEffect(() => {
    if (!outline?.client_name) {
      getSynopsisInfo(domain_name)
        .then(res => {

          if (res.data) {
            setLocalOutline({ ...outline, client_name: res.data[0]?.brand_name })
          }
        })
    }

  }, [outline?.client_name, domain_name])

  useEffect(() => {
    let outlineChannel;
    if (outline?.guid) {

      outlineChannel = supabase.channel(`outline-item-${outline.guid}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'content_plan_outlines', filter: `guid=eq.${outline.guid}` },
          (payload) => {
            setLocalOutline(payload.new as Outline)
          }
        )
        .subscribe()
    }
    return () => {
      if (outlineChannel) {
        outlineChannel.unsubscribe()
      }
    }
  }, [outline?.guid])

  const handleTitleChange = (e, title) => {
    e?.preventDefault()
    let reqObj = { ...outline, outline_details: JSON.parse(outline.outline), post_title: title, guid: outline.guid }
    delete reqObj.outline
    delete reqObj.status
    delete reqObj.brand_name
    delete reqObj.keyword
    reqObj.client_name = outline.brand_name
    return saveContentPlanPost(reqObj)
      .then(res => {
        return res
      })
  }

  return (
    <div className="card p-2" title={outline?.post_title}>
      <div className="row d-flex g-0 d-flex align-items-end">
        <div className="col">
          <div className="row g-0">
            <div className="col-12">
              <strong className="text-primary me-1">Title</strong>  {localOutline?.post_title}
              <div className="d-flex">
                {outline?.keyword && <div className="badge input-group">
                  <span className='badge bg-primary'>keyword</span>
                  <span className="badge text-primary bg-secondary">{localOutline?.keyword}</span></div>}
                {(!domain_name || outline.domain !== domain_name) && <span className='badge bg-light-blue text-dark ms-2'>{localOutline?.domain}</span>}
              </div>
              <div>
                {localOutline?.created_at && <strong className="text-primary me-2">Date</strong>}
                {moment(localOutline.created_at).format("dddd, MMM Do, YYYY h:mma")}{email !== localOutline.email && <span> by <span className="text-primary">by {localOutline.email}</span></span>}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <StatusActionBar content_plan_outline_guid={localOutline?.guid} outline={outline} refresh={refresh} type={ContentType?.OUTLINE} />
        </div>
      </div>
    </div>

  )
}

export default OutlineItem