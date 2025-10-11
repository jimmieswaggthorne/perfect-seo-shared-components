/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import styles from "./CreateContentModal.module.scss";
import OutlineRow from "./OutlineRow/OutlineRow";
import { OutlineRowProps } from '@/perfect-seo-shared-components/data/types'
import useForm from "@/perfect-seo-shared-components/hooks/useForm";
import Form from "@/perfect-seo-shared-components/components/Form/Form";
import * as Modal from "@/perfect-seo-shared-components/components/Modal/Modal";
import TextInput from "@/perfect-seo-shared-components/components/Form/TextInput";
import useViewport from "@/perfect-seo-shared-components/hooks/useViewport";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { GenerateContentPost, GetPostOutlineRequest, RegeneratePost, SaveContentPost } from "@/perfect-seo-shared-components/data/requestTypes";
import { fetchOutlineData, patchOutlineTitle, regenerateHTML, regenerateHTMLfromDoc, saveContentPlanPost } from "@/perfect-seo-shared-components/services/services";
import { createPost, regenerateOutline } from "@/perfect-seo-shared-components/services/services";
import Loader from "@/perfect-seo-shared-components/components/Loader/Loader";
import { selectEmail } from "@/perfect-seo-shared-components/lib/features/User";
import RegeneratePostModal, { GenerateTypes } from "../RegeneratePostModal/RegeneratePostModal";
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client";

interface CreateContentModalProps {
  data: any;
  advancedData?: any;
  onClose: () => void;
  contentPlan?: any;
  titleChange?: (e: any, title: string, index: number) => any;
  index?: number;
  regenerateHandler: () => void
  isAuthorized: boolean;
  standalone?: boolean;
  track?: boolean;
  generatePost?: boolean
}

const CreateContentModal = ({
  data,
  onClose,
  contentPlan,
  isAuthorized,
  regenerateHandler,
  standalone,
  generatePost,
}: CreateContentModalProps) => {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<OutlineRowProps[]>(null);
  const [selected, setSelected] = useState<number>(null);
  const [all, setAll] = useState<boolean>(true);
  const [outlineGUID, setOutlineGUID] = useState<string>(null);
  const form = useForm();
  const [postTitle, setPostTitle] = useState();
  const titleForm = useForm();
  const { phone, portrait } = useViewport();
  const [creatingPost, setCreatingPost] = useState(generatePost || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const email = useSelector(selectEmail)
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('generate');
  const pathname = usePathname()
  const supabase = createClient();

  const closeHandler = (e?) => {
    if (e) {
      e.preventDefault();
    }
    form.setState({});
    onClose();
  }

  useEffect(() => {
    if (data?.post_title || data?.["Post Title"] || data?.title) {
      titleForm.setState({ title: data["Post Title"] || data?.post_title || data?.title });
      setPostTitle(data["Post Title"] || data?.post_title || data?.title);
    }
    if (data?.outline?.guid) {
      setOutlineGUID(data.outline.guid)
    }
  }, [data]);

  const postClickHandler = (e) => {
    e.preventDefault();
    setCreatingPost(true);
  };

  useEffect(() => {
    if (queryParam) {
      setCreatingPost(true);
      router.replace(pathname);
    }
  }, [queryParam]);

  const titleChangeHandler = (e?) => {
    if (e) {
      e.preventDefault();
    }
    setSaving(true)
    patchOutlineTitle(outlineGUID, titleForm.getState.title)
      .then(res => {
        setSaved(true);
        setSaving(false);
      })
      .catch(err => {
        setSaving(false)

      }
      )
  }


  const TitleSaveButton = () => {
    if (!isAuthorized) return ''
    return (
      <div className="d-flex h-100 align-items-center justify-content-center">
        <button className="btn btn-transparent text-primary d-flex align-items-center justify-content-center" onClick={titleChangeHandler} title="Save Live Url" disabled={saving}>

          {saving ?
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div> : saved ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-floppy-fill" />}</button>
      </div>
    )
  }

  const processSections = (data, initial?) => {
    if (!data?.length) {
      return form.setState({})
    }
    let newFormData = data?.reduce((prev, curr, i) => {
      let newHeadingData = { [`heading-${i}`]: curr.title };
      let newSubheadingData = curr.subheadings.reduce((sPrev, sCurr, sI) => {
        let newSubheadingObject = { [`${i}-subheading-${sI}`]: sCurr };

        return { ...sPrev, ...newSubheadingObject };
      }, {});

      return { ...prev, ...newHeadingData, ...newSubheadingData };
    }, {});
    setTableData(data);
    setLoading(false)
    if (initial) {
      form.setState(newFormData);
    }
  };

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    let newTableData = convertToTableData(form.getState);
    newTableData.splice(
      targetRowIndex,
      0,
      newTableData.splice(draggedRowIndex, 1)[0],
    );
    processSections([...newTableData], true);
  };

  const reorderSubheadingRow = (
    draggedRowIndex: number,
    targetRowIndex: number,
    arrayIndex: number,
  ) => {
    let newTableData = convertToTableData(form.getState);
    let newSubheadings = newTableData[arrayIndex].subheadings as string[];

    newSubheadings.splice(
      targetRowIndex,
      0,
      newSubheadings.splice(draggedRowIndex, 1)[0],
    );
    newTableData[arrayIndex].subheadings = [...newSubheadings];

    processSections(newTableData, true);
  };

  const convertToTableData = (object) => {
    try {
      // First get all unique heading indices
      const headingIndices = Object.keys(object)
        .filter(key => key.startsWith("heading-"))
        .map(key => key.split("-")[1]);

      // Build sections properly
      return headingIndices.map(headingIndex => {
        // Get the title for this heading
        const title = object[`heading-${headingIndex}`] || '';

        // Find all subheadings for this heading
        const subheadingPattern = new RegExp(`^${headingIndex}-subheading-\\d+$`);
        const subheadingKeys = Object.keys(object)
          .filter(key => subheadingPattern.test(key))
          .sort((a, b) => {
            const aIndex = parseInt(a.split('-')[2]);
            const bIndex = parseInt(b.split('-')[2]);
            return aIndex - bIndex;
          });

        // Map subheadings to strings, ensuring no null or undefined values
        const subheadings = subheadingKeys.map(key => object[key] || '');

        // Ensure we have at least one subheading, even if empty
        if (subheadings.length === 0) {
          subheadings.push('');
        }

        return {
          title,
          subheadings
        };
      });
    } catch (error) {
      console.error('Error converting form data to table data:', error);
      // Return a minimal valid structure to prevent crashes
      return [{ title: '', subheadings: [''] }];
    }
  };

  const deleteSubheading = (headingIndex: number, index: number) => {
    let newContentPlan = convertToTableData(form.getState);
    let newSubheadings = [
      ...newContentPlan[headingIndex].subheadings.slice(0, index),
      ...newContentPlan[headingIndex].subheadings.slice(index + 1),
    ];
    newContentPlan[headingIndex].subheadings = newSubheadings as string[];
    processSections(newContentPlan, true);
  };

  const deleteHeading = (index: number) => {
    let newTableData = convertToTableData(form.getState);
    let newContentPlan = [
      ...newTableData.slice(0, index),
      ...newTableData.slice(index + 1),
    ];
    processSections(newContentPlan, true);
  };

  const addSectionHandler = () => {
    let blankRow = {
      title: "",
      subheadings: [""],
    };
    let newformData = convertToTableData(form.getState);

    processSections([blankRow, ...newformData], true);
  };

  const pullOutline = (initial?) => {
    setLoading(true);
    let guid = data?.outline?.guid || data.guid;
    if (guid) {
      setOutlineGUID(guid)
    }

    fetchOutlineData(guid)
      .then(res => {
        if (res.data[0]?.outline) {
          let outline = JSON.parse(res.data[0].outline)
          if (outline?.sections?.length > 0) {
            processSections(outline.sections, initial);
            setLoading(false)
          }
        }
      })
  };

  useEffect(() => {
    if (contentPlan || standalone) {
      pullOutline(true);
    }
  }, [contentPlan, standalone]);


  const saveHandler = (click?: boolean) => {
    setSaving(true)
    if (!loading) {
      titleChangeHandler()
      let reqBody: SaveContentPost = {
        post_title: postTitle,
        outline_details: { sections: [...convertToTableData(form.getState)] },
        content_plan_guid: contentPlan?.guid || data?.content_plan_guid,
        client_name: contentPlan?.brand_name || contentPlan?.client_name || data?.client_name || data?.brand_name || data?.client_name,
        client_domain: contentPlan?.domain_name || contentPlan?.client_domain || data?.client_domain || data?.domain,
      };
      if (outlineGUID !== contentPlan?.guid) {
        reqBody.guid = outlineGUID;
      }
      if (reqBody?.outline_details?.sections?.length === 0) {
        return console.log('No data to save', reqBody.outline_details)
      }
      saveContentPlanPost(reqBody)
        .then((res) => {
          setSaving(false);
          if (click) {
            setSaved(true);
          }
        })
        .catch((err) => {
          setSaving(false);
        });
    }
  };

  const postClickSaveHandler = (e?) => {
    e?.preventDefault();
    setSaved(false);
    setSaving(true);
    saveHandler(true);
  };


  const submitWithEmail = (receivingEmail, language?) => {
    let reqBody: GenerateContentPost = {
      email: email,
      entity_voice: contentPlan?.entity_voice,
      content_plan_outline_guid: outlineGUID,
      receiving_email: receivingEmail,
      writing_language: language || 'English'
    };

    return createPost(reqBody)

  };

  const submitHTMLStylingHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid: outlineGUID,
    };

    return regenerateHTML(reqBody)
  };
  const submitGoogleDocRegenerateHandler = (receivingEmail, language?) => {
    let reqBody: RegeneratePost = {
      email: email,
      receiving_email: receivingEmail,
      content_plan_outline_guid: outlineGUID,
    };

    return regenerateHTMLfromDoc(reqBody)
  };

  const regenerateClickHandler = () => {
    setLoading(true);
    regenerateOutline(
      outlineGUID,
      { email: email, client_domain: contentPlan?.domain_name || contentPlan?.client_domain, client_name: contentPlan?.brand_name || contentPlan?.client_name, post_title: postTitle, content_plan_guid: contentPlan?.guid || data.content_plan_guid }
    )
      .then((result) => {
        regenerateHandler();
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const addSubheading = (i: number) => {
    let newTableData = convertToTableData(form.getState);
    let newArray = newTableData[i].subheadings;
    newArray = [...(newArray as string[]), ""];
    newTableData[i].subheadings = newArray;
    processSections(newTableData, true);
  };

  const buyCreditsHandler = () => {
    window.open("/my-credits", "_blank");
  };

  return (
    <>
      <Modal.Title title={postTitle} className={styles.header}>
        <h2 className="modal-title text-white" id="outlineEditorModalLabel">
          Review/Edit Your Outline
        </h2>
        <button
          className={`${styles.closeButton}
        btn
        btn-secondary`}
          data-bs-dismiss="modal"
          aria-label="Close"
          onClick={closeHandler}
        >
          x
        </button>
      </Modal.Title>
      <Modal.Description>
        <div className={styles.modal}>
          {loading ? (
            <Loader />
          ) : (
            <div className={styles.content}>
              <div className="modal-body p-3">
                <p>
                  <b>Please review and edit the outline provided below</b>.
                </p>
                <p>
                  {isAuthorized ? 'You' : 'Users'} can directly modify the content, rearrange sections or subsections through drag and drop, remove any parts, or add new elements as needed.
                </p>
                {isAuthorized ? <p>
                  After finalizing the outline to your satisfaction,<strong className="mx-1 text-primary">
                    save your changes
                  </strong>. Then, to generate the post based on this outline, click on
                  <strong className="mx-1 text-primary">
                    create post
                  </strong>
                  located in the bottom right corner.
                </p> : <>
                  <p>Sign up or login to make changes to this outline!
                  </p><p className="text-primary"><small><i>*contentPerfect.ai uses <a href="https://www.google.com/sitemaps" target="_blank">Google Search Console</a> to confirm domain ownership. Please make sure you have access to the content plans domain for access</i></small></p>
                </>
                }
                <Form controller={titleForm}>
                  <div className="p-2">
                    <TextInput
                      fieldName="title"
                      label="Post Title"
                      disabled={!isAuthorized || saving}
                      button={<TitleSaveButton />}
                    />
                  </div>
                </Form>
                <hr />
                <div className={styles.utilityBar}>
                  <div className={styles.utilityBarGroup}>
                    <button
                      className="btn btn-primary"
                      disabled={!isAuthorized}
                      onClick={(e) => {
                        e.preventDefault();
                        regenerateClickHandler();
                      }}
                    >
                      regenerate outline
                    </button>
                    <button
                      disabled={!isAuthorized}
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        addSectionHandler();
                      }}
                    >
                      + add section
                    </button>
                  </div>
                  <div className={styles.utilityBarGroup}>
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        setAll(false);
                      }}
                    >
                      collapse all
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        setAll(true);
                      }}
                    >
                      expand all
                    </button>
                  </div>
                </div>
                <hr />
              </div>

              <Form controller={form}>
                <div className={styles.contentForm}>
                  {tableData?.length > 0 ? (
                    tableData.map((heading: OutlineRowProps, i) => {
                      return (
                        <OutlineRow
                          addSubheading={addSubheading}
                          deleteHeadingHandler={deleteHeading}
                          deleteSubheadingHandler={deleteSubheading}
                          reorderSubheadingRow={reorderSubheadingRow}
                          reorderRow={reorderRow}
                          isAuthorized={isAuthorized}
                          setSelected={setSelected}
                          selected={selected}
                          index={i}
                          rows={heading?.subheadings?.length}
                          key={`heading-${i}`}
                          all={all}
                        />
                      );
                    })
                  ) : (
                    <span>This outline has no data</span>
                  )}
                </div>
              </Form>
            </div>
          )}
        </div>
      </Modal.Description>
      <Modal.Footer className={styles.footer}>
        {phone && portrait && (
          <span className={styles.warning}>
            Rotate your phone for the best content creation experience
          </span>
        )}
        <div className={styles.footerButtons}>
          <button
            className={`${styles.closeButton} btn btn-secondary text-light`}
            data-bs-dismiss="modal"
            aria-label="Close"
            onClick={closeHandler}
          >
            x
          </button>
          <div className={styles.footerButtonsGroup}>
            <button
              id="createContentBtn2"
              className="btn btn-primary"
              onClick={postClickSaveHandler}
              disabled={!isAuthorized || saving}
            >
              {saved ? "saved" : saving ? null : "save outline"}
              {saving && (
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
            </button>
            <button
              id="createContentBtn2"
              className="btn btn-primary"
              disabled={!isAuthorized}
              onClick={postClickHandler}
            >
              create post
            </button>
          </div>
        </div>
      </Modal.Footer>
      <Modal.Overlay
        open={creatingPost}
        onClose={() => setCreatingPost(false)}
        closeIcon
      >
        <Modal.Title title="Generate Your Post" />
        <RegeneratePostModal title={data?.title} submitGoogleDocRegenerateHandler={submitGoogleDocRegenerateHandler} submitHTMLStylingHandler={submitHTMLStylingHandler} submitHandler={submitWithEmail} onClose={() => setCreatingPost(false)} onSuccess={onClose} type={GenerateTypes.GENERATE} />
      </Modal.Overlay >
    </>
  );
};

export default CreateContentModal;
