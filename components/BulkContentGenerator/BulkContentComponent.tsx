import React, { useEffect, useState } from 'react';
import TypeWriterText from '../TypeWriterText/TypeWriterText';
import axiosInstance from '@/perfect-seo-shared-components/utils/axiosInstance';
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client';
import { useSelector } from 'react-redux';
import * as d3 from "d3";
import useForm from '@/perfect-seo-shared-components/hooks/useForm';
import useArrayForm from '@/perfect-seo-shared-components/hooks/useArrayForm';
import Form from '../Form/Form';
import Loader from '../Loader/Loader';
import BulkContentDraftItem from './BulkContentDraftItem';
import ContentStatusItem from './ContentStatusItem';
import { selectProfile } from '@/perfect-seo-shared-components/lib/features/User';


interface BulkContentComponentProps {
  active: boolean;
  currentDomain?: string;
}


const BulkContentComponent = ({ active, currentDomain }: BulkContentComponentProps) => {
  const [tsvUrl, setTsvUrl] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const profile = useSelector(selectProfile)
  const supabase = createClient();
  const [showItems, setShowItems] = useState<boolean>(true);
  const form = useForm();
  const arrayForm = useArrayForm(form)

  const clearGuids = () => {
    supabase
      .from('profiles')
      .update({ bulk_content_guids: null })
      .eq('email', profile?.email)
      .select('*')
      .then(res => {
        if (res.data) {
          setItems(res.data[0].bulk_content)
          setLoading(false)
        }
      })
  }
  useEffect(() => {
    if (active) {
      if (profile?.bulk_content) {
        setItems(profile.bulk_content)
      } else if (profile?.bulk_content_guids) {
        setItems(profile.bulk_content_guids.map((item, idx) => ({ target_keyword: '', domain_name: '', voice_url: '', outline_url: '', status: 'pending', idx, guid: item })))
        updateBulkContent(profile.bulk_content_guids.map((item, idx) => ({ target_keyword: '', domain_name: '', voice_url: '', outline_url: '', status: 'pending', idx, guid: item })))
        clearGuids()
      }
    }

  }, [profile?.bulk_content, active])


  const updateBulkContent = (newItems) => {
    setLoading(true)
    supabase
      .from('profiles')
      .update({ bulk_content: newItems })
      .eq('email', profile?.email)
      .select('*')
      .then(res => {
        if (res.data) {
          setItems(res.data[0].bulk_content)
          setLoading(false)
        }
      })
  }

  // useEffect(() => {
  //   if (arrayForm?.getArrayState?.length > 0) {
  //     arrayForm.setConfig({ requiredKeys: ['target_keyword', 'domain_name'], validatedKeys: ['voice_url', 'outline_url'] })
  //   }
  // }, [arrayForm?.getArrayState])

  const deletePost = (idx: number) => {
    let newItems = [
      ...items.slice(0, idx),
      ...items.slice(idx + 1),
    ]
    updateBulkContent(newItems)
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadError(null);
    setIsUploading(true)

    axiosInstance.get(tsvUrl)
      .then(response => {
        let tsv = d3.tsvParse(response.data)
        delete tsv.columns;
        tsv = tsv.reduce((prev, post) => {

          let newPost = { ...post, custom_outline: post['custom_outline'] === 'y' ? true : false }
          if (post['domain_name'] === '' && currentDomain) {
            newPost['domain_name'] = currentDomain
          }
          if (post['email'] === '' && profile?.email) {
            newPost['email'] = profile?.email
          }
          return [...prev, newPost]
        }, [])
        arrayForm.setArrayState(tsv);
        setIsUploading(false)
      })
      .catch(err => {
        setUploadError(err?.response?.data?.detail || 'Error uploading TSV file');
        setIsUploading(false)
      })

  };
  // https://docs.google.com/spreadsheets/d/e/2PACX-1vTWd4tdpKOC0Gzg4nGTNXu-6ETPeBGXC6HzCKdCHa_DYtw7YQZ3_AlkMG_pJNrdh9lGP5w2Nk3R2RFe/pub?output=tsv




  const submitHandler = () => {
    let newData = arrayForm.getArrayState
    // if (form.validate({ requiredFields: arrayForm.getRequiredFields, validatorFields: arrayForm.getValidatedFields })) {
    setLoading(true)
    var blob = new Blob([d3.tsvFormat(newData, Object.keys(newData[0]))], { type: "text/tab-seperated-values" });
    var file = new File([blob], "upload.tsv", { type: "text/tab-seperated-values" });

    axiosInstance.post(`https://planperfectapi.replit.app/process_tsv_from_file`, { file }, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        setTsvUrl(null)
        form.setState({})
        let newObj = profile?.bulk_content || []
        newObj = [...newObj, response.data[0]]
        setItems(newObj);
        setLoading(false);
        supabase
          .from('profiles')
          .update({
            bulk_content: newObj
          })
          .eq('email', profile?.email || profile?.email)
          .select('*')
          .then(res => {
            console.log(res)
          })
      })

      .catch((err) => {
        setLoading(false);
        console.log()
        setError(err.response.data.detail.map((item: any) => `${item.msg} : ${item.loc[1]}`) || 'Error processing TSV file');
      })
    // }
  }
  const toggleShowItems = (e) => {
    e.preventDefault();
    setShowItems(!showItems);
  }


  return (
    <div className='row d-flex justify-content-between align-items-start g-3'>
      <div className='d-flex justify-content-between align-items-center mt-3'>
        <h3 className='text-white mb-0'><TypeWriterText withBlink string="Bulk Content Generator" /></h3>
      </div>
      <div className='col-12'>
        <div className='row d-flex justify-content-between align-items-start g-3'>
          <div className='col-10 col-lg-8'>
            <form>
              <div className='input-group mb-1'>
                <input
                  type="url"
                  value={tsvUrl}
                  onChange={(e) => { e.preventDefault(); setTsvUrl(e.target.value) }}
                  placeholder="Enter TSV file URL"
                  required
                  className='form-control'
                />
                <button className="btn btn-primary" onClick={handleUpload} type="submit" disabled={loading || isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <a className='text-primary' href="https://docs.google.com/spreadsheets/d/1sN9iTF8qL5NDUhQ9NIzLgByXdjLVRthoS5S7xhD0zg8/copy" target="_blank">
                <small>Get Google Sheets Template</small>
              </a>
            </form>
          </div>
          <div className='col-2 col-lg-4 d-flex justify-content-end'>
            {arrayForm.getArrayState?.length > 0 && <button className="btn btn-primary" onClick={submitHandler} type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Generate'}
            </button>}
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {arrayForm.getArrayState?.length > 0 && <div>{loading ?
            <Loader string="Generating Content" /> :
            <Form controller={form}>
              <h5 className='mt-2'>Review Content</h5>
              <div className='row d-flex justify-content-between align-items-start g-3'>
                {arrayForm.getArrayState.map((item, idx) => (
                  <BulkContentDraftItem item={item} idx={idx} form={form} arrayForm={arrayForm} key={idx} />
                ))}
              </div>
            </Form>}
          </div>}
        </div>
      </div>

      <div className='col-12'>
        <hr />
        <div className='d-flex justify-content-between align-items-center my-3'>
          <h4 className='col mb-0 text-white'>Bulk Content</h4>
          {items?.length > 0 && <div className='d-flex align-items-center'>
            <p className='mb-0'>
              <a className='text-white' onClick={toggleShowItems}>{showItems ? 'Hide Items' : 'Show Items'}</a>
              <span className='badge rounded-pill text-bg-primary ms-3 mb-1'>{items.length}</span>
            </p>
          </div>}

        </div>
        {
          items?.length > 0 ? showItems ? <>
            <ul className='clear-list-properties row g-1 px-2'>
              <li className="card px-3 py-1 bg-primary d-none d-md-block">
                <div className="row d-flex align-items-center justify-content-between">
                  <div className="capitalize col-12 col-md-4">Title</div>
                  <div className="capitalize d-none d-lg-block col-4">Domain</div>
                  <div className="capitalize col-12 col-md-8 col-lg-4 text-end">Status</div>
                </div>
              </li>
              {items.map((item, idx) => {
                return (
                  <ContentStatusItem idx={idx} item={item} key={idx} deleteContent={deletePost} />
                )
              })}
            </ul>
            <hr />
          </> : null :
            <div className='card p-3 bg-secondary'>
              <span>No bulk posts were found</span>
            </div>
        }
      </div>
    </div>
  );
};

export default BulkContentComponent;