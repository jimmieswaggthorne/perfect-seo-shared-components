'use client'
import { useEffect, useState } from 'react'
import styles from './PostsList.module.scss'
import { deleteContentOutline, getPostsByDomain, getPostsByEmail } from '@/perfect-seo-shared-components/services/services'
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal'
import Loader from '../Loader/Loader'
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText'
import PostItem from '../PostItem/PostItem'
import usePaginator from '@/perfect-seo-shared-components/hooks/usePaginator'
import { useSelector } from 'react-redux'
import { selectEmail } from '@/perfect-seo-shared-components/lib/features/User'

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

  const getPosts = () => {
    if (active) {
      if (domain_name) {
        getPostsByDomain(domain_name, { ...paginator.paginationObj, page: paginator.currentPage })
          .then(res => {
            paginator.setItemCount(res.data.total)
            setData(res.data.records)
            setLoading(false)
          })
          .catch(err => {
            setLoading(false);
            setData(null)
            paginator.setItemCount(0)
          })
      }
      else {
        getPostsByEmail(email, { ...paginator.paginationObj, page: paginator.currentPage })
          .then(res => {
            paginator.setItemCount(res.data.total)
            setData(res.data.records)
            setLoading(false)
          })

          .catch(err => {
            setLoading(false);
            setData(null)
          })
      }
    }
  }

  const deleteHandler = (guid) => {
    deleteContentOutline(guid)
      .then(res => {
        getPosts()
        setDeleteModal(null)
      })
      .catch(err => {
        console.log(err)
      })
  }




  useEffect(() => {
    let interval;
    if (active) {
      getPosts();
      interval = setInterval(getPosts, 60000)
    }

    return () => {
      clearInterval(interval);
    }
  }, [domain_name, active, paginator.currentPage, paginator.limit])


  if (!active) return null
  else
    return (
      <div className={styles.wrap}>
        <div className='row d-flex justify-content-between align-items-end my-3'>
          <div className='col-12 col-md-auto d-flex align-items-end'>
            <h2 className='text-primary mb-0'>
              <TypeWriterText string="Generated Posts" withBlink />
            </h2>
            {paginator.itemCount > 0 && <p className='badge rounded-pill text-bg-primary ms-3 d-flex align-items-center mb-1'>{paginator.itemCount}</p>}
          </div>
        </div>
        {loading ? <Loader />
          : data?.length > 0 ?
            <div className='row d-flex g-3 justify-content-center'>
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
              <button onClick={() => { setDeleteModal(null) }} className="btn btn-warning">Cancel</button>
              <button onClick={(e) => { e.preventDefault(); deleteHandler(deleteModal) }} className="btn btn-primary">Yes</button>
            </div>
          </Modal.Description>
        </Modal.Overlay>
      </div>
    )

}

export default PostsList



