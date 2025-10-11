'use client';

import { Claim, FactCheck, FactCheckResult as FCResult } from '@/perfect-seo-shared-components/data/types';
import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText';
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/perfect-seo-shared-components/lib/store';
import ProgressBar from '@/perfect-seo-shared-components/components/ProgressBar/ProgressBar';
import ClaimResult from './ClaimResult/ClaimResult';
import axiosInstance from '@/perfect-seo-shared-components/utils/axiosInstance';
import { setLoading } from '@/perfect-seo-shared-components/lib/features/User';
import { signIn } from 'next-auth/react';
import { get } from 'http';
import { getFactCheckStatus } from '@/perfect-seo-shared-components/services/services';

interface FactCheckResultPageProps {
  uuid: string;
  isModal?: boolean
}

const FactCheckResultPage: FC<FactCheckResultPageProps> = ({ uuid, isModal }: FactCheckResultPageProps) => {
  const [details, setDetails] = useState<FCResult>(null)
  const [adding, setAdding] = useState(false)
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState(null)
  const [factCheck, setFactCheck] = useState<FactCheck | null>(null)
  const supabase = createClient()
  const { isLoggedIn, user } = useSelector((state: RootState) => state);
  const [users, setUsers] = useState([])
  // uuid is registered to user 
  const [isRegistered, setIsRegistered] = useState(false)
  const dispatch = useDispatch()
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    if (uuid) {
      let email;
      try {
        email = localStorage.getItem('email')
      }
      catch (e) {
        if (user) {
          email = user.email
        }
      }
      supabase
        .from('user_history')
        .insert({ email: email, transaction_data: { guid: uuid, status }, product: 'factcheckPerfect', type: "View Factcheck" })
        .select('*')
        .then(res => {
        })
      supabase
        .from('factchecks')
        .select("*")
        .eq("guid", uuid)
        .then(res => {
          if (res?.data?.length === 0) {
            supabase
              .from('factchecks')
              .insert({ emails: email ? [email] : ['not logged'], guid: uuid, status: status, created_at: new Date().toISOString(), access: [{ type: 'manual', email: email }] })
              .select("*")
              .then(res => {
                if (res.data) {
                  setFactCheck(res.data[0])
                }
              })

          }
          else if (res?.data?.length > 0) {
            setUsers(res.data[0]?.emails)
            if (user && res.data[0]?.emails.includes(user?.email)) {
              setIsRegistered(true)
            }
            setFactCheck(res.data[0])
          }
        })

    }
  }, [uuid])

  const pullFactCheckUsers = () => {
    return supabase
      .from('factchecks')
      .select('*')
      .eq('guid', uuid)
      .then(res => {
        setFactCheck(res.data[0])
        setUsers(res.data[0]?.emails)
        if (user && res.data[0]?.emails.includes(user?.email)) {
          setIsRegistered(true)
        }
      })
  }

  useEffect(() => {
    let factCheckUsersChannel;
    if (uuid && user) {
      pullFactCheckUsers();
      factCheckUsersChannel = supabase.channel('custom-filter-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'factchecks', filter: `guid=eq.${uuid}` },
          (payload) => {
            pullFactCheckUsers()
          }
        )
        .subscribe()
    }
    return () => {
      if (factCheckUsersChannel) {
        supabase.removeChannel(factCheckUsersChannel)
      }
    }
  }, [uuid, user])



  useEffect(() => {
    let factChannel
    if (user) {
      factChannel = supabase.channel('custom-all-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'factchecks' },
          (payload) => {
            setIsRegistered(true)
            setAdding(false)
          }
        )
        .subscribe()
    }
    return () => {
      if (factChannel) {
        supabase.removeChannel(factChannel)
      }
    }
  }, [user])


  // Pull for status updates
  const pullStatus = () => {
    getFactCheckStatus(uuid)
      .then(res => {
        if (res.data.status === 'completed') {
          let newDetails: any = res.data.factCheck || null;
          newDetails.claim_assessment_section.claim_assessments = newDetails?.claim_assessment_section.claim_assessments.map((obj) => {
            let newObj = obj;
            newObj.resultInt = obj.result === 'not supported by the sources' ? 1 : obj.result === 'partially supported by the sources' ? 2 : 3;
            return newObj
          })
          if (status === 'completed') {
            setProgress(100)
            return setDetails(newDetails);
          }
          setDetails(newDetails);
          setStatus(res.data.status);
          setProgress(res.data.status)
        } else if (res.data.status === 'error') {
          setStatus('Error occurred during fact check.');
        } else if (res?.data?.status === "not_found") {
          // handleNewFactCheck()
          setStatus(res.data.status.replaceAll("_", " "));
          setProgress(0)
        } else if (res?.data?.status) {
          setStatus(res.data.status.replaceAll("_", " "));
          setProgress(Math.min(progress + 10, 90));
        }
        if (res.data.status) {
          supabase
            .from('factchecks')
            .update({ status: res.data.status })
            .eq("guid", uuid)
            .select("*")
            .then(res => {
            })
        }
      })
      .catch(err => {
        console.log(err)
      })
  };

  const addToHistoryHandler = (e) => {
    e.preventDefault();
    if (user && details) {
      setAdding(true)
      let emails = factCheck?.emails || [];
      let access = factCheck?.access || [];
      if (user?.email) {
        emails.push(user?.email)
        access.push({ type: 'shared', email: user?.email })
      }
      supabase
        .from('factchecks')
        // needs source added in the future
        .update({ emails, guid: uuid, status: status, created_at: new Date().toISOString(), access })
        .select()
    }
  }

  useEffect(() => {
    let interval;
    if (status !== 'completed') {
      pullStatus()
      interval = setInterval(pullStatus, 10000)
    }
    else if (status === 'completed') {

      if (!details) {
        pullStatus()
      }
      else {
        supabase
          .from('factchecks')
          .update({ status: 'completed' })
          .eq("guid", uuid)
      }
    }
    return () => {
      clearInterval(interval)
    }
  }, [uuid, status, details])

  const loginWithGoogleHandler = (e) => {
    e?.preventDefault();

    signIn('google', { callbackUrl: `${window.location.href}/` })

  }

  if (!status) return <div className='bg-primary'><div className='container strip-padding d-flex justify-content-center align-items-center'><h1 className='text-white text-center'><TypeWriterText withBlink string="Loading" /></h1></div>
  </div>
  return (
    <div className='container-fluid bg-light py-5'>
      <div className='container'>
        {source && <div className="row d-flex g-3 align-items-center justify-content-center cursor-pointer mb-3" >
          <div className='col-12'>
            <h5 className='mb-0'>
              {source}</h5>
          </div>
        </div>}
        {progress < 100 && (
          <div className='col-12 mb-3 strip-padding'>
            <ProgressBar progress={progress} status={status} />
            <div className='mt-5 d-flex justify-content-center'>
              {isLoggedIn ? <a href="/fact-checks" className='btn btn-primary'>Check more while you wait</a> : <a onClick={loginWithGoogleHandler} className='btn btn-primary'>Login to preserve your fact check history</a>}
            </div>
          </div>
        )}
        {(progress === 100 && isLoggedIn && !isRegistered) &&
          <div className='my-5'>
            <div className='card p-3 mx-3 w-100 d-flex align-items-center bg-primary text-center'><p className='mb-1 fs-2'>This fact-check is not saved to your history.<br />Would you like to add it?</p> <button className='btn btn-secondary ms-3' disabled={adding} onClick={addToHistoryHandler}>{adding ? 'Adding' : 'Add to History'}</button></div>
          </div>}
        <div className="row d-flex g-5 p-3 justify-content-center">
          {details?.fact_check_overview && (
            <div className='col-12'>
              <h3 className='text-warning'><TypeWriterText withBlink string={details.fact_check_overview?.header} /></h3>
              <ul className='clear-list-properties d-flex row g-3'>
                <li className='col-6'>
                  <div className='card'>
                    <div className='card-header bg-primary p-3 text-center'>
                      Claims checked
                    </div>
                    <div className='card-body text-center bg-secondary'>
                      {details?.fact_check_overview.num_claims_checked}

                    </div>
                  </div></li>
                <li className='col-6'>
                  <div className='card'><div className='card-header bg-success p-3 text-center'>Fully supported</div><div className='card-body text-center bg-secondary'> {details?.fact_check_overview.num_fully_supported}</div></div></li>
                <li className='col-6'>
                  <div className='card'><div className='card-header bg-warning p-3 text-center text-light'>Partially supported</div><div className='card-body text-center bg-secondary'> {details?.fact_check_overview.num_partially_supported}</div></div></li>
                <li className='col-6'>
                  <div className='card'><div className='card-header bg-danger p-3 text-center'>Not supported</div><div className='card-body text-center bg-secondary'> {details?.fact_check_overview.num_not_supported}</div></div></li>
              </ul>
            </div>
          )}
          {details?.claim_assessment_section && (
            <div className='col-12'>
              <h3 className='text-warning'><TypeWriterText withBlink string={details?.claim_assessment_section?.header} /></h3>
              <ul className="clear-list-properties d-flex row g-3 align-items-start">
                {details?.claim_assessment_section.claim_assessments.sort((a, b) => a?.resultInt - b?.resultInt).map((claim: Claim, index) => (
                  <ClaimResult claim={claim} key={index} />
                ))}
              </ul>
            </div>
          )}
          {details?.fact_check_summary && (
            <div>
              <h3 className='text-warning mb-3'><TypeWriterText withBlink string={details?.fact_check_summary?.header} /></h3>
              <p className='card preserve-spacing bg-secondary p-3'>{details?.fact_check_summary.summary}</p>
            </div>
          )}
          {details?.suggested_revisions && (
            <div>
              <h3 className='text-warning mb-3'><TypeWriterText withBlink string={details?.suggested_revisions?.header} /></h3>
              <p className='card bg-secondary preserve-spacing p-3'>{details?.suggested_revisions.revised_text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactCheckResultPage;