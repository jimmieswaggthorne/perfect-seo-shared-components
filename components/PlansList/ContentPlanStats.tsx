'use client'
import { selectModalsOpen } from "@/perfect-seo-shared-components/lib/features/User"
import { getContentPlanChildren } from "@/perfect-seo-shared-components/services/services"
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client"
import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"

const ContentPlanStats = ({ guid, postCountClickHandler, outlineCountClickHandler }) => {
  const [stats, setStats] = useState<any>(null)
  const supabase = createClient()


  const completedStats = useMemo(() => {
    let completed = { 'outlines': [], 'tasks': [] }
    if (stats?.outlines?.length > 0) {
      completed.outlines = stats.outlines.filter(obj => obj.status === 'completed')
    }
    if (stats?.tasks?.length > 0) {
      completed.tasks = stats.tasks.filter(obj => obj.status === 'Complete')
    }
    return completed
  }, [stats])

  const pullStats = () => {

    if (modalsOpen) {
      console.log("blocked pulling stats")
      return
    }
    else {
      console.log("pull stats")
    }
    getContentPlanChildren(guid)
      .then(res => {
        const newOutlines = res.data.outlines.reduce((acc, curr) => {
          if (acc.find((obj) => curr.post_title === obj.post_title)) {
            return acc;
          } else return [
            ...acc,
            curr
          ];
        }, []);
        const newTasks = res.data.tasks.reduce((acc, curr) => {
          if (acc.find((obj) => curr.title === obj.title)) {
            return acc;
          } else return [
            ...acc,
            curr
          ];
        }, []);

        setStats({ tasks: newTasks, outlines: newOutlines })
      })
  }

  const modalsOpen = useSelector(selectModalsOpen)
  useEffect(() => {
    let postChannel;
    let outlinesChannel;
    if (guid) {
      if (modalsOpen) {
        console.log("blocked pulling stats")
        return
      }
      pullStats()
      postChannel = supabase.channel(`post-channel-${guid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `content_plan_guid=eq.${guid}` },
          (payload) => {
            pullStats()
          }
        )
        .subscribe()

      outlinesChannel = supabase.channel(`outlines-channel-${guid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'content_plan_outlines', filter: `content_plan_guid=eq.${guid}` },
          (payload) => {
            pullStats()
          }
        )
        .subscribe()
    }
    return () => {
      if (postChannel) {
        postChannel.unsubscribe()
      }
      if (outlinesChannel) {
        outlinesChannel.unsubscribe()
      }
    }
  }, [guid, modalsOpen])


  return (
    <div className="d-flex justify-content-end">{stats && <div className="d-flex">
      <button onClick={outlineCountClickHandler} className='btn btn-transparent p-0'>
        <div className="input-group">
          <span className='pill badge bg-primary'>Outlines</span>
          <span className='pill badge bg-secondary text-primary'>{completedStats?.outlines?.length > 0 && <span>{completedStats?.outlines?.length} / </span>} {stats?.outlines?.length}</span>
        </div>
      </button>
      <button onClick={postCountClickHandler} className='btn btn-transparent p-0'>
        <div className="input-group">
          <span className='pill badge bg-primary'>Posts</span>
          <span className='pill badge bg-secondary text-primary'>{completedStats?.tasks?.length > 0 && <span>{completedStats?.tasks?.length} / </span>}{stats?.tasks?.length}</span>
        </div>
      </button>
    </div>
    }</div>
  )
}

export default ContentPlanStats