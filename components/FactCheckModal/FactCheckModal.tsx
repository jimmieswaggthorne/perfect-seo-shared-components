'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Tabs from "@radix-ui/react-tabs";
import { useSelector } from 'react-redux';
import { RootState } from '@/perfect-seo-shared-components/lib/store';
import { signIn } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FactCheckPerfectLogo } from '@/perfect-seo-shared-components/assets/brandIcons';
import { PostProps } from '@/perfect-seo-shared-components/data/types';
import { factCheckByPostGuid, patchPost, postFactCheck, updateLiveUrl } from '@/perfect-seo-shared-components/services/services';
import axios from 'axios';

// onNewFactCheck: (factCheck: { type: 'url' | 'file', content: string }, post_id?: string) => void;

interface FactCheckModalProps {
  post: PostProps,
  setLocalPost: (post: PostProps) => void
  onClose: () => void
}
const FactCheckModal = ({ post, setLocalPost, onClose }: FactCheckModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useSelector((state: RootState) => state);
  const pathname = usePathname()


  const updateLivePostUrl = () => {
    updateLiveUrl(post.content_plan_outline_guid, url)
      .then(res => { setLocalPost({ ...post, live_post_url: url }) })
  }

  const handleUrlCheck = () => {
    setIsLoading(true);
    let reqBody = {
      content_plan_outline_guid: post?.content_plan_outline_guid,
      use_live_url: true
    }
    factCheckByPostGuid(reqBody)
      .then(res => {
        patchPost(post.content_plan_outline_guid, "factcheck_guid", res.data.guid)
          .then(res => {
            setIsLoading(true)
            onClose()
          })

      })
      .catch(err => {
        console.log(err);
        setIsLoading(false)
        setError(err?.response?.data?.message || err?.message || 'An error occurred')
      })
  };

  const handleFileCheck = () => {
    let reqBody = {
      content_plan_outline_guid: post?.content_plan_outline_guid,
      use_live_url: false
    }
    factCheckByPostGuid(reqBody)
      .then(res => {
        patchPost(post.content_plan_outline_guid, "factcheck_guid", res.data.guid)
          .then(res => {
            setIsLoading(true)
            onClose()
          })
      })
      .catch(err => {
        console.log(err);
        setIsLoading(false)
        setError(err?.response?.data?.message || err?.message || 'An error occurred')
      })
  };

  useEffect(() => {
    if (post?.live_post_url) {
      setUrl(post?.live_post_url)
    }
  }, [post?.live_post_url])
  const loginHandler = (e) => {
    e.preventDefault();
    signIn('google');
  }

  const isSameURL = useMemo(() => {
    return (post?.live_post_url === url)
  }, [post?.live_post_url, url])

  return (
    <div className="card p-3">
      <div className='row d-flex g-3'>
        <div className='col-12'>
          <div className='d-flex justify-content-center'>
            <div className='brand-logo'>
              <FactCheckPerfectLogo />
            </div>
          </div>
        </div>
        <div className='col-12'>
          <h4 className="text-center">Factcheck your post using factcheckPerfect
          </h4>
        </div>
        <div className='col-12'>
          <p className="text-center">What source would you like to use to run your factcheck?</p>
          <Tabs.Root defaultValue="url" className="w-100">
            <Tabs.List className='d-flex align-items-center justify-content-center px-0'>
              <Tabs.Trigger className="col-auto pe-4 btn btn-secondary btn-tab" value="url">Live Post URL</Tabs.Trigger>
              <div className='or-overlap'>OR</div>
              <Tabs.Trigger className='col-auto ps-4 btn btn-secondary btn-tab' value="file" disabled={!post?.html_link}>Generated HTML</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="url">
              <div className="input-group w-100 mt-3">
                <input
                  placeholder="Enter URL to fact-check"
                  value={url}
                  name='url'
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                  className='form-control bg-light'
                />{isSameURL ?
                  <button className="btn btn-primary input-group-append" onClick={() => handleUrlCheck()} disabled={isLoading}>
                    {isLoading ? <div className='spinner-border spinner-border-sm' /> : 'Check'}
                  </button>
                  :
                  <button className="btn btn-primary input-group-append" onClick={() => updateLivePostUrl()}>
                    Update Live Post Url
                  </button>

                }

              </div>
            </Tabs.Content>
            <Tabs.Content value="file">
              <div className="d-flex justify-content-center">
                <button className='btn btn-primary input-group-append' onClick={handleFileCheck} disabled={isLoading}>
                  {isLoading ? 'Checking...' : 'Check Generated HTML File'}
                </button>
              </div>
            </Tabs.Content>
            {error && <p className='text-danger mt-2text-center'><strong>{error}</strong></p>}
          </Tabs.Root>
          {!isLoggedIn ? <div className='text-center mt-3'>
            Looking to save your fact checks? <a className='text-primary' onClick={loginHandler}>Login with Google</a> to access fact-check history and more!
          </div> : pathname === '/' ? <div className='text-center mt-3'>
            View your previous fact-checks <a className='text-primary' href="/fact-checks">My Fact-Checks</a>
          </div> : null}
        </div>
      </div>
    </div>
  );
}

export default FactCheckModal