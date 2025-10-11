'use client'

import { useEffect, useState } from "react";
import TypeWriterText from "../TypeWriterText/TypeWriterText";
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client";
import Link from "next/link";


const ContentPlanStatusCell = ({ plan, setDeleteModal, setDuplicateInfo, setNewModal }) => {

  const completeStatuses = ["Finished", "Your Content Plan Has Been Created"]
  const [status, setStatus] = useState(plan.status)
  const { guid } = plan
  const supabase = createClient()
  const deleteClickHandler = (e) => {
    e.preventDefault();
    setDeleteModal(guid)
  }

  const duplicateClickHandler = (obj) => {

    let newData = {
      email: obj.email,
      brandName: obj.brand_name,
      domainName: obj.domain_name,
      targetKeyword: obj.keyword,
      entityVoice: obj?.entity_voice,
      priorityCode: obj?.priority_code,
      writing_language: obj?.writing_language,
      url1: obj?.inspiration_url_1,
      url2: obj?.inspiration_url_2,
      url3: obj?.inspiration_url_3,
      priority1: obj?.inspirational_url_1_priority,
      priority2: obj?.inspirational_url_2_priority,
      priority3: obj?.inspirational_url_3_priority
    }

    setDuplicateInfo(newData)
    setNewModal(true)
  }

  const fetchContentPlanStatus = () => {
    supabase
      .from('content_plan_statuses')
      .select('status')
      .eq('plan_guid', guid)
      .order('timestamp', { ascending: false })
      .then(res => {
        if (res.data) {
          setStatus(res.data[0]?.status)
        }
        else {
          setStatus('')
        }
      })
  }

  useEffect(() => {
    let planStatusChannel;
    if (guid) {
      fetchContentPlanStatus()
      planStatusChannel = supabase.channel(`plan-status-${guid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'content_plan_statuses', filter: `plan_guid=eq.${guid}` },
          (payload) => {
            setStatus(payload.new.status)
          }
        )
        .subscribe()
    }
    if (planStatusChannel) {
      return () => {
        planStatusChannel.unsubscribe()
      }
    }
  }, [guid])

  return (

    <div className='d-flex justify-content-md-end align-items-center'>
      {/* {isAdmin && <div className='me-2'>{obj?.guid}</div>} */}
      {(completeStatuses.includes(status) === false && status) &&
        <span className='text-primary'>
          <TypeWriterText string={status} withBlink />
        </span>
      }
      <div className='input-group d-flex justify-content-end'>
        <Link href={`/contentplan/${guid}`} className="btn btn-primary" >View Plan</Link>
        <button className='btn btn-primary d-flex align-items-center justify-content-center' onClick={(e) => { e.preventDefault(); duplicateClickHandler(plan) }} title={`Duplicate: ${guid}`}>
          <i className="bi bi-copy" />
        </button>
        <button className='btn btn-secondary d-flex align-items-center justify-content-center' onClick={deleteClickHandler} title={`View GUID: ${guid}`}><i className="bi bi-trash pt-1" /></button>
      </div>
    </div>
  )
}

export default ContentPlanStatusCell;