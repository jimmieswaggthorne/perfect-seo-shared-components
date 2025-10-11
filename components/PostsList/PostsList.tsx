'use client'
import { useCallback, useEffect, useState } from 'react'
import styles from './PostsList.module.scss'
import { deletePost, getPostsByDomain, getPostsByEmail } from '@/perfect-seo-shared-components/services/services'
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal'
import Loader from '../Loader/Loader'
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText'
import PostItem from '../PostItem/PostItem'
import usePaginator from '@/perfect-seo-shared-components/hooks/usePaginator'
import { useSelector } from 'react-redux'
import { selectEmail } from '@/perfect-seo-shared-components/lib/features/User'
import useForm from '@/perfect-seo-shared-components/hooks/useForm'
import Form from '../Form/Form'
import { Option, Select } from '../Form/Select'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'


export interface PostsListProps {
  domain_name: string;
  active: boolean;
}
const PostsList = ({ domain_name, active }: PostsListProps) => {
  const email = useSelector(selectEmail)
  const paginator = usePaginator()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>()
  const [deleteModal, setDeleteModal] = useState(null)
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

  const getPosts = () => {
    setLoading(true)
    setData(null)
    if (active) {
      let reqObj: any = { ...paginator.paginationObj, page: paginator.currentPage }
      let status = filter
      if (status === 'all') {
        status = null;
      }
      else if (status === 'live') {
        reqObj.has_live_post_url = true
      }
      else {
        reqObj.status = status
      }

      if (domain_name) {
        getPostsByDomain(domain_name, reqObj)
          .then(res => {
            if (res.data) {
              paginator.setItemCount(res.count)
              setData(res.data)
              setLoading(false)
            }
            else {
              setLoading(false);
              setData(null)
              paginator.setItemCount(0)
            }
          })
      }
      else {
        getPostsByEmail(email, reqObj)
          .then(res => {
            if (res.data) {
              paginator.setItemCount(res.count)
              setData(res.data)
              setLoading(false)
            }
            else {
              setLoading(false);
              setData(null)
              paginator.setItemCount(0)
            }
          })
      }
    }
  }

  const deleteHandler = (guid) => {
    deletePost(guid)
      .then(res => {
        getPosts()
        setDeleteModal(null)
      })
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    let interval;
    if (active) {
      getPosts();
      // interval = setInterval(getPosts, 60000)
    }

    return () => {
      clearInterval(interval);
    }
  }, [domain_name, active, paginator.currentPage, paginator.limit, filter])

  const changeFilter = (e) => {
    router.replace(pathname + '?' + createQueryString('filter', e.target.value.toString()))
    setFilter(e.target.value.toString())
  }

  if (!active) return null
  else
    return (
      <div className={styles.wrap}>
        <div className='row d-flex justify-content-between align-items-end mb-3'>
          <div className='col d-flex align-items-end'>
            <h2 className='text-primary mb-0'>
              <TypeWriterText string="Posts" withBlink />
            </h2>
            {paginator.itemCount > 0 && <p className='badge rounded-pill text-bg-primary ms-3 d-flex align-items-center mb-1'>{paginator.itemCount}</p>}
          </div>
          <div className='col-auto'>
            <Form controller={form}>
              <Select bottomSpacing={false} fieldName='filter' onChange={changeFilter} label="Filter by Status" value={filter}>
                <Option value='all'>All</Option>
                <Option value='live'>Live</Option>
                <Option value='completed'>Finished</Option>
                <Option value='processing'>Processing</Option>
              </Select>
            </Form>
          </div>
        </div>
        {loading ? <Loader />
          : data?.length > 0 ?
            <div className='row d-flex g-1 justify-content-center'>
              {data.map((obj, i) => {
                return <PostItem post={obj} key={obj.content_plan_outline_guid} refresh={getPosts} domain_name={domain_name} />
              })}
              <div className='col-auto d-flex justify-content-center'>
                {paginator.renderComponent()}
              </div></div> :
            <h5><TypeWriterText withBlink string="The are no results for the given parameters" /></h5>}
        <Modal.Overlay open={deleteModal} onClose={() => { setDeleteModal(null) }}>
          <Modal.Title title="Delete Plan" />
          <Modal.Description>
            Are you sure you want to delete this post?
            <div className='d-flex justify-content-between mt-5'>
              <button onClick={() => { setDeleteModal(null) }} className="btn btn-secondary">Cancel</button>
              <button onClick={(e) => { e.preventDefault(); deleteHandler(deleteModal) }} className="btn btn-primary">Yes</button>
            </div>
          </Modal.Description>
        </Modal.Overlay>
      </div>
    )

}

export default PostsList



