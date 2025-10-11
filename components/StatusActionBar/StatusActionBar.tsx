import { useDispatch, useSelector } from 'react-redux';
import { ContentType, Outline, PostProps } from '@/perfect-seo-shared-components/data/types';
import { selectEmail, selectIsAdmin } from '@/perfect-seo-shared-components/lib/features/User';
import { useEffect, useState } from 'react';
import { getPost, fetchOutlineData, fetchOutlineStatus, getPostStatusFromOutline, publishToWordPress, generateImagePrompt, generateSchema, updateLiveUrl, getFactCheckStatus, regeneratePost, createPost, regenerateHTML, regenerateHTMLfromDoc, regenerateOutline, deletePost, deleteOutline } from '@/perfect-seo-shared-components/services/services';
import TypeWriterText from '../TypeWriterText/TypeWriterText';
import RegeneratePostModal, { GenerateTypes } from '../RegeneratePostModal/RegeneratePostModal';
import { keyToLabel, urlSanitization } from '@/perfect-seo-shared-components/utils/conversion-utilities';
import * as Modal from '../Modal/Modal';
import useForm from '@/perfect-seo-shared-components/hooks/useForm';
import Form from '../Form/Form';
import TextArea from '../Form/TextArea';
import HeroImageGenerator from '../HeroImageGenerator/HeroImageGenerator';
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client';
import IndexModal from '../IndexModal/IndexModal';
import TextInput from '../Form/TextInput';
import { urlValidator } from '@/perfect-seo-shared-components/utils/validators';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import { GenerateContentPost, RegeneratePost } from '@/perfect-seo-shared-components/data/requestTypes';
import CreateContentModal from '../CreateContentModal/CreateContentModal';


interface StatusActionBarProps {
  refresh?: () => void
  type: ContentType
  outline?: Outline
  post?: PostProps
  content_plan_outline_guid: string;
  content_plan_post_id?: string;
  deleteHandler?: () => void;
  generateOutline?: () => void;
}


const StatusActionBar = ({
  refresh,
  type,
  outline,
  post,
  content_plan_outline_guid,
  content_plan_post_id,
  deleteHandler,
  generateOutline
}: StatusActionBarProps) => {

  const supabase = createClient()

  // Global store values 
  const isAdmin = useSelector(selectIsAdmin)
  const email = useSelector(selectEmail)

  // local states 
  const [localPost, setLocalPost] = useState<PostProps>(post)
  const [localOutline, setLocalOutline] = useState<Outline>(outline)

  const form = useForm()

  const copyClickHandler = (key) => {
    switch (key) {
      case 'schema_data':
        return navigator.clipboard.writeText(form.getState.schema_data).then(() => {
          setStatus('generateSchema', 'Copied to clipboard')
        }).catch(err => {
          setStatus('generateSchema', 'Error copying to clipboard')
        })

      default:
        return navigator.clipboard.writeText(form.getState[key])
    }
  }
  const copyOutlineClickHandler = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(content_plan_outline_guid)
  }

  // Combined state for loading, errors, status, and completion
  const [statusState, setStatusState] = useState<{
    outline: {
      complete: boolean;
      error?: string;
      status?: string;
      loading: boolean;
    },
    post: {
      complete: boolean;
      error?: string;
      status?: string;
      loading: boolean;
    },
    regenerate: {
      complete: boolean;
      error?: string;
      status?: string;
      loading: boolean;
    },
    factcheck: {
      complete: boolean;
      error?: string;
      status?: string;
      loading: boolean;
    },
    generateSchema: {
      complete: boolean;
      error?: string;
      status?: string;
      loading: boolean;
    },
    wordPressPublish: {
      status?: string;
      loading: boolean;
      complete: boolean;
      error?: string;
    },
    generateImagePrompt: {
      complete: boolean;
      error?: string;
      status?: string;
      loading: boolean;
    },
  }>({
    outline: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: true,
    },
    post: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: false,
    },
    regenerate: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: false,
    },
    factcheck: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: false,
    },
    generateSchema: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: false,
    },
    wordPressPublish: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: false,
    },
    generateImagePrompt: {
      complete: false,
      error: undefined,
      status: undefined,
      loading: false,
    },
  });

  // Update loading state for a specific section
  const setLoading = (key: keyof typeof statusState, value: boolean) => {
    setStatusState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        loading: value,
      },
    }));
  };

  // Update error state for a specific section
  const setError = (key: keyof typeof statusState, value?: string) => {
    setStatusState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error: value,
      },
    }));
  };

  // Update completion state for a specific section
  const setCompletion = (key: keyof typeof statusState, value: boolean) => {
    setStatusState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        complete: value,
      },
    }));
  };

  //Update status for a specific section
  const setStatus = (key: keyof typeof statusState, value?: string) => {
    setStatusState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: value,
      },
    }));
  };


  // modal states 
  const modalInitialState = {
    viewSchema: false,
    viewGenerateImage: false,
    viewEdit: false,
    viewGeneratePost: null,
    viewImagePrompt: false,
    viewEditLiveUrl: false,
    viewIndex: false,
    viewDeleteOutline: false,
    viewDeletePost: false
  };

  const [modals, setModals] = useState<{ viewSchema: boolean; viewGenerateImage: boolean, viewEdit: boolean, viewGeneratePost: GenerateTypes, viewImagePrompt: boolean, viewEditLiveUrl: boolean, viewIndex: boolean, viewDeleteOutline: boolean, viewDeletePost: boolean; }>(modalInitialState);

  const modalsOpen = Object.values(modals).some(value => value !== null && value !== false);

  //Update modals for specific key
  const setModal = (key: keyof typeof modals, value?: any) => {
    setModals((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  const closeModals = (e?) => {
    if (e) {
      e.preventDefault();
    }
    setModals(modalInitialState);
  }

  // other states 
  const [wordPressPublish, setWordPressPublish] = useState<boolean>(false);

  //Fetch data
  const fetchOutline = () => {
    fetchOutlineData(content_plan_outline_guid)
      .then(res => {
        setLocalOutline(res.data[0])
        setLoading('outline', false)
      })
  }

  const fetchOutlineStatusData = () => {
    fetchOutlineStatus(content_plan_outline_guid)
      .then(res => {
        if (res.data[0]?.status) {
          setStatus('outline', res.data[0]?.status);
        }
      })
  };

  const updatePost = (post: PostProps) => {
    setLocalPost(post);
    setStatus('post', post?.status || '');
    form.setState(post);
  }

  const fetchPostFromOutline = () => {
    getPostStatusFromOutline(content_plan_outline_guid)
      .then(res => {
        updatePost(res.data[0])
      })
  }


  const fetchPost = () => {
    getPost(content_plan_post_id)
      .then((res) => {
        updatePost(res.data);

      })
  }

  const checkIfIndexed = async (live_post_url: string) => {
    let user = localStorage.getItem('email');
    try {
      const { data, error } = await supabase.functions.invoke('check-indexation', {
        body: { url: live_post_url, user },
      });

      if (error) {
        console.error('Error checking indexed status:', error);
        return null;
      }
      if (data) {

        if (data?.coverageState !== localPost?.index_status) {
          supabase
            .from('tasks')
            .update({ index_status: data?.coverageState })
            .eq('task_id', localPost?.task_id)
            .select("*")
            .then(res => {
              console.log('Updated index status:', res.data);
            })
        }
      }
      return data;
      // data will be: { indexed: boolean, url: string, message: string }
    } catch (err) {
      console.error('Failed to check indexed status:', err);
      return null;
    }
  };

  const fetchFactcheckStatusData = () => {
    if (localPost?.factcheck_guid) {
      setLoading('factcheck', true);
      getFactCheckStatus(localPost?.factcheck_guid)
        .then(res => {
          let status = res.data.status.replaceAll("_", " ").split(":")[0];
          setLoading('factcheck', false);
          setStatus('factcheck', status);
        })
        .catch(err => {
          setLoading('factcheck', false);
          setError('factcheck', err?.response?.data?.message || err?.message || 'An error occurred');
        });
    }
  };

  const checkWordPressPublish = async () => {
    supabase
      .from('tasks')
      .select('client_domain')
      .order('created_at', { ascending: false })
      .eq('content_plan_outline_guid', content_plan_outline_guid)
      .limit(1)
      .then(res => {
        if (res.data[0]) {
          const domain = res.data[0].client_domain;
          // console.log('domain', domain)
          // Check if the domain exists in the clients tables

          supabase
            .from('client_api_keys')
            .select('*')
            .eq('domain', domain)
            .eq('is_active', true)
            .limit(1)
            .then(res => {
              if (res.data[0]) {
                setWordPressPublish(true)
              }
              else {
                setWordPressPublish(false)
              }
            })

        }
      })

  }

  const generatePostHandler = (receiving_email, writing_language?) => {
    let reqBody: GenerateContentPost = {
      email: email, content_plan_outline_guid,
      receiving_email: receiving_email,
      writing_language: writing_language || 'English'
    };
    return createPost(reqBody)
  }

  const regeneratePostHandler = (receiving_email, writing_language) => {
    setError('regenerate', null)
    return regeneratePost(content_plan_outline_guid, { receiving_email: receiving_email, email, writing_language })
      .catch(err => {
        setError('regenerate', err.response.data.detail.split(":")[0])
        return err
      })
  }

  const generateModalClickHandler = (receiving_email, writing_language?) => {
    if (modals?.viewGeneratePost === GenerateTypes.GENERATE) {
      return generatePostHandler(receiving_email, writing_language)
    }
    else {
      return regeneratePostHandler(receiving_email, writing_language)
    }
  }

  const deletePostHandler = () => {
    if (type === ContentType.POST) {
      if (localPost?.task_id) {
        deletePost(localPost?.task_id)
          .then(res => {
            if (res.data) {
              closeModals();
              refresh();
            }
          })


      }
      else {
        console.log("no task id!", localPost)
      }
    }
    else {
      deleteOutline(content_plan_outline_guid)
        .then(res => {
          refresh();
          closeModals();
        })
    }
    if (deleteHandler) {
      deleteHandler();
    }
  }



  // updates outline and outline statuses 
  useEffect(() => {
    let outlineStatusesChannel;
    let outlineChannel;
    if (content_plan_outline_guid) {

      if (!modalsOpen) {
        fetchOutlineStatusData();

        fetchOutline();
        if (!content_plan_post_id && !post) {
          fetchPostFromOutline();
        }
        outlineStatusesChannel = supabase.channel(`statusbar-outline-status-${content_plan_outline_guid}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'content_plan_outline_statuses', filter: `outline_guid=eq.${content_plan_outline_guid}` },
            (payload) => {
              console.log('New outline status:', payload);
              if (payload.new && typeof payload.new === 'object' && 'status' in payload.new) {
                console.log('New outline status:', payload.new.status);
                setStatus('outline', payload.new.status);
              }
            }
          )
          .subscribe()
        if (!outline) {
          outlineChannel = supabase.channel(`statusbar-outline-status-${content_plan_outline_guid}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'content_plan_outlines', filter: `guid=eq.${content_plan_outline_guid}` },
              (payload) => {
                setLocalOutline(payload.new as Outline)
              }
            )
            .subscribe()
        }
      }
    }
    else {
      setLoading('outline', false)
    }

    return () => {
      if (outlineStatusesChannel) {
        outlineStatusesChannel.unsubscribe()
      }
      if (outlineChannel) {
        outlineChannel.unsubscribe()
      }
    }
  }, [content_plan_outline_guid, modalsOpen])

  // updates post if post or content_plan_post_id changes
  useEffect(() => {
    if (content_plan_post_id) {
      if (post) {
        updatePost(post);
      }
      else {
        fetchPost();
      }
    }
  }, [content_plan_post_id, post])

  useEffect(() => {
    let postChannel;
    // let postStatusChannel;
    if (localPost?.task_id) {
      console.log("setting up post channel for", localPost?.task_id)
      postChannel = supabase.channel(`statusbar-post-status-${localPost?.task_id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `task_id=eq.${localPost?.task_id}` },
          (payload: any) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Post updated:', payload);
            }
            updatePost(payload.new as PostProps)
            if (payload.new.status) {
              setStatus('post', payload.new.status);
            }
          }
        )
        .subscribe()
      // postStatusChannel = supabase.channel(`statusbar-post-status-only-${localPost?.task_id}`)
      //   .on(
      //     'postgres_changes',
      //     { event: '*', schema: 'public', table: 'task_status_history', filter: `task_id=eq.${localPost?.task_id}` },
      //     (payload) => {
      //       if (payload.new) {
      //         console.log('New post status:', payload.new);
      //       }

      //     }
      //   )
      //   .subscribe()
    }
    return () => {
      // if (postStatusChannel) {
      //   postStatusChannel.unsubscribe()
      // }
      if (postChannel) {
        postChannel.unsubscribe()
      }
    }
  }, [localPost?.task_id, post])


  useEffect(() => {
    let factcheckInterval;
    if (!statusState?.factcheck?.complete) {
      fetchFactcheckStatusData();
      factcheckInterval = setInterval(() => {
        fetchFactcheckStatusData();
      }, 60000);
    }
    return () => {
      if (factcheckInterval) {
        clearInterval(factcheckInterval);
      }
    };
  }, [statusState?.factcheck?.complete, localPost?.factcheck_guid]);

  useEffect(() => {
    if (statusState?.post?.complete) {
      checkWordPressPublish()
    }
  }, [statusState?.post?.complete])

  useEffect(() => {
    if (localPost?.live_post_url
      && localPost?.index_status !== 'Submitted and indexed'
    ) {
      checkIfIndexed(localPost?.live_post_url)
    }
  }, [localPost?.live_post_url])

  useEffect(() => {
    setCompletion('outline', statusState?.outline?.status === 'completed');
    setCompletion('post', statusState?.post?.status === 'Complete');
    if (statusState?.outline?.status === "reset_completed") {
      setError('outline', 'error: retry outline generation')
    }
    else {
      setError('outline', '')
    }
  }, [statusState?.outline?.status, statusState?.post?.status]);

  // modal handlers 

  const showEditOutlineHandler = (e) => {
    e.preventDefault();
    setModal('viewEdit', true)
  }

  const addLiveUrlClickHandler = (e) => {
    e.preventDefault();
    setModal('viewEditLiveUrl', true)
  }

  const indexClickHandler = (e) => {
    e.preventDefault();
    setModal('viewIndex', true);
  }

  const deleteClickHandler = (e) => {
    e.preventDefault()
    setModal('viewDeleteOutline', true)
  }

  // generate functions 

  const generatePostClickHandler = (e) => {
    e.preventDefault();
    setModal('viewGeneratePost', GenerateTypes.GENERATE)
  }

  const generateImagePromptHandler = (e) => {
    e.preventDefault();
    if (localPost?.hero_image_prompt) {
      // setModal('viewImagePrompt', true)
      setModal('viewGenerateImage', true)
    }
    else {
      setLoading('generateImagePrompt', true);
      generateImagePrompt(content_plan_outline_guid)
        .then(res => {
          setLoading('generateImagePrompt', false);
        })
    }
  }

  const generateSchemaHandler = (e) => {
    e.preventDefault();
    if (localPost?.schema_data) {
      setModal('viewSchema', true)
    }
    else {
      setLoading('generateSchema', true);
      generateSchema(content_plan_outline_guid)
        .then(res => {
          setLoading('generateSchema', false)
        })
    }
  }

  const publishToWordPressClickHandler = (e) => {
    e.preventDefault();
    setError('wordPressPublish', null);
    setLoading('wordPressPublish', true);
    setStatus('wordPressPublish', 'Publishing');
    publishToWordPress(content_plan_outline_guid)
      .then(res => {
        if (res.data) {
          setStatus('wordPressPublish', 'Published to WordPress');
        }
      })
      .catch(err => {
        setError('wordPressPublish', err?.response?.data?.message || err?.message || 'Error publishing');
        setStatus('wordPressPublish', '');
      })
      .finally(() => {
        setLoading('wordPressPublish', false);
      });
  }

  // Always open localPost.content as a full HTML document in a new tab
  const openRawHtml = (e) => {
    e.preventDefault();
    if (!localPost?.content) {
      console.log('No content available');
      return;
    }

    // Add max-width:none to body style attribute
    let htmlContent = localPost.content.toString();

    // Add CSS links to the head section
    const cssLinks = `
  <link rel="stylesheet" href="https://jsypctdhynsdqrfifvdh.supabase.co/storage/v1/object/public/cp-blog-css/global.css" />
  <link rel="stylesheet" href="https://jsypctdhynsdqrfifvdh.supabase.co/storage/v1/object/public/cp-blog-css/${localPost?.client_domain}.css" />`;

    // Look for existing head tag and add CSS links
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${cssLinks}
</head>`);
    } else if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>${cssLinks}`);
    } else if (htmlContent.includes('<head ')) {
      htmlContent = htmlContent.replace(/<head([^>]*>)/, `<head$1${cssLinks}`);
    } else {
      // No head tag, add CSS at the beginning
      htmlContent = cssLinks + htmlContent;
    }

    // Look for existing body tag with style attribute
    if (htmlContent.includes('<body') && htmlContent.includes('style=')) {
      // Find and modify existing body style
      htmlContent = htmlContent.replace(/<body([^>]*style\s*=\s*["'])([^"']*)(["'][^>]*>)/i, (match, beforeStyle, styleContent, afterStyle) => {
        // Add max-width:none to existing styles
        const updatedStyle = styleContent + (styleContent.endsWith(';') ? '' : ';') + 'max-width:none !important;width:100% !important; padding: 0 10px !important;';
        return '<body' + beforeStyle + updatedStyle + afterStyle;
      });
    } else if (htmlContent.includes('<body')) {
      // Add style attribute to body tag
      htmlContent = htmlContent.replace(/<body([^>]*)>/i, '<body$1 style="max-width:none !important;width:100% !important;">');
    } else {
      // No body tag, add styles at the beginning
      htmlContent = `<style>body { max-width: none !important; width: 100% !important; }</style>` + htmlContent;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open the blob URL in a new tab
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      console.error('Failed to open window - popup blocked?');
      URL.revokeObjectURL(url);
    }
  }

  const submitHTMLStylingHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid
    };
    setCompletion('post', false);
    return regenerateHTML(reqBody)
  };

  const regenerateOutlineClickHandler = () => {
    regenerateOutline(content_plan_outline_guid)

  }
  const submitGoogleDocRegenerateHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid
    };
    setCompletion('post', false);
    return regenerateHTMLfromDoc(reqBody)
  };

  // update functions
  const updateSchemaData = () => {
    supabase
      .from('tasks')
      .update({ schema_data: form.getState.schema_data })
      .eq('task_id', localPost?.task_id)
      .then(res => {
        if (res.status === 204) {
          setStatus('generateSchema', 'Schema Updated')
        }
      })
  }

  const saveLiveUrl = () => {
    let url = form.getState?.live_post_url
    if (url) {
      if (form.validate({ requiredFields: ['live_post_url'], validatorFields: ['live_post_url'] })) {
        updateLiveUrl(content_plan_outline_guid, url || '')
          .then(res => {
            setLocalPost({ ...localPost, live_post_url: url })
          })
      }

    }
    else {
      updateLiveUrl(content_plan_outline_guid, '')
        .then(res => {
          setLocalPost({ ...localPost, live_post_url: '' })
        })
    }

  }

  const generateOutlineHandler = (e) => {
    e.preventDefault();
    generateOutline()
    setStatus('outline', 'Generating Outline...')
  }

  const regenerateOutlineHandler = (e) => {
    e.preventDefault();
    let regenerateOther = {
      email,
      "post_title": outline?.post_title,
      "content_plan_guid": outline?.content_plan_guid
    }
    regenerateOutline(content_plan_outline_guid, regenerateOther)
      .then(res => {
        setStatus('outline', 'Regenerating Outline...')
      })
      .catch(err => {
        setError('outline', err?.response?.data?.message || err?.message || 'An error occurred')
      })
  }
  return (
    <DropdownMenu.Root>
      <div className="row d-flex g-3 w-100 justify-content-between align-items-center">
        <div className="col">
          <div className="status-bar row d-flex align-items-center justify-content-start g-0 ">
            <div className="col-auto d-flex align-items-center">
              {(statusState?.outline?.complete || (statusState?.post?.status && !statusState?.outline?.status)) ?
                <>
                  <a title="Edit Outline" className="py-0 my-0 text-primary no-underline" onClick={showEditOutlineHandler}><strong>Outline</strong></a>
                  <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
                </>
                : statusState?.outline?.error ?
                  <>
                    <strong className="text-primary me-2">Outline Generation Error</strong> {statusState?.outline?.error}
                  </>
                  : statusState?.outline?.status ?
                    <p className="mb-0 status">
                      <strong className="text-primary me-2">Outline Status</strong> {keyToLabel(statusState?.outline?.status)}
                    </p>
                    : null
              }
            </div>
            {
              statusState?.post?.status ? <div className="col-auto d-flex align-items-center">
                <i className="bi bi-chevron-right mx-1" />
                {statusState?.post?.complete ?
                  <>
                    <strong className="text-primary">Post</strong>
                    <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
                  </>
                  :
                  <p className="mb-0 status">
                    <strong className="text-primary me-2">Post Status</strong> {keyToLabel(statusState?.post?.status)}
                  </p>
                }
              </div>
                :
                (statusState?.outline?.complete && !localPost) ?
                  <div className="col-auto d-flex align-items-center">
                    <i className="bi bi-chevron-right mx-1" />
                    <div>
                      <a title="Generate Post" className=" my-0 text-success no-underline" onClick={generatePostClickHandler}>Generate Post</a>
                    </div>
                  </div>
                  : null
            }
            {(type === ContentType.POST && statusState?.post?.complete) && <>
              {
                localPost?.hero_image_prompt ? <div className="col-auto d-flex align-items-center ">
                  <i className="bi bi-chevron-right mx-1" />
                  {localPost?.hero_image_url ? <> <a onClick={generateImagePromptHandler} className="text-primary my-0 py-0 no-underline"><strong>Hero Image</strong></a>
                    <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
                  </>
                    : <a onClick={generateImagePromptHandler} className=" my-0 py-0 text-success no-underline"><i className="bi bi-plus" />Generate Image</a>}
                </div>
                  :
                  <div className="col-auto d-flex align-items-center ">
                    <i className="bi bi-chevron-right mx-1" />
                    {statusState?.generateImagePrompt?.loading ? <span className="text-primary"><TypeWriterText string="Generating" withBlink /></span> : <a onClick={generateImagePromptHandler} className=" my-0 py-0"> <span className="text-success">Generate Image Prompt</span></a>}
                  </div>}
              {!localPost?.live_post_url && <>
                <div className="col-auto d-flex align-items-center">
                  <i className="bi bi-chevron-right mx-1" />
                  {wordPressPublish && <>
                    {statusState.wordPressPublish.loading ? (
                      <span className="text-primary my-0 py-0"><TypeWriterText string="Publishing" withBlink /></span>
                    ) : statusState.wordPressPublish.status === 'Published to WordPress' ? (
                      <span className="text-primary my-0 py-0"><i className="bi bi-wordpress" /> Published</span>
                    ) : (
                      <a onClick={publishToWordPressClickHandler} className="text-success my-0 py-0 no-underline"><i className="bi bi-wordpress" /> Publish</a>
                    )}
                    {(!statusState.wordPressPublish.loading && statusState.wordPressPublish.status !== 'Published to WordPress') && <span className="px-2">or</span>}
                  </>}
                  {statusState.wordPressPublish.error && (
                    <span className="text-danger small ms-2">{statusState.wordPressPublish.error}</span>
                  )}
                  <a onClick={addLiveUrlClickHandler} className="my-0 py-0 text-success no-underline"><i className="bi bi-plus" />Add Live Url</a>
                </div>
              </>}

            </>
            }
            {
              (type === ContentType.POST && localPost?.live_post_url && statusState?.post?.complete) &&
              <div className="col-auto d-flex align-items-center">
                <i className="bi bi-chevron-right mx-1" />
                <a onClick={addLiveUrlClickHandler} className="my-0 py-0 text-primary no-underline"><strong>Live</strong></a>
                <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
              </div>
            }
            {
              statusState?.factcheck?.status && <div className="col-auto d-flex align-items-center ">
                <i className="bi bi-chevron-right mx-1" />
                {statusState?.factcheck?.complete ?
                  <>
                    <strong className="text-primary">Fact Check</strong>
                    <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
                  </>
                  :
                  <>
                    <strong className="text-primary me-2">Fact Check Status</strong> <TypeWriterText withBlink string={keyToLabel(statusState?.factcheck?.status)} />
                  </>
                }
              </div>
            }
            {
              localPost?.live_post_url && <>
                {
                  localPost?.schema_data ?
                    <div className="col-auto d-flex align-items-center ">
                      < i className="bi bi-chevron-right mx-1" />
                      <a onClick={generateSchemaHandler} className="text-primary my-0 py-0 no-underline"><strong>Schema</strong></a>
                      <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
                    </div>
                    :
                    <div className="col-auto d-flex align-items-center ">
                      <i className="bi bi-chevron-right mx-1" />
                      {statusState?.generateSchema?.loading ? <TypeWriterText string='Generating' withBlink /> : <a onClick={generateSchemaHandler} className=" my-0 py-0"><span className="text-success">Generate Schema</span></a>}
                    </div>}
                {localPost?.index_status === 'Submitted and indexed' ?
                  <div className="col-auto d-flex align-items-center ">
                    <i className="bi bi-chevron-right mx-1" />
                    <strong className="text-primary">{localPost?.index_status}</strong>
                    <span className="badge rounded-pill ms-1 p-1 bg-success"><i className="bi bi-check-lg text-white"></i></span>
                  </div>
                  : localPost?.index_status ?
                    <div className="col-auto d-flex align-items-center ">
                      <i className="bi bi-chevron-right mx-1" /><p className="status mb-0"><strong className="text-warning"> {localPost?.index_status}</strong>
                        <a onClick={indexClickHandler} className=" ms-1 my-0 py-0 text-success no-underline">Re-Index Post</a>
                      </p>
                    </div> :

                    <div className="col-auto d-flex align-items-center ">
                      <i className="bi bi-chevron-right mx-1" />
                      <a onClick={indexClickHandler} className=" my-0 py-0 text-success no-underline">Index Post</a>
                    </div>}
              </>
            }
          </div>
        </div>
        {statusState?.outline?.complete ?
          <div className="col-auto">
            <div className='row d-flex justify-content-end'>
              <div className="input-group d-flex justify-content-end">
                {(statusState?.post?.complete) &&
                  <>
                    <button
                      type="button"
                      onClick={openRawHtml}
                      className="btn btn-secondary btn-standard text-primary"
                      title="Preview HTML"
                    >
                      <i className="bi bi-eye" />
                    </button>
                    <a
                      href={localPost.html_link}
                      className="btn btn-secondary btn-standard"
                      title="HTML File"
                      target="_blank"
                    >
                      <i className="bi bi-filetype-html " />
                    </a>
                    <a
                      href={localPost.google_doc_link}
                      className="btn btn-secondary btn-standard"
                      title="Google Docs"
                      target="_blank"
                    >
                      <i className="bi bi-filetype-doc " />
                    </a>
                  </>}
                {(type !== ContentType.POST && localOutline) &&
                  <a
                    title='edit outline'
                    className="btn btn-secondary btn-standard no-truncate"
                    onClick={(e) => { e.preventDefault(); setModal('viewEdit', true) }}
                  >
                    <i className="bi bi-pencil-fill me-1" /> Edit
                  </a>
                }
                <button className='btn btn-primary btn-standard d-flex justify-content-center align-items-center' onClick={deleteClickHandler} title={`View GUID: ${content_plan_outline_guid}`}><i className="bi bi-trash pt-1" /></button>

                <DropdownMenu.Trigger className="btn btn-secondary btn-standard d-flex align-items-center justify-content-center">
                  <i className="bi bi-three-dots-vertical" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" className="bg-secondary z-100 card">
                    {localOutline?.content_plan_guid &&
                      <DropdownMenu.Item>
                        <Link
                          href={`/contentplan/${localOutline?.content_plan_guid}`}
                          className="btn btn-transparent"
                        >
                          View Content Plan
                        </Link>
                      </DropdownMenu.Item>}
                    {(localOutline) &&
                      <DropdownMenu.Item>
                        <a className="btn btn-transparent" onClick={showEditOutlineHandler}>
                          Edit Outline
                        </a>
                      </DropdownMenu.Item>}


                    {type === ContentType.POST ?
                      <>
                        {localPost?.hero_image_prompt && <DropdownMenu.Item>
                          <a className="btn btn-transparent" onClick={(e) => { e.preventDefault(); setModal('viewImagePrompt', true) }}>Show Hero Image Prompt</a>
                        </DropdownMenu.Item>
                        }
                        {localPost?.task_id && <DropdownMenu.Item>
                          <Link className="btn btn-transparent" href={`/post/${localPost?.task_id}`} target="_blank">Post Page</Link>
                        </DropdownMenu.Item>}
                        <DropdownMenu.Item>
                          <a className="btn btn-transparent" onClick={(e) => {
                            e.preventDefault();
                            setModal('viewGeneratePost', GenerateTypes.REGENERATE)
                          }}>Regenerate Post</a>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <a className="btn btn-transparent" onClick={(e) => {
                            e.preventDefault(); setModal('viewEditLiveUrl', true)
                          }}>{localPost?.live_post_url ? 'Edit' : 'Add'} Live Post URL</a>
                        </DropdownMenu.Item>
                        {localPost?.live_post_url && <>
                          {isAdmin && <>
                            {localPost?.factcheck_guid ?
                              <DropdownMenu.Item>
                                <a
                                  href={`https://factcheckPerfect.ai/fact-checks/${localPost?.factcheck_guid}`}
                                  target="_blank"
                                  className="btn btn-transparent text-primary"

                                >
                                  Fact-Check Results
                                </a>
                              </DropdownMenu.Item>
                              : <DropdownMenu.Item>
                                <a
                                  href={`https://factcheckPerfect.ai/fact-checks?url=${encodeURI(localPost?.live_post_url)}&post_guid=${content_plan_outline_guid}`}
                                  target="_blank"
                                  className="btn btn-transparent text-primary"

                                >
                                  Fact-Check Post
                                </a>
                              </DropdownMenu.Item>
                            }
                          </>}
                          {isAdmin && <DropdownMenu.Item>
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                setModal('viewIndex', true)
                              }}
                              className="btn btn-transparent"
                            >
                              Index Post
                            </a>
                          </DropdownMenu.Item>}
                          <DropdownMenu.Item>
                            <a
                              href={`https://socialperfect.ai?url=${encodeURI(localPost?.live_post_url)}`}
                              target="_blank"
                              className="btn btn-transparent text-primary"

                            >
                              Generate Social Posts
                            </a>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item>
                            <a
                              href={`https://app.ahrefs.com/v2-site-explorer/organic-keywords?columns=CPC%7C%7CKD%7C%7CLastUpdated%7C%7COrganicTraffic%7C%7CPaidTraffic%7C%7CPosition%7C%7CPositionHistory%7C%7CSERP%7C%7CSF%7C%7CURL%7C%7CVolume&compareDate=dontCompare&country=us&currentDate=today&keywordRules=&limit=100&mode=prefix&offset=0&positionChanges=&serpFeatures=&sort=Volume&sortDirection=desc&target=${encodeURI(localPost?.live_post_url.replace("https://", '').replace("http://", "").replace("www.", ""))}&urlRules=&volume_type=average`}
                              target="_blank"
                              className="btn btn-transparent text-primary"
                            >
                              AHREFs Report
                            </a>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item>
                            <a
                              href={`https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3A${urlSanitization(localPost?.live_post_url)}&hl=en&page=*${encodeURI(localPost?.live_post_url)}`}
                              target="_blank"
                              className="btn btn-transparent text-primary"

                            >
                              GSC Report
                            </a>
                          </DropdownMenu.Item>
                        </>}
                      </> :
                      <>
                        {content_plan_outline_guid && <DropdownMenu.Item>
                          <a
                            className="btn btn-transparent"
                            onClick={regenerateOutlineClickHandler}
                          >
                            Regenerate Outline
                          </a>
                        </DropdownMenu.Item>}
                        {localPost ?
                          <DropdownMenu.Item>
                            <a className="btn btn-transparent" onClick={(e) => {
                              e.preventDefault();
                              setModal('viewGeneratePost', GenerateTypes.REGENERATE)
                            }}>Regenerate Post</a>
                          </DropdownMenu.Item>
                          : <DropdownMenu.Item>
                            <a
                              className="btn btn-transparent text-primary"
                              onClick={(e) => {
                                e.preventDefault();
                                setModal('viewGeneratePost', GenerateTypes.GENERATE)
                              }}
                            >
                              Generate Post
                            </a>
                          </DropdownMenu.Item>
                        }

                      </>}
                    {isAdmin && <>
                      {(type !== ContentType.POST && content_plan_outline_guid) && <DropdownMenu.Item>
                        <a className="btn btn-transparent" onClick={copyOutlineClickHandler}>
                          Copy Outline GUID
                        </a>
                      </DropdownMenu.Item>
                      }
                      {(type === ContentType.POST && localPost?.task_id) && <DropdownMenu.Item>
                        <a className="btn btn-transparent" onClick={e => {
                          e.preventDefault(); copyClickHandler('task_id')
                        }}>
                          Copy Post GUID
                        </a>
                      </DropdownMenu.Item>
                      }
                      {(type === ContentType.POST && content_plan_outline_guid) && <DropdownMenu.Item>
                        <a className="btn btn-transparent" onClick={copyOutlineClickHandler}>
                          Copy Outline GUID
                        </a>
                      </DropdownMenu.Item>
                      }
                    </>
                    }
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </div>
              {statusState?.regenerate?.error && <div className='col-12 text-end text-primary mt-2'>
                <TypeWriterText string={statusState?.regenerate?.error} withBlink />
              </div>}
            </div>
          </div> : (generateOutline && type === ContentType.PLAN && !statusState?.outline?.loading) ?
            <div className="col-auto">
              <button className="btn btn-primary" onClick={generateOutlineHandler}>{statusState?.outline?.loading || (statusState?.outline?.status && !statusState?.outline?.complete) ? 'Generating...' : 'Generate Outline'}</button>
            </div> : !statusState?.outline?.loading ?
              <div className="input-group">
                <Link
                  href={`/contentplan/${localOutline?.content_plan_guid}`}
                  className="btn btn-secondary"
                >
                  View Content Plan
                </Link>
                <button className="btn btn-primary" onClick={regenerateOutlineHandler}>{statusState?.outline?.loading || (statusState?.outline?.status && !statusState?.outline?.complete) ? 'generating...' : 'Regenerate Outline'}</button>
              </div>
              : null}
      </div >
      {/* Modals  */}
      < Form controller={form} >
        <Modal.Overlay open={modals.viewSchema} onClose={closeModals} closeIcon>
          <Modal.Title title="Schema" />
          <Modal.Description className="modal-medium">
            <TextArea fieldName="schema_data" label="Schema" hint={`Here's the proper markup to put between your opening script tag of <script type="application/ld+json"> and closing script tag of </script>`} />
            <div className="row d-flex justify-content-between align-items-center g-0">
              <div className="col-auto d-flex align-items-center">
                <button onClick={(e) => {
                  e.preventDefault();
                  copyClickHandler('schema_data')
                }
                } className="btn btn-primary me-2" type="button"><i className="bi bi-copy me-2" />Copy</button>
              </div>
              {statusState?.generateSchema?.status !== '' && <div className="col-auto d-flex align-items-center">
                <span className=""><TypeWriterText string={statusState?.generateSchema?.status} withBlink /></span>
              </div>}
              <div className="col-auto d-flex align-items-center">
                <input type="submit" onClick={updateSchemaData} className="btn btn-primary" value="Update Schema" />
              </div>
            </div>
          </Modal.Description>
        </Modal.Overlay>
        <Modal.Overlay closeIcon open={modals.viewEditLiveUrl} onClose={closeModals} className="modal-small">
          <Modal.Title title="Add Live URL" />
          <div className="card p-3 w-100">
            <TextInput fieldName="live_post_url" label="Live URL" validator={urlValidator} required
              button={<button className="btn btn-primary" onClick={saveLiveUrl} type="submit" ><i className="bi bi-floppy-fill" /></button>} />
          </div>
        </Modal.Overlay>

      </Form >
      {/* Modals  */}
      <Modal.Overlay open={modals?.viewDeletePost} onClose={closeModals}>
        <Modal.Title title="Delete Post" />
        <Modal.Description>
          Are you sure you want to delete this post?
          <div className='d-flex justify-content-between mt-5'>
            <button onClick={closeModals} className="btn btn-transparent">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); deletePostHandler() }} className="btn btn-primary">Yes</button>
          </div>
        </Modal.Description>
      </Modal.Overlay>
      <Modal.Overlay open={modals?.viewDeleteOutline} onClose={closeModals}>
        <Modal.Title title="Delete Post" />
        <Modal.Description>
          Are you sure you want to delete this post?
          <div className='d-flex justify-content-between mt-5'>
            <button onClick={closeModals} className="btn btn-transparent">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); deletePostHandler() }} className="btn btn-primary">Yes</button>
          </div>
        </Modal.Description>
      </Modal.Overlay>
      <Modal.Overlay
        open={modals.viewGeneratePost !== null}
        onClose={closeModals}
      >
        <Modal.Description>

          <RegeneratePostModal title={localPost?.title || localOutline?.post_title} submitHTMLStylingHandler={submitHTMLStylingHandler}
            submitGoogleDocRegenerateHandler={submitGoogleDocRegenerateHandler} onClose={closeModals} type={modals?.viewGeneratePost} submitHandler={generateModalClickHandler} onSuccess={closeModals} />
        </Modal.Description>
      </Modal.Overlay>
      {/* <Modal.Overlay closeIcon open={modals?.viewFactcheck} onClose={closeModals}>
            <div className="modal-body">
              {localPost?.factcheck_guid ?
                <FactCheckResultPage isModal uuid={localPost?.factcheck_guid} />
                :
                <FactCheckModal onClose={
                  () => {
                    setShowFactCheckModal(false)
                  }
                } post={localPost} setLocalPost={setlocalPost} />
              }
            </div>
          </Modal.Overlay> */}
      <Modal.Overlay closeIcon open={modals?.viewImagePrompt} onClose={closeModals}>
        <div className="card p-3">
          {localPost?.hero_image_prompt && <div className="card-body">
            <h5 className="card-title">Image Generation Prompt</h5>
            <pre className="card p-1 bg-secondary">{localPost?.hero_image_prompt}</pre>
            <button className="btn btn-primary mt-1" onClick={e => {
              e.preventDefault()
              copyClickHandler('hero_image_prompt')
            }}><i className="bi bi-copy" />Copy</button>
          </div>
          }
          {localPost?.hero_image_thinking && <div className="card-body">
            <h5 className="card-title">Image Generation Prompt</h5>
            <pre className="card p-1 bg-secondary">{localPost?.hero_image_thinking}</pre>
            <button className="btn btn-primary mt-1" onClick={e => {
              e.preventDefault()
              copyClickHandler('hero_image_thinking')
            }}><i className="bi bi-copy" />Copy</button>
          </div>
          }
        </div>
      </Modal.Overlay>
      <Modal.Overlay open={modals.viewGenerateImage} onClose={closeModals} closeIcon>
        <HeroImageGenerator hero_image_prompt={localPost?.hero_image_prompt} hero_image_url={localPost?.hero_image_url} task_id={localPost?.task_id} guid={content_plan_outline_guid} />
      </Modal.Overlay>
      <Modal.Overlay closeIcon open={modals?.viewIndex} onClose={closeModals}>
        <div className="modal-body">
          <IndexModal post={localPost} setPost={setLocalPost} onClose={closeModals} />
        </div>
      </Modal.Overlay>
      <Modal.Overlay open={modals?.viewEdit} onClose={closeModals}>
        <CreateContentModal regenerateHandler={closeModals} standalone data={localOutline} titleChange={() => { }} onClose={closeModals} isAuthorized={true} />
      </Modal.Overlay>

    </DropdownMenu.Root>
  )

}
export default StatusActionBar