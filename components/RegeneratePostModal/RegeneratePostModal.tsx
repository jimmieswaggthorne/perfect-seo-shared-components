'use client'
import * as Modal from "@/perfect-seo-shared-components/components/Modal/Modal";
import { selectEmail, selectPoints } from "@/perfect-seo-shared-components/lib/features/User";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SearchSelect from "../SearchSelect/SearchSelect";
import { Option, Select } from "../Form/Select";
import useForm from "@/perfect-seo-shared-components/hooks/useForm";
import Form from "../Form/Form";
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client";
import en from "@/assets/en.json";

export enum GenerateTypes {
  REGENERATE,
  GENERATE
}

export enum GenerationTypes {
  REGENERATE_ALL,
  REGENERATE_STYLE,
  REGENERATE_CONTENT
}

interface RegeneratePostModalProps {
  onClose: () => void;
  submitHandler: (email, language?: string) => Promise<any>
  type: GenerateTypes;
  onSuccess: () => void;
  submitHTMLStylingHandler: (email, language?: string) => Promise<any>;
  submitGoogleDocRegenerateHandler: (email, language?: string) => Promise<any>;
  title: string;
}

const RegeneratePostModal = ({ onClose, type, submitHandler, onSuccess, submitHTMLStylingHandler, submitGoogleDocRegenerateHandler, title }: RegeneratePostModalProps) => {
  const points = useSelector(selectPoints)
  const [showConfirm, setShowConfirm] = useState(false)
  const email = useSelector(selectEmail)
  const [receivingEmail, setReceivingEmail] = useState(undefined);
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
    let timeout;
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

  const supabase = createClient();

  const generatePostHandler = () => {
    setSubmitError(null)
    setSubmitted(true)
    let type = form.getState['generation-type']
    // supabase
    //   .from('tasks')
    //   .update({ 'live_post_url': null })
    //   .eq('post_title', title)
    switch (type) {
      case 'all':
        return submitHandler(receivingEmail, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            supabase
              .from('user_history')
              .insert({ email: email, transaction_data: err, product: en.product, type: "ERROR", action: "Regenerate All Error" })
              .select('*')
              .then(res => { })
            console.log(err);
            setSubmitError(err.response?.data?.detail || "There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });
      case 'style':
        return submitHTMLStylingHandler(receivingEmail, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            setSubmitError(err.response?.data?.detail || "There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });
      case 'content':
        return submitGoogleDocRegenerateHandler(receivingEmail, langSelected.value)
          .then(() => {
            setShowConfirm(true);
            setSubmitted(false)
          })
          .catch((err) => {
            setSubmitError(err.response?.data?.detail || "There was an error submitting your post. Please try again.")
            setSubmitted(false)
          });

      default:
        return submitHandler(receivingEmail, langSelected.value)
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

  const [submitError, setSubmitError] = useState<string>();
  const [langSelected, setLangSelected] = useState({ label: 'English', value: 'English' });


  const languageChangeHandler = (e) => {
    setLangSelected(e);
  }

  const renderHint = () => {
    let type = form.getState['generation-type']
    switch (type) {
      case 'all':
        return 'Regenerate the post from outline.';
      case 'style':
        return 'Update the HTML styling of the post. Use this when you have made changes to your post templates in preferencesPerfect.ai and want to apply them to this post.';
      case 'content':
        return 'Update the content of the post from the Google Doc. Use this when you have made changes to the Google Doc and want to apply them to this post.';
      default:
        return 'Regenerate this post from the outline.'
    }
  }

  return (
    <>  <Modal.Title title="Generate Your Post" />
      <div className="p-5 modal-medium pb-0">
        <h3 className="mb-3">{regenerate ? 'Reg' : 'G'}enerate Your Post{title &&
          <span> for {title}</span>}</h3>
        {regenerate ? <div className="my-4">
          Would you like to regenerate this post?
        </div>
          : <div className="my-4">
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
        }
        {(points >= 3000 || regenerate) && <div className="my-4">
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
            <SearchSelect value={langSelected} onChange={languageChangeHandler} options={languageOptions} fieldName="writing_language z-100" isClearable={false} isSearchable={true} />
          </div>
          {type === GenerateTypes.REGENERATE &&
            <div className="mt-3">
              <label htmlFor="generation-type">Regeneration Type</label>
              <Form controller={form}>
                <Select fieldName="generation-type" bottomSpacing={false}>
                  <Option value='all'>Regenerate Full Post</Option>
                  <Option value='style'>Update HTML Doc Styling</Option>
                  <Option value='content'>Update Content from Google Doc</Option>
                </Select>
                <p className="mb-0 mt-1"><small><strong>{renderHint()}</strong></small></p>
              </Form>
            </div>}
          {submitError && <p className="text-danger mt-3">{submitError}</p>}
        </div>}
      </div >
      <Modal.Footer>
        <Modal.ButtonBar>
          <button
            className="btn btn-secondary btn-standard"
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
              if (regenerate || points > 3000) {
                generatePostHandler()
              }
              else {
                buyCreditsHandler();
              }
            }}
          >
            {submitted ?
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              :
              points > 3000 ? <span className="px-3">yes</span> : "buy credits"
            }
          </button>
        </Modal.ButtonBar>
      </Modal.Footer>
      <Modal.Overlay closeIcon open={showConfirm} onClose={onClose}>
        <Modal.Title title="Post Generation" />
        <div className="p-5 d-flex flex-column align-items-center">
          <h3 className="mb-5">Your post{title && ` for ${title}`} is being generated</h3>
          <div>
            <button
              className="btn btn-secondary"
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