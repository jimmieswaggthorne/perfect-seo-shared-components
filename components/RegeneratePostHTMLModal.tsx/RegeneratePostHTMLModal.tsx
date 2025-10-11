'use client'
import * as Modal from "@/perfect-seo-shared-components/components/Modal/Modal";
import { selectEmail } from "@/perfect-seo-shared-components/lib/features/User";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import FormLabel from "../Form/FormLabel";

export enum GenerateTypes {
  REGENERATE,
  GENERATE
}

interface RegeneratePostHTMLModalProps {
  onClose: () => void;
  submitHandler: (receivingEmail) => Promise<any>
  onSuccess: () => void;
}

const RegeneratePostHTMLModal = ({ onClose, submitHandler, onSuccess }: RegeneratePostHTMLModalProps) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const email = useSelector(selectEmail)
  const [receivingEmail, setReceivingEmail] = useState(undefined);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (email) {
      setReceivingEmail(email);
    }
  }, [email]);


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

  const regeneratePostHTML = () => {
    setSubmitError(null)
    setSubmitted(true)
    submitHandler(receivingEmail)
      .then(() => {
        setShowConfirm(true);
        setSubmitted(false)
      })
      .catch(() => {
        setSubmitError("There was an error submitting your post. Please try again.")
        setSubmitted(false)
      });
  }



  const [submitError, setSubmitError] = useState("");




  return (
    <>  <Modal.Title title="Generate Your Post" />
      <div className="p-5 pb-2">
        <h3 className="mb-3">Regenerate Post HTML</h3>
        <div className="my-4">
          Would you like to regenerate the HTML build of this post?
        </div>


        <div className="mt-4">
          <FormLabel>Receiving Email</FormLabel>
          <input
            type="text"
            className="form-control"
            value={receivingEmail}
            onChange={(e) => {
              e.preventDefault();
              setReceivingEmail(e.target.value);
            }}
          />
          {submitError && <div className="alert alert-danger mt-3">{submitError}</div>}
        </div>
      </div>
      <Modal.Footer className="px-5">
        <Modal.ButtonBar className="py-3">
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
              else {
                regeneratePostHTML();
              }
            }}
          >
            yes
          </button>
        </Modal.ButtonBar>
      </Modal.Footer>
      <Modal.Overlay closeIcon open={showConfirm} onClose={onClose}>
        <Modal.Title title="Post Generation" />
        <div className="p-5 d-flex flex-column align-items-center">
          <h3 className="mb-5">Your post is being regenerated</h3>
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
export default RegeneratePostHTMLModal