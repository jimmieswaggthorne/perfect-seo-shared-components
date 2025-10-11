import React, { useEffect, useState } from 'react';
import TypeWriterText from '../TypeWriterText/TypeWriterText';
import { ProcessTsvUrlResponse } from '@/perfect-seo-shared-components/data/requestTypes';
import PostStatusItem from './PostStatusItem';
import axiosInstance from '@/perfect-seo-shared-components/utils/axiosInstance';
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client';
import { useSelector } from 'react-redux';
import { RootState } from '@/perfect-seo-shared-components/lib/store';
import * as d3 from "d3";
import useForm from '@/perfect-seo-shared-components/hooks/useForm';
import useArrayForm from '@/perfect-seo-shared-components/hooks/useArrayForm';
import Form from '../Form/Form';
import BulkPostDraftItem from './BulkPostDraftItem';
import Loader from '../Loader/Loader';
import { getBatchStatus } from '@/perfect-seo-shared-components/services/services';
import { selectEmail, selectProfile, selectUser } from '@/perfect-seo-shared-components/lib/features/User';
import { IncomingPlanItemResponse } from '@/perfect-seo-shared-components/data/types';



interface BulkPostComponentProps {
  active: boolean;
  currentDomain?: string;
}
const BulkPostComponent = ({ active, currentDomain }: BulkPostComponentProps) => {
  const [tsvUrl, setTsvUrl] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [itemGuids, setItemGuids] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [pendingGUIDS, setPendingGUIDS] = useState<string[]>([])
  const profile = useSelector(selectProfile);
  const email = useSelector(selectEmail)
  const supabase = createClient();
  const [tsv, setTsv] = useState(null)
  const [showItems, setShowItems] = useState<boolean>(true);
  const form = useForm();
  const arrayForm = useArrayForm(form)

  useEffect(() => {
    if (profile?.bulk_posts_guids && active) {
      setItemGuids(profile.bulk_posts_guids)
    }

  }, [profile?.bulk_posts_guids, active])

  const pullStatus = () => {
    getBatchStatus(pendingGUIDS)
      .then(res => {
        let newItems = items.reduce((prev, item) => {
          let newItem = res.data.find((resItem) => resItem.content_plan_outline_guid === item.guid)
          return [...prev, newItem]
        }, [])
        setItems(newItems)
      })
  }

  useEffect(() => {
    const initialStatusPull = () => {
      getBatchStatus(itemGuids)
        .then(res => {
          let newItems = res.data.map((item) => ({ ...item, guid: item.content_plan_outline_guid }))
          let pendingGUIDS = res.data.filter((item) => item.status !== 'Complete').map((item) => item.content_plan_outline_guid)

          setPendingGUIDS(pendingGUIDS)
          setItems(newItems)
        })
    }

    if (itemGuids?.length > 0 && active) {
      initialStatusPull()
    }
  }, [itemGuids])

  useEffect(() => {
    let interval;
    if (pendingGUIDS?.length > 0 && active && items) {
      pullStatus()
      interval = setInterval(() => {
        pullStatus()
      }, 5000)
    }
    return () => clearInterval(interval)

  }, [pendingGUIDS, active])

  const updateBulkPosts = (newItems: IncomingPlanItemResponse[]) => {
    setLoading(true)
    supabase
      .from('profiles')
      .update({ bulk_posts_guids: newItems.map(({ guid }) => guid) })
      .eq('email', email)
      .select('*')
      .then(res => {
      })
  }

  useEffect(() => {
    if (arrayForm?.getArrayState?.length > 0) {
      arrayForm.setConfig({ requiredKeys: ['target_keyword', 'domain_name'], validatedKeys: ['voice_url', 'outline_url'] })
    }
  }, [arrayForm?.getArrayState])

  const deletePost = (idx: number) => {
    let newItems = [
      ...items.slice(0, idx),
      ...items.slice(idx + 1),
    ]
    updateBulkPosts(newItems.map(({ guid }) => guid))
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

          let newPost = { ...post, custom_outline: post['custom_outline'].toLowerCase() === 'y' ? true : false }
          if (post['domain_name'] === '' && currentDomain) {
            newPost['domain_name'] = currentDomain
          }
          if (post['email'] === '' && email) {
            newPost['email'] = email
          }
          return [...prev, newPost]
        }, [])
        arrayForm.setArrayState(tsv);
        setTsv(tsv)
        setIsUploading(false)
      })
      .catch(err => {
        setUploadError(err?.response?.data?.detail || 'Error uploading TSV file');
        setIsUploading(false)
      })

  };
  // https://docs.google.com/spreadsheets/d/e/2PACX-1vTWd4tdpKOC0Gzg4nGTNXu-6ETPeBGXC6HzCKdCHa_DYtw7YQZ3_AlkMG_pJNrdh9lGP5w2Nk3R2RFe/pub?output=tsv


  useEffect(() => {
    if (itemGuids.length > 0) {
      getBatchStatus(itemGuids)
        .then(res => {
          setItems(res.data)
          setLoading(false)
        })
    }
  }, [itemGuids])

  const submitHandler = () => {
    let newData = arrayForm.getArrayState.map((post) => ({
      ...post, custom_outline: post['custom_outline'] ? 'y' : 'n'
    }))
    if (form.validate({ requiredFields: arrayForm.getRequiredFields, validatorFields: arrayForm.getValidatedFields })) {
      setLoading(true)
      axiosInstance.post<ProcessTsvUrlResponse>(`https://content-v5.replit.app/process-tsv`, newData)
        .then(response => {
          setTsvUrl(null)
          form.setState({})
          setItemGuids(response.data.guids)
          supabase
            .from('profiles')
            .update({
              bulk_posts_guids: response.data.guids
            })
            .eq('email', email)
            .select('*')
            .then(res => {

            })
        })

        .catch((err) => {
          setLoading(false);
          setError(err?.response?.data?.detail || 'Error processing TSV file');
        })
    }
  }
  const toggleShowItems = (e) => {
    e.preventDefault();
    setShowItems(!showItems);
  }


  return (
    <div className='row d-flex justify-content-between align-items-start g-3'>
      <div className='d-flex justify-content-between align-items-center mt-3'>
        <h3 className='text-white mb-0'><TypeWriterText withBlink string="Bulk Post Generator" /></h3>
      </div>
      <div className='col-12'>
        <div className='row d-flex justify-content-between align-items-start g-3'>
          <div className='col-10 col-lg-8'>
            <form>
              <div className='input-group mb-1'>
                <input
                  type="text"
                  value={tsvUrl}
                  onChange={(e) => setTsvUrl(e.target.value)}
                  placeholder="Enter TSV file URL"
                  required
                  className='form-control'
                />
                <button className="btn btn-primary" onClick={handleUpload} type="submit" disabled={loading || isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <a className='text-primary' href="https://docs.google.com/spreadsheets/d/1ImKmOBeFWHCkKcEhpaE7ZHvWfTA0JFcnF1GTtuRMQ7s/copy" target="_blank">
                <small>Get Google Sheets Template</small>
              </a>
              <span className='mx-1'>|</span>
              <a className='text-primary' href="https://www.youtube.com/watch?v=VAwiZCcKRuM" target="_blank">
                <small>View Tutorial</small>
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
            <Loader string="Generating Posts" /> :
            <Form controller={form}>
              <h5 className='mt-2'>Review Posts</h5>
              <div className='row d-flex justify-content-between align-items-start g-3'>
                {arrayForm.getArrayState.map((item, idx) => (
                  <BulkPostDraftItem item={item} idx={idx} form={form} arrayForm={arrayForm} key={idx} />
                ))}
              </div>
            </Form>}
          </div>}
        </div>
      </div>

      <div className='col-12'>
        <hr />
        <div className='d-flex justify-content-between align-items-center my-3'>
          <h4 className='col mb-0 text-white'>Bulk Posts</h4>
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
                  <div className="capitalize col-12 col-md-6 col-lg-4">Title</div>
                  <div className="d-none d-lg-block col-4">Domain</div>
                  <div className="capitalize col-12 col-md-6 text-end col-lg-4">Status</div>
                </div>
              </li>
              {items.map((item, idx) => {
                return (
                  <PostStatusItem item={item} guid={item?.guid} key={idx} deletePost={deletePost} idx={idx} loading={loading} />
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

export default BulkPostComponent