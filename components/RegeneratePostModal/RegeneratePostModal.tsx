'use client'
import * as Modal from "@/perfect-seo-shared-components/components/Modal/Modal";
import { selectEmail, selectPoints } from "@/perfect-seo-shared-components/lib/features/User";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SearchSelect from "../SearchSelect/SearchSelect";
import { Option, Select } from "../Form/Select";
import useForm from "@/perfect-seo-shared-components/hooks/useForm";
import Form from "../Form/Form";
import { regenerateHtmlOnly, regeneratePostJson } from "@/perfect-seo-shared-components/services/services";

export enum GenerateTypes {
  REGENERATE,
  GENERATE
}

export enum GenerationTypes {
  REGNERATE_ALL = 'all',
  REGENERATE_HTML_ONLY = 'html_only',
  REGENERATE_POSTJSON = 'postjson',
  REGENERATE_STYLE = 'style',
  REGENERATE_CONTENT = 'content'
}

interface RegeneratePostModalProps {
  onClose: () => void;
  submitHandler: (email: string, language?: string) => Promise<any>;
  type: GenerateTypes;
  onSuccess: () => void;
  submitHTMLStylingHandler: (email: string, language?: string) => Promise<any>;
  submitGoogleDocRegenerateHandler: (email: string, language?: string) => Promise<any>;
  contentPlanOutlineGuid?: string;
}

const RegeneratePostModal = ({
  onClose,
  type,
  submitHandler,
  onSuccess,
  submitHTMLStylingHandler,
  submitGoogleDocRegenerateHandler,
  contentPlanOutlineGuid
}: RegeneratePostModalProps) => {
  const points = useSelector(selectPoints)
  const [showConfirm, setShowConfirm] = useState(false)
  const email = useSelector(selectEmail)
  const [receivingEmail, setReceivingEmail] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const regenerate = type === GenerateTypes.REGENERATE;
  const languageOptions = [
    "English",
    "Arabic",
    "Bengali",
    "Bulgarian",
    "Chinese (Simplified)",
    "Chinese (Traditional)",
    "Czech",
    "Danish",
    "Dutch",
    "English",
    "Finnish",
    "French",
    "German",
    "Greek",
    "Hebrew",
    "Hindi",
    "Hungarian",
    "Indonesian",
    "Italian",
    "Japanese",
    "Korean",
    "Malay",
    "Norwegian",
    "Polish",
    "Portuguese",
    "Romanian",
    "Russian",
    "Slovak",
    "Spanish",
    "Swedish",
    "Thai",
    "Turkish",
    "Ukrainian",
    "Urdu",
    "Vietnamese"
  ].map((language) => ({ label: language, value: language }))

  const form = useForm();

  useEffect(() => {
    if (email) {
      setReceivingEmail(email);
    }
  }, [email]);

  useEffect(() => {
    if (type === GenerateTypes.REGENERATE) {
      form.setState({ 'generation-type': 'all' })
    }
  }, [type]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (submitted) {
      timeout = setTimeout(() => {
        setSubmitted(false)
        setSubmitError("There was an error submitting your post. Please try again.")
      }, 30000)
    }
    return () => {
      clearTimeout(timeout)
    }
  }, [submitted])

  const generatePostHandler = () => {
    setSubmitError(null)
    setSubmitted(true)
    let generationType = form.getState['generation-type']

    switch (generationType) {
      case 'all':
        // Full regeneration from outline
        return submitHandler(receivingEmail!, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            console.log(err);
            setSubmitError(err.response?.data?.detail || "There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });

      case 'html_only':
        // Regenerate HTML only from existing post_json (new Cloudflare endpoint)
        if (!contentPlanOutlineGuid) {
          setSubmitError("Missing content plan outline GUID");
          setSubmitted(false);
          return;
        }
        return regenerateHtmlOnly(contentPlanOutlineGuid)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            setSubmitError(err.response?.data?.error || err.response?.data?.detail || "Failed to regenerate HTML. Please try again.")
            setSubmitted(false)
          });

      case 'postjson':
        // Re-parse markdown to post_json, then regenerate HTML (new Cloudflare endpoint)
        if (!contentPlanOutlineGuid) {
          setSubmitError("Missing content plan outline GUID");
          setSubmitted(false);
          return;
        }
        return regeneratePostJson(contentPlanOutlineGuid)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            setSubmitError(err.response?.data?.error || err.response?.data?.detail || "Failed to regenerate post JSON. Please try again.")
            setSubmitted(false)
          });

      case 'style':
        // Legacy: Update HTML styling
        return submitHTMLStylingHandler(receivingEmail!, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            setSubmitError(err.response?.data?.detail || "There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });

      case 'content':
        // Update from Google Doc
        return submitGoogleDocRegenerateHandler(receivingEmail!, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            setSubmitError(err.response?.data?.detail || "There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });

      default:
        return submitHandler(receivingEmail!, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch(() => {
            setSubmitError("There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });
    }
  }

  const buyCreditsHandler = () => {
    window.open("/my-credits", "_blank");
  };

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [langSelected, setLangSelected] = useState({ label: 'English', value: 'English' });

  const languageChangeHandler = (e: { label: string; value: string }) => {
    setLangSelected(e);
  }

  const renderHint = () => {
    let generationType = form.getState['generation-type']
    switch (generationType) {
      case 'all':
        return 'Complete regeneration - re-runs the entire content pipeline from research through publishing.';
      case 'html_only':
        return 'Quick HTML refresh - keeps your content structure (post_json) and just re-renders the HTML. Use when templates or styling changed.';
      case 'postjson':
        return 'Re-parse content structure - converts your edited markdown back to structured JSON (fixing citations, references, sections) then renders HTML.';
      case 'style':
        return 'Legacy: Apply template changes from preferencesPerfect.ai to this post.';
      case 'content':
        return 'Sync from Google Doc - fetches the latest content from the linked Google Doc and regenerates.';
      default:
        return 'Regenerate this post from the outline.'
    }
  }

  // Check if selected option requires credits
  const requiresCredits = () => {
    const generationType = form.getState['generation-type'];
    // html_only and postjson are quick operations that don't require credits
    return generationType === 'all' || generationType === 'style' || generationType === 'content';
  }

  // Check if selected option requires email
  const requiresEmail = () => {
    const generationType = form.getState['generation-type'];
    // html_only and postjson don't send emails
    return generationType !== 'html_only' && generationType !== 'postjson';
  }

  return (
    <>
      <Modal.Title title="Generate Your Post" />
      <div className="p-5 modal-medium pb-0">
        <h3 className="mb-3">{regenerate ? 'Reg' : 'G'}enerate Your Post</h3>
        {regenerate ? (
          <div className="my-4">
            Choose how you want to regenerate this post:
          </div>
        ) : (
          <div className="my-4">
            You currently have <strong className="text-primary mx-0">{points?.toLocaleString() || 0}</strong> credits available.
            {points <= 3000 ? (
              <>
                You need at least <strong className="text-primary mx-1">3,000</strong> credits to
                generate this post.
              </>
            ) : (
              <>
                This post generation will use <strong className="text-primary mx-1">3,000</strong> credits.
              </>
            )}
            {points <= 3000 ? (
              <p className="mt-3">Would you like to purchase more credits?</p>
            ) : (
              <p className="mt-3">
                Would you like to use <strong className="text-primary mx-1">3,000</strong> credits to
                generate this post?
              </p>
            )}
          </div>
        )}

        {(points >= 3000 || regenerate) && (
          <div className="my-4">
            {type === GenerateTypes.REGENERATE && (
              <div className="mb-3">
                <label htmlFor="generation-type" className="form-label fw-bold">Regeneration Type</label>
                <Form controller={form}>
                  <Select fieldName="generation-type" bottomSpacing={false}>
                    <Option value='all'>Regenerate Full Post</Option>
                    <Option value='html_only'>Regenerate HTML Only (Quick)</Option>
                    <Option value='postjson'>Re-parse Markdown &amp; Regenerate HTML</Option>
                    <Option value='content'>Update Content from Google Doc</Option>
                    <Option value='style'>Update HTML Styling (Legacy)</Option>
                  </Select>
                  <div className="alert alert-info mt-2 mb-0 py-2">
                    <small><i className="bi bi-info-circle me-2"></i>{renderHint()}</small>
                  </div>
                </Form>
              </div>
            )}

            {requiresEmail() && (
              <>
                <p>What email address would you like your post sent to?</p>
                <input
                  type="text"
                  className="form-control"
                  value={receivingEmail}
                  onChange={(e) => {
                    e.preventDefault();
                    setReceivingEmail(e.target.value);
                  }}
                />
                <div className="mt-3">
                  <label htmlFor="writing_language">Writing Language</label>
                  <SearchSelect
                    value={langSelected}
                    onChange={languageChangeHandler}
                    options={languageOptions}
                    fieldName="writing_language z-100"
                    isClearable={false}
                    isSearchable={true}
                  />
                </div>
              </>
            )}

            {!requiresCredits() && type === GenerateTypes.REGENERATE && (
              <div className="alert alert-success mt-3 mb-0 py-2">
                <small><i className="bi bi-lightning-charge me-2"></i>This option is free and runs instantly!</small>
              </div>
            )}

            {submitError && <p className="text-danger mt-3">{submitError}</p>}
          </div>
        )}
      </div>

      <Modal.Footer>
        <Modal.ButtonBar>
          <button
            className="btn btn-warning btn-standard"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            go back
          </button>
          <button
            className="btn btn-primary btn-standard"
            onClick={(e) => {
              e.preventDefault();
              if (submitted) {
                return;
              }
              if (regenerate || points > 3000 || !requiresCredits()) {
                generatePostHandler()
              } else {
                buyCreditsHandler();
              }
            }}
          >
            {submitted ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              points > 3000 || !requiresCredits() ? <span className="px-3">yes</span> : "buy credits"
            )}
          </button>
        </Modal.ButtonBar>
      </Modal.Footer>

      <Modal.Overlay closeIcon open={showConfirm} onClose={onClose}>
        <Modal.Title title="Post Generation" />
        <div className="p-5 d-flex flex-column align-items-center">
          <h3 className="mb-5">Your post is being regenerated</h3>
          <p className="text-muted mb-4">
            {form.getState['generation-type'] === 'html_only' || form.getState['generation-type'] === 'postjson'
              ? 'This should complete in a few seconds. Refresh the page to see the updated content.'
              : 'You will receive an email when the generation is complete.'}
          </p>
          <div>
            <button
              className="btn btn-warning"
              onClick={(e) => {
                e.preventDefault();
                setShowConfirm(false);
                onSuccess();
              }}
            >
              close
            </button>
          </div>
        </div>
      </Modal.Overlay>
    </>
  )
}
export default RegeneratePostModal
