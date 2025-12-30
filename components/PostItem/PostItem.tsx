'use client'
import { useEffect, useState } from "react"
import TextInput from "../Form/TextInput"
import { urlValidator } from "@/perfect-seo-shared-components/utils/validators"
import { deletePost, getPost, getPostStatus, regenerateHTML, regenerateHTMLfromDoc, regeneratePost, updateLiveUrl } from "@/perfect-seo-shared-components/services/services"
import moment from "moment-timezone"
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal'
import { useDispatch, useSelector } from "react-redux"
import { selectEmail, selectIsAdmin } from "@/perfect-seo-shared-components/lib/features/User"
import CreateContentModal from "../CreateContentModal/CreateContentModal"
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client"
import en from '@/assets/en.json'
import RegeneratePostModal, { GenerateTypes } from "../RegeneratePostModal/RegeneratePostModal"
import { ContentType } from "@/perfect-seo-shared-components/data/types"
import Form from "../Form/Form"
import useForm from "@/perfect-seo-shared-components/hooks/useForm"
import FactCheckModal from "../FactCheckModal/FactCheckModal"
import FactCheckResultPage from "../FactCheckResultPage/FactCheckResultPage"
import StatusBar from "../StatusBar/StatusBar"
import IndexModal from "../IndexModal/IndexModal"
import ActionButtonGroup from "../ActionButtonGroup/ActionButtonGroup"
import { RegeneratePost } from "@/perfect-seo-shared-components/data/requestTypes"

interface PostItemProps {
  post: any,
  refresh: () => void
  domain_name?: string
}

const PostItem = ({ post, refresh, domain_name }: PostItemProps) => {
  const email = useSelector(selectEmail)
  const [liveUrl, setLiveUrl] = useState(post?.live_post_url)
  const [status, setStatus] = useState(post?.status)
  const [localPost, setLocalPost] = useState(post)
  const [showIndex, setShowIndex] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [regenerateError, setRegerateError] = useState(null)
  const [editOutline, setEditOutline] = useState(false)
  const [showRegeneratePost, setShowRegeneratePost] = useState(false)
  const [showFactCheck, setShowFactCheck] = useState(null)
  const [showLivePost, setShowLivePost] = useState(false)
  const isAdmin = useSelector(selectIsAdmin)
  const dispatch = useDispatch()
  const form = useForm()

  const regenerateHandler = () => {
    setCompleted(false);
    setEditOutline(false);
  }

  const saveLiveUrl = () => {
    let url = liveUrl
    if (url) {
      if (form.validate({ requiredFields: ['live_url'], validatorFields: ['live_url'] })) {
        updateLiveUrl(localPost.content_plan_outline_guid, url || '')
          .then(res => {
            setLocalPost({ ...localPost, live_post_url: url })
            setShowLivePost(false)
          })
      }

    }
    else {
      updateLiveUrl(localPost.content_plan_outline_guid, '')
        .then(res => {
          setLocalPost({ ...localPost, live_post_url: '' })
          setShowLivePost(false)
        })
    }

  }

  const liveUrlChangeHandler = (e) => {
    setLiveUrl(e.target.value)
  }

  useEffect(() => {
    if (post?.status !== status) {
      setStatus(post?.status)
    }
  }, [post])

  const fetchStatus = () => {
    getPost(post?.task_id)
      .then((res) => {
        setStatus(res.data[0]?.status);
        setLocalPost(res.data[0])
      })
  }

  useEffect(() => {
    let contentPlanOutlines;
    if (post?.task_id) {
      fetchStatus()
      contentPlanOutlines = supabase.channel(`status-${post.task_id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `task_id=eq.${post.task_id}` },
          (payload) => {
            console.log(payload)
            if (payload?.new) {
              if (payload?.new && 'status' in payload.new) {
                setStatus(payload.new?.status)
              }

              setLocalPost(payload.new)
            }
          }
        )
        .subscribe()
    }
  }, [post?.task_id])

  const completedStatus = ["Complete", "Uploaded To Google Drive", "Uploading To Google Drive"]

  useEffect(() => {
    setCompleted(completedStatus.includes(status))
  }, [status])


  const deleteClickHandler = (e) => {
    e.preventDefault()
    setDeleteModal(true)
  }

  const supabase = createClient()
  const submitHTMLStylingHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid: localPost?.content_plan_outline_guid,
    };

    return regenerateHTML(reqBody)
  };
  const submitGoogleDocRegenerateHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid: localPost?.content_plan_outline_guid,
    };
    return regenerateHTMLfromDoc(reqBody)
  };

  const deleteHandler = () => {
    deletePost(localPost?.task_id)
      .then(res => {
        if (res.data) {
          let historyItem: any = { guid: localPost?.content_plan_outline_guid, email }
          if (localPost?.title || localPost?.post_title || localPost?.content_plan_outline_title) {
            historyItem.title = localPost?.title || localPost?.post_title || localPost?.content_plan_outline_title
          }
          supabase
            .from('user_history')
            .insert({ email: email, domain: post?.client_domain, transaction_data: historyItem, product: en.product, type: "DELETE", action: "Delete Post" })
            .select('*')
            .then(res => { })
          refresh();
          setDeleteModal(false)
        }
      })
  }


  const regeneratePostHandler = (receiving_email, writing_language) => {
    setRegerateError(null)
    return regeneratePost(localPost?.content_plan_outline_guid, { receiving_email: receiving_email, email, writing_language }).then(res => {
      let historyItem: any = { guid: localPost?.content_plan_outline_guid, email }
      if (localPost?.title || localPost?.post_title || localPost?.content_plan_outline_title) {
        historyItem.title = localPost?.title || localPost?.post_title || localPost?.content_plan_outline_title
      }
      supabase
        .from('user_history')
        .insert({ email: email, domain: post?.client_domain, transaction_data: historyItem, product: en.product, type: "REGENERATE", action: "Regenerate Post" })
        .select('*')
        .then(res => { })
      return res
    })
      .catch(err => {
        setRegerateError(err.response.data.detail.split(":")[0])
        return err
      })


  }

  const addLiveUrlHandler = () => {
    setShowLivePost(true);
  }
  const handleEditOutline = (e?) => {
    if (e) {
      e.preventDefault()
    }
    setEditOutline(true)
  }
  const closeHandler = () => {
    setShowFactCheck(false)
    return fetchStatus()
  }

  return (
    <div className="card bg-secondary p-2" title={post?.title}>
      <div className="row d-flex g-2 d-flex align-items-end">
        <div className="col">
          <div className="row g-2">
            <div className="col-12">
              <p className="mb-1">
                <small>
                  <strong className="text-primary ">Created on</strong> {moment(`${localPost?.created_at}Z`).local().format("dddd, MMMM Do, YYYY h:mma")}
                  {/* {isAdmin ? <span className="text-primary ms-2">{localPost?.content_plan_outline_guid}</span> : null} */}
                  {!localPost?.content_plan_guid && <span className="badge bg-warning ms-2">Bulk</span>}
                </small>
              </p>
              <p className="m-0">
                <strong className="text-primary me-1">Title</strong>  {localPost?.title}{(localPost?.writing_language !== 'English' && localPost?.writing_language) && <small>({localPost?.writing_language})</small>}
                <small>
                  {(localPost.client_domain !== domain_name) ? <span className='badge bg-primary ms-2'>{localPost?.client_name}</span> : email !== localPost.email ? <span className="ms-2 text-primary">generated by <span className="text-white">{localPost.email}</span></span> : null}
                </small>
              </p>
              {localPost?.live_post_url && <p className="m-0">  <strong className="text-primary me-1">Live URL</strong>  <a href={localPost?.live_post_url} target="_blank" title="View Live Post"><i className="bi bi-link" /> {localPost?.live_post_url}</a><a className="text-small ms-2 text-primary" onClick={e => { e.preventDefault(); setShowLivePost(true) }} title="Edit URL">Edit URL</a></p>}
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="row g-2 d-flex justify-content-between align-items-center w-100">
            <div className="col-auto">
              <StatusBar post_status={status} indexHandler={() => setShowIndex(true)} type={ContentType.POST} content_plan_outline_guid={localPost.content_plan_outline_guid} content_plan_guid={localPost?.content_plan_guid}
                hero_image_prompt={localPost?.hero_image_prompt}
                content_plan_factcheck_guid={localPost?.factcheck_guid} task_id={localPost.task_id} addLiveUrlHandler={addLiveUrlHandler} live_post_url={localPost.live_post_url} index_status={localPost?.index_status} schema_data={localPost?.schema_data} />
            </div>
            <div className="col-auto">
              <ActionButtonGroup type={ContentType.POST} setData={setLocalPost} data={localPost} refresh={refresh} />
            </div>
          </div>
        </div>
      </div>
      <Modal.Overlay open={deleteModal} onClose={() => { setDeleteModal(null) }}>
        <Modal.Title title="Delete Plan" />
        <Modal.Description>
          Are you sure you want to delete this post?
          <div className='d-flex justify-content-between mt-5'>
            <button onClick={() => { setDeleteModal(null) }} className="btn btn-warning">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); deleteHandler() }} className="btn btn-primary">Yes</button>
          </div>
        </Modal.Description>
      </Modal.Overlay>

      <Modal.Overlay open={editOutline} onClose={() => { setEditOutline(null) }}>
        <CreateContentModal regenerateHandler={regenerateHandler} standalone data={localPost} titleChange={() => { }} onClose={() => { setEditOutline(false) }} isAuthorized={true} />
      </Modal.Overlay>
      <Modal.Overlay
        open={showRegeneratePost}
        onClose={() => { setShowRegeneratePost(null); refresh() }}
      >
        <RegeneratePostModal
          submitGoogleDocRegenerateHandler={submitGoogleDocRegenerateHandler}
          submitHTMLStylingHandler={submitHTMLStylingHandler}
          onClose={() => { setShowRegeneratePost(null); }}
          type={GenerateTypes.REGENERATE}
          submitHandler={regeneratePostHandler}
          onSuccess={() => { setShowRegeneratePost(false); refresh() }}
          contentPlanOutlineGuid={localPost?.content_plan_outline_guid}
        />
      </Modal.Overlay >
      <Modal.Overlay closeIcon open={showLivePost} onClose={() => setShowLivePost(false)} className="modal-small">
        <Modal.Title title="Add Live URL" />
        <div className="card bg-secondary p-3 w-100">
          <Form controller={form}>
            <TextInput fieldName="live_url" label="Live URL" value={liveUrl} onChange={liveUrlChangeHandler} validator={urlValidator} required
              button={<button className="btn btn-primary" onClick={saveLiveUrl} type="submit" ><i className="bi bi-floppy-fill" /></button>} />
          </Form>
        </div>
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={showFactCheck} onClose={() => setShowFactCheck(false)}>
        <div className="modal-body">
          {localPost?.factcheck_guid ?
            <FactCheckResultPage isModal uuid={localPost?.factcheck_guid} />
            :
            <FactCheckModal onClose={closeHandler} post={localPost} setLocalPost={setLocalPost} />
          }
        </div>
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={showIndex} onClose={() => setShowIndex(false)}>
        <div className="modal-body">
          <IndexModal post={localPost} setPost={setLocalPost} onClose={() => {
            setShowIndex(false); return refresh();
          }} />
        </div>
      </Modal.Overlay>
    </div>

  )
}

export default PostItem