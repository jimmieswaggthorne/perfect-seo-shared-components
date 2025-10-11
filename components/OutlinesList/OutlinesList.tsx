'use client'
import { useCallback, useEffect, useState } from 'react'
import styles from './OutlinesList.module.scss'
import { deleteOutline, getContentPlanOutlinesByDomain, getContentPlanOutlinesByEmail } from '@/perfect-seo-shared-components/services/services'
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal'
import Loader from '../Loader/Loader'
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText'
import { useSelector } from 'react-redux'
import OutlineItem from '../OutlineItem/OutlineItem'
import usePaginator from '@/perfect-seo-shared-components/hooks/usePaginator'
import { selectEmail } from '@/perfect-seo-shared-components/lib/features/User'
import { Option, Select } from '../Form/Select'
import Form from '../Form/Form'
import useForm from '@/perfect-seo-shared-components/hooks/useForm'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { stat } from 'fs'

export interface OutlinesListProps {
  domain_name: string;
  active: boolean;
}
const OutlinesList = ({ domain_name, active }: OutlinesListProps) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>()
  const [deleteModal, setDeleteModal] = useState(null)
  const email = useSelector(selectEmail)
  const [filter, setFilter] = useState('all')
  const router = useRouter()
  const form = useForm()
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('filter');
  const pathname = usePathname()

  useEffect(() => {
    if (queryParam) {
      form.setInitialState({ filter: queryParam.toString() })
      setFilter(queryParam.toString())
    }
    else {
      form.setInitialState({ filter: 'all' })
    }
  }, [queryParam])

  // "Outline Not Started"
  // "Outline Generating"
  // "Outline Completed"
  // "Post Generating"

  const paginator = usePaginator()

  const getOutlines = () => {

    if (active) {
      paginator.setItemCount(0)
      setLoading(true);
      setData(null)
      let status = filter;
      if (status === 'all') {
        status = null;
      }
      if (domain_name) {
        getContentPlanOutlinesByDomain(domain_name, paginator.paginationObj, status)
          .then(res => {
            console.log("by domain", res)
            if (res.data) {
              paginator.setItemCount(res.count)
              setData(res.data)
              setLoading(false)
            }
            else {
              setLoading(false);
              setData(null)
            }
          })
      }
      else {
        getContentPlanOutlinesByEmail(email, paginator.paginationObj, status)
          .then(res => {
            console.log("by email", res)
            if (res.data) {

              paginator.setItemCount(res.count)
              setData(res.data)
              setLoading(false)
            }
            else {
              setLoading(false);
              setData(null)
            }
          })
      }
    }
  }

  const deleteHandler = (guid) => {
    deleteOutline(guid)
      .then(res => {
        getOutlines()
        setDeleteModal(null)
      })

  }



  useEffect(() => {
    let interval;
    if (active) {
      getOutlines();
    }
    else {
      console.log("OutlinesList is not active, skipping initial fetch")
    }

    return () => {
      clearInterval(interval);
    }
  }, [active, paginator.currentPage, paginator.limit, domain_name, filter])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const changeFilter = (e) => {
    router.replace(pathname + '?' + createQueryString('filter', e.target.value.toString()))
    setFilter(e.target.value.toString())
  }

  if (!active) return null

  return (
    <div className={styles.wrap}>
      <div className='row d-flex justify-content-between align-items-end mb-3'>
        <div className='col d-flex align-items-end'>
          <h2 className='text-primary mb-0'>
            <TypeWriterText string="Outlines" withBlink />
          </h2>
          {paginator.itemCount > 0 && <p className='badge rounded-pill text-bg-primary ms-3 d-flex align-items-center mb-1'>{paginator.itemCount}</p>}
        </div>
        <div className='col-auto'>
          <Form controller={form}>
            <Select bottomSpacing={false} fieldName='filter' onChange={changeFilter} label="Filter by Status" value={filter}>
              <Option value='all'>All</Option>
              <Option value='completed'>Finished</Option>
              <Option value='in-progress'>Processing</Option>
              <Option value='failed'>Failed</Option>
            </Select>
          </Form>
        </div>
      </div>
      {loading ? <Loader />
        : (data?.length > 0 || paginator.itemCount > 0) ?
          <div className='row d-flex justify-content-center g-1'>
            {data.map((obj, i) => {
              return <OutlineItem domain_name={domain_name} outline={obj} key={obj.guid} refresh={getOutlines} />
            })}
            <div className='col-auto d-flex justify-content-center'>
              {paginator.renderComponent()}
            </div>
          </div> :
          <h5><TypeWriterText withBlink string="The are no results for the given parameters" /></h5>}

      <Modal.Overlay open={deleteModal} onClose={() => { setDeleteModal(null) }}>
        <Modal.Title title="Delete Plan" />
        <Modal.Description>
          Are you sure you want to delete this outline?
          <div className='d-flex justify-content-between mt-5'>
            <button onClick={() => { setDeleteModal(null) }} className="btn btn-secondary">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); deleteHandler(deleteModal) }} className="btn btn-primary">Yes</button>
          </div>
        </Modal.Description>
      </Modal.Overlay>
    </div>
  )

}

export default OutlinesList



