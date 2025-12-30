import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal'
import { useDispatch, useSelector } from 'react-redux';
import { ContentType } from '@/perfect-seo-shared-components/data/types';
import { addToast, selectEmail, selectIsAdmin } from '@/perfect-seo-shared-components/lib/features/User';
import { useEffect, useState } from 'react';
import { createPost, deletePost, deleteOutline, fetchOutlineData, regenerateHTML, regenerateHTMLfromDoc, regenerateOutline, regeneratePost, updateLiveUrl } from '@/perfect-seo-shared-components/services/services';
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client';
import en from '@/assets/en.json'
import CreateContentModal from '../CreateContentModal/CreateContentModal';
import TypeWriterText from '../TypeWriterText/TypeWriterText';
import RegeneratePostModal, { GenerateTypes } from '../RegeneratePostModal/RegeneratePostModal';
import useForm from '@/perfect-seo-shared-components/hooks/useForm';
import IndexModal from '../IndexModal/IndexModal';
import Form from '../Form/Form';
import TextInput from '../Form/TextInput';
import { urlValidator } from '@/perfect-seo-shared-components/utils/validators';
import { urlSanitization } from '@/perfect-seo-shared-components/utils/conversion-utilities';
import FactCheckResultPage from '../FactCheckResultPage/FactCheckResultPage';
import FactCheckModal from '../FactCheckModal/FactCheckModal';
import { GenerateContentPost, RegeneratePost } from '@/perfect-seo-shared-components/data/requestTypes';
import RegeneratePostHTMLModal from '../RegeneratePostHTMLModal.tsx/RegeneratePostHTMLModal';
import Link from 'next/link';


interface ActionButtonGroupProps {
  data: any
  refresh: () => void
  type: ContentType
  setData: (data: any) => void
}


const ActionButtonGroup = ({
  data,
  setData,
  refresh,
  type
}: ActionButtonGroupProps) => {

  // Global store values 
  const dispatch = useDispatch()
  const isAdmin = useSelector(selectIsAdmin)
  const email = useSelector(selectEmail)

  const submitHTMLStylingHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid: data.content_plan_outline_guid
    };

    return regenerateHTML(reqBody)
  };
  const submitGoogleDocRegenerateHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid: data.content_plan_outline_guid,
    };


    return regenerateHTMLfromDoc(reqBody)
  };

  const regenerateHandler = () => {
    setShowEditModal(false);
    refresh();
  }
  // State management
  const supabase = createClient()

  // Modal states 
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showGeneratePostModal, setShowGeneratePostModal] = useState<boolean>(false);
  const [showRegeneratePostModal, setShowRegeneratePostModal] = useState<boolean>(false);
  const [showLiveURLModal, setShowLiveURLModal] = useState<boolean>(false);
  const [showIndexModal, setShowIndexModal] = useState<boolean>(false);
  const [showFactCheckModal, setShowFactCheckModal] = useState<boolean>(false);
  const [showRegenerateHTMLModal, setShowRegenerateHTMLModal] = useState<boolean>(false);
  const [showImageGeneratePrompt, setShowImageGeneratePrompt] = useState<boolean>(false);

  const [outlineData, setOutlineData] = useState<any>(null)
  // error states 
  const [regenerateError, setRegenerateError] = useState<string>('');

  // Form states 
  const liveURLForm = useForm()

  useEffect(() => {
    if (data?.live_post_url) {
      liveURLForm.setState({ live_url: data?.live_post_url })
    }
  }, [data?.live_post_url])

  // Click handlers and data handlers 
  const deleteClickHandler = (e) => {
    e.preventDefault()
    setShowDeleteModal(true)
  }

  const getOutlineData = () => {
    fetchOutlineData(data?.guid)
      .then(res => {
        setOutlineData(res.data[0])
      })
  }
  useEffect(() => {
    let outlineChannel;
    if (data?.guid && type === ContentType.OUTLINE) {

      getOutlineData()
      outlineChannel = supabase.channel(`actionbutton-outline-status-${data?.guid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'content_plan_outlines', filter: `guid=eq.${data?.guid}` },
          (payload) => {
            if (payload.new) {
              setOutlineData(payload.new)
            }

          }
        )
        .subscribe()
    }
    if (outlineChannel) {
      return () => {
        outlineChannel.unsubscribe()
      }
    }
  }, [])

  const deleteHandler = () => {
    if (type === ContentType.POST) {
      if (data?.task_id) {
        deletePost(data?.task_id)
          .then(res => {
            if (res.data) {
              let historyItem: any = { guid: data?.content_plan_outline_guid, email }
              if (data?.title) {
                historyItem.title = data?.title
              }
              supabase
                .from('user_history')
                .insert({ email: email, domain: data?.client_domain, transaction_data: historyItem, product: en.product, type: "DELETE", action: "Delete Post" })
                .select('*')
                .then(res => { })
              refresh();
              setShowDeleteModal(false)
            }
          })


      }
      else {
        console.log("no task id!", data)
      }
    }
    else {
      deleteOutline(data?.guid)
        .then(res => {
          refresh();
          setShowDeleteModal(false)
        })
        .catch(err => {
          console.log(err)
        })
    }
  }

  const handleEditOutline = (e?) => {
    if (e) {
      e.preventDefault()
    }
    setShowEditModal(true)
  }

  const generatePostHandler = (receiving_email, writing_language?) => {
    let newOutline = typeof data?.outline === 'string' ? JSON.parse(data?.outline) : data?.outline
    let reqBody: GenerateContentPost = {
      email: email, content_plan_outline_guid: data.guid,
      receiving_email: receiving_email,
      writing_language: writing_language || 'English'
    };
    return createPost(reqBody)
  }

  const regeneratePostHandler = (receiving_email, writing_language) => {
    setRegenerateError(null)
    return regeneratePost(data?.content_plan_outline_guid, { receiving_email: receiving_email, email, writing_language }).then(res => {
      let historyItem: any = { guid: data?.content_plan_outline_guid, email }
      if (data?.title) {
        historyItem.title = data?.title
      }
      supabase
        .from('user_history')
        .insert({ email: email, domain: data?.client_domain, transaction_data: historyItem, product: en.product, type: "REGENERATE", action: "Regenerate Post" })
        .select('*')
        .then(res => { })
      return res
    })
      .catch(err => {
        setRegenerateError(err.response.data.detail.split(":")[0])
        return err
      })
  }

  const saveLiveUrl = () => {
    let url = liveURLForm.getState.live_url
    if (url) {
      if (liveURLForm.validate({ requiredFields: ['live_url'], validatorFields: ['live_url'] })) {
        updateLiveUrl(data.content_plan_outline_guid, url || '')
          .then(res => {
            setData({ ...data, live_post_url: url })
            setShowLiveURLModal(false)
          })
      }

    }
    else {
      updateLiveUrl(data.content_plan_outline_guid, '')
        .then(res => {
          setData({ ...data, live_post_url: 'url' })
          setShowLiveURLModal(false)
        })
    }
  }

  const regeneratePostHTMLSubmitHandler = (email) => {
    let reqObj = {
      email: email,
      content_plan_outline_guid: data?.content_plan_outline_guid
    }
    return regenerateHTML(reqObj)
  }

  const regenerateOutlineClickHandler = () => {
    regenerateOutline(data?.guid, { email: email, client_domain: data?.client_domain, client_name: data?.brand_name, post_title: data?.post_title, content_plan_guid: data?.content_plan_guid })
      .then(res => {
        dispatch(addToast({ title: "Regenerating Outline", type: "info", content: `Regenerating outline for ${data?.post_title || data?.client_domain}` }))
      })
  }

  const copyOutlineGuid = () => {
    let copiedGuid;
    if (type === ContentType.POST) {
      copiedGuid = data?.content_plan_outline_guid
    } else if (type === ContentType.OUTLINE) {
      copiedGuid = data?.guid
    }
    navigator.clipboard.writeText(copiedGuid)
    dispatch(addToast({ title: "Copied Outline GUID", type: "success", content: `Outline GUID ${copiedGuid} copied to clipboard` }))
  }
  const copyPostGuid = () => {
    navigator.clipboard.writeText(data?.task_id)
    dispatch(addToast({ title: "Copied Post GUID", type: "success", content: `Post GUID ${data?.task_id} copied to clipboard` }))
  }
  const copyImageThinking = () => {
    navigator.clipboard.writeText(data?.hero_image_thinking)
    dispatch(addToast({ title: "Copied Image Prompt", type: "success", content: `Image Prompt copied to clipboard` }))
  }
  const copyImagePrompt = () => {
    navigator.clipboard.writeText(data?.hero_image_prompt)
    dispatch(addToast({ title: "Copied Image Prompt", type: "success", content: `Image Prompt copied to clipboard` }))

  }
  return (
    <>
      <div className='row d-flex justify-content-end'>
        <div className="input-group d-flex justify-content-end">
          {(data?.google_doc_link && data?.html_link) &&
            <>
              <a
                href={data.html_link}
                className="btn btn-warning btn-standard"
                title="HTML File"
                target="_blank"
              >
                <i className="bi bi-filetype-html " />
              </a>
              <a
                href={data.google_doc_link}
                className="btn btn-warning btn-standard"
                title="Google Docs"
                target="_blank"
              >
                <i className="bi bi-filetype-doc " />
              </a>
            </>}
          {(type === ContentType.OUTLINE && data?.outline) &&
            <button
              title='edit outline'
              className="btn btn-warning btn-standard no-truncate"
              onClick={() => { setShowEditModal(true) }}
            >
              <i className="bi bi-pencil-fill me-1" /> Edit
            </button>
          }
          <button className='btn btn-primary btn-standard d-flex justify-content-center align-items-center' onClick={deleteClickHandler} title={`View GUID: ${data?.content_plan_outline_guid}`}><i className="bi bi-trash pt-1" /></button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="btn btn-warning btn-standard d-flex align-items-center justify-content-center">
              <i className="bi bi-three-dots-vertical" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="bg-primary z-100 card">
                {(data?.content_plan_outline_guid && outlineData?.outline) &&
                  <DropdownMenu.Item>
                    <button className="btn btn-transparent w-100" onClick={handleEditOutline}>
                      Edit Outline
                    </button>
                  </DropdownMenu.Item>}
                {data?.content_plan_guid &&
                  <DropdownMenu.Item>
                    <a
                      href={`/contentplan/${data?.content_plan_guid}`}
                      target="_blank"
                      className="btn btn-transparent"
                    >
                      View Content Plan
                    </a>
                  </DropdownMenu.Item>}
                {type === ContentType.OUTLINE &&
                  <>
                    <DropdownMenu.Item>
                      <button
                        className="btn btn-transparent text-black w-100"
                        onClick={(e) => {
                          regenerateOutlineClickHandler();
                        }}
                      >
                        Regenerate Outline
                      </button>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <button
                        className="btn btn-transparent text-black w-100"
                        onClick={() => { setShowGeneratePostModal(true) }}
                      >
                        Generate Post
                      </button>
                    </DropdownMenu.Item>
                  </>}
                {type === ContentType.POST &&
                  <>
                    {data?.hero_image_prompt && <DropdownMenu.Item>
                      <button className="btn btn-transparent w-100" onClick={() => { setShowImageGeneratePrompt(true) }}>Show Hero Image Prompt</button>
                    </DropdownMenu.Item>
                    }
                    {(isAdmin && data?.task_id) && <DropdownMenu.Item>
                      <Link className="btn btn-transparent w-100" href={`/post/${data?.task_id}`} target="_blank">Post Page</Link>
                    </DropdownMenu.Item>}
                    <DropdownMenu.Item>
                      <button className="btn btn-transparent w-100" onClick={() => { setShowRegeneratePostModal(true) }}>Regenerate Post</button>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <button className="btn btn-transparent w-100" onClick={() => { setShowLiveURLModal(true) }}>{data?.live_post_url ? 'Edit' : 'Add'} Live Post URL</button>
                    </DropdownMenu.Item>
                    {data?.live_post_url && <>
                      {isAdmin && <>
                        {data?.factcheck_guid ?
                          <DropdownMenu.Item>
                            <a
                              href={`https://factcheckPerfect.ai/fact-checks/${data?.factcheck_guid}`}
                              target="_blank"
                              className="btn btn-transparent"

                            >
                              Fact-Check Results
                            </a>
                          </DropdownMenu.Item>
                          : <DropdownMenu.Item>
                            <a
                              href={`https://factcheckPerfect.ai/fact-checks?url=${encodeURI(data?.live_post_url)}&post_guid=${data?.content_plan_outline_guid}`}
                              target="_blank"
                              className="btn btn-transparent"

                            >
                              Fact-Check Post
                            </a>
                          </DropdownMenu.Item>
                        }
                      </>}
                      {isAdmin && <DropdownMenu.Item>
                        <button
                          onClick={() => { setShowIndexModal(true) }}
                          className="btn btn-transparent w-100"
                        >
                          Index Post
                        </button>
                      </DropdownMenu.Item>}
                      <DropdownMenu.Item>
                        <a
                          href={`https://socialperfect.ai?url=${encodeURI(data?.live_post_url)}`}
                          target="_blank"
                          className="btn btn-transparent"

                        >
                          Generate Social Posts
                        </a>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <a
                          href={`https://app.ahrefs.com/v2-site-explorer/organic-keywords?columns=CPC%7C%7CKD%7C%7CLastUpdated%7C%7COrganicTraffic%7C%7CPaidTraffic%7C%7CPosition%7C%7CPositionHistory%7C%7CSERP%7C%7CSF%7C%7CURL%7C%7CVolume&compareDate=dontCompare&country=us&currentDate=today&keywordRules=&limit=100&mode=prefix&offset=0&positionChanges=&serpFeatures=&sort=Volume&sortDirection=desc&target=${encodeURI(data?.live_post_url.replace("https://", '').replace("http://", "").replace("www.", ""))}&urlRules=&volume_type=average`}
                          target="_blank"
                          className="btn btn-transparent"
                        >
                          AHREFs Report
                        </a>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <a
                          href={`https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3A${urlSanitization(data?.live_post_url)}&hl=en&page=*${encodeURI(data?.live_post_url)}`}
                          target="_blank"
                          className="btn btn-transparent"

                        >
                          GSC Report
                        </a>
                      </DropdownMenu.Item>
                    </>}
                  </>}
                {isAdmin && <>
                  {(type === ContentType.OUTLINE && data?.guid) && <DropdownMenu.Item>
                    <button className="btn btn-transparent w-100" onClick={copyOutlineGuid}>
                      Copy Outline GUID
                    </button>
                  </DropdownMenu.Item>
                  }
                  {(type === ContentType.POST && data?.task_id) && <DropdownMenu.Item>
                    <button className="btn btn-transparent w-100" onClick={copyPostGuid}>
                      Copy Post GUID
                    </button>
                  </DropdownMenu.Item>
                  }
                  {(type === ContentType.POST && data?.content_plan_outline_guid) && <DropdownMenu.Item>
                    <button className="btn btn-transparent w-100" onClick={copyOutlineGuid}>
                      Copy Outline GUID
                    </button>
                  </DropdownMenu.Item>
                  }
                </>
                }
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        {regenerateError && <div className='col-12 text-end text-primary mt-2'>
          <TypeWriterText string={regenerateError} withBlink />
        </div>}
      </div>
      {/* Modals  */}
      <Modal.Overlay open={showDeleteModal} onClose={() => { setShowDeleteModal(null) }}>
        <Modal.Title title="Delete Plan" />
        <Modal.Description>
          Are you sure you want to delete this post?
          <div className='d-flex justify-content-between mt-5'>
            <button onClick={() => { setShowDeleteModal(null) }} className="btn btn-warning">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); deleteHandler() }} className="btn btn-primary">Yes</button>
          </div>
        </Modal.Description>
      </Modal.Overlay>
      <Modal.Overlay open={showEditModal} onClose={() => { setShowEditModal(null) }}>
        <CreateContentModal regenerateHandler={regenerateHandler} standalone data={data} titleChange={() => { }} onClose={() => { setShowEditModal(false) }} isAuthorized={true} />
      </Modal.Overlay>
      <Modal.Overlay
        open={showRegeneratePostModal}
        onClose={() => { setShowRegeneratePostModal(null); refresh() }}
      >
        <RegeneratePostModal
          submitHTMLStylingHandler={submitHTMLStylingHandler}
          submitGoogleDocRegenerateHandler={submitGoogleDocRegenerateHandler}
          onClose={() => { setShowRegeneratePostModal(null); }}
          type={GenerateTypes.REGENERATE}
          submitHandler={regeneratePostHandler}
          onSuccess={() => { setShowRegeneratePostModal(false); refresh() }}
          contentPlanOutlineGuid={data?.content_plan_outline_guid || data?.guid}
        />
      </Modal.Overlay >
      <Modal.Overlay
        open={showGeneratePostModal}
        onClose={() => { setShowGeneratePostModal(null); refresh() }}
      >
        <RegeneratePostModal
          submitHTMLStylingHandler={submitHTMLStylingHandler}
          submitGoogleDocRegenerateHandler={submitGoogleDocRegenerateHandler}
          onClose={() => { setShowGeneratePostModal(null); }}
          type={GenerateTypes.GENERATE}
          submitHandler={generatePostHandler}
          onSuccess={() => { setShowGeneratePostModal(false); refresh() }}
          contentPlanOutlineGuid={data?.content_plan_outline_guid || data?.guid}
        />
      </Modal.Overlay >
      <Modal.Overlay closeIcon open={showLiveURLModal} onClose={() => setShowLiveURLModal(false)} className="modal-small">
        <Modal.Title title="Add Live URL" />
        <div className="card bg-secondary p-3 w-100">
          <Form controller={liveURLForm}>
            <TextInput fieldName="live_url" label="Live URL" validator={urlValidator} type="url" required
              button={<button className="btn btn-primary" onClick={saveLiveUrl} type="submit" ><i className="bi bi-floppy-fill" /></button>} />
          </Form>
        </div>
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={showFactCheckModal} onClose={() => setShowFactCheckModal(false)}>
        <div className="modal-body">
          {data?.factcheck_guid ?
            <FactCheckResultPage isModal uuid={data?.factcheck_guid} />
            :
            <FactCheckModal onClose={
              () => {
                setShowFactCheckModal(false)
              }
            } post={data} setLocalPost={setData} />
          }
        </div>
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={showIndexModal} onClose={() => setShowIndexModal(false)}>
        <div className="modal-body">
          <IndexModal post={data}
            setPost={setData}
            onClose={() => {
              setShowIndexModal(false);
              return refresh();
            }} />
        </div>
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={showRegenerateHTMLModal} onClose={() => setShowRegenerateHTMLModal(false)}>
        <RegeneratePostHTMLModal onClose={() => setShowRegenerateHTMLModal(false)} submitHandler={regeneratePostHTMLSubmitHandler} onSuccess={() => {
          setShowRegenerateHTMLModal(false); return refresh()
        }} />
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={showImageGeneratePrompt} onClose={() => setShowImageGeneratePrompt(false)}>
        <div className="card p-3">
          {data?.hero_image_prompt && <div className="card-body">
            <h5 className="card-title">Image Generation Prompt</h5>
            <pre className="card p-1 bg-secondary">{data?.hero_image_prompt}</pre>
            <button className="btn btn-primary mt-1" onClick={copyImagePrompt}><i className="bi bi-copy" />Copy</button>
          </div>
          }
          {data?.hero_image_thinking && <div className="card-body">
            <h5 className="card-title">Image Generation Prompt</h5>
            <pre className="card p-1 bg-secondary">{data?.hero_image_thinking}</pre>
            <button className="btn btn-primary mt-1" onClick={copyImageThinking}><i className="bi bi-copy" />Copy</button>
          </div>
          }
        </div>
      </Modal.Overlay>
    </>
  )
}
export default ActionButtonGroup