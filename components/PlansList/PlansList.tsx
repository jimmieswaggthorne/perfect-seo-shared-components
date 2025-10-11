import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './PlansList.module.scss';
import Table, { TableColumnArrayProps } from '@/perfect-seo-shared-components/components/Table/Table';
import { deleteContentPlan, getContentPlansByDomain, getContentPlansByEmail } from '@/perfect-seo-shared-components/services/services';
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal';
import moment from 'moment-timezone';
import useViewport from '@/perfect-seo-shared-components/hooks/useViewport';
import TypeWriterText from '@/perfect-seo-shared-components/components/TypeWriterText/TypeWriterText';
import { useSelector } from 'react-redux';
import usePaginator from '@/perfect-seo-shared-components/hooks/usePaginator';
import { selectEmail } from '@/perfect-seo-shared-components/lib/features/User';
import LoadSpinner from '../LoadSpinner/LoadSpinner';
import ContentPlanForm from '@/perfect-seo-shared-components/components/ContentPlanForm/ContentPlanForm';
import ContentPlanStatusCell from './ContentPlanStatusCell';
import ContentPlanStats from './ContentPlanStats';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Props for the PlansList component
export interface PlanListProps {
  domain_name: string;
  active: boolean;
}

const PlansList = ({ domain_name, active }: PlanListProps) => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const router = useRouter();
  // Hooks
  const { tablet, phone } = useViewport();
  const paginator = usePaginator();
  const email = useSelector(selectEmail);
  const searchParams = useSearchParams();
  const pathname = usePathname()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const outlineCountClickHandler = (e) => {
    e.preventDefault()
    router.replace(pathname + '?' + createQueryString('tab', 'outlines'))
  }
  const postCountClickHandler = (e) => {
    e.preventDefault()
    router.replace(pathname + '?' + createQueryString('tab', 'posts'))
  }


  /**
   * Fetch content plans based on the domain or email.
   */
  const fetchPlans = () => {
    setLoading(true);

    const fetchFunction = domain_name
      ? getContentPlansByDomain(domain_name, paginator.paginationObj)
      : getContentPlansByEmail(email, paginator.paginationObj);

    fetchFunction
      .then((res) => {
        if (res.data) {
          const newData = res.data.map((obj) => ({
            ...obj,
            keyword: obj?.keyword || 'N/A',
          }));
          paginator.setItemCount(res.count);
          setData(newData);
        } else {
          paginator.setItemCount(0);
          setData([]);
        }
        setLoading(false);
      })
  };

  /**
   * Delete a content plan by its GUID.
   * @param guid - The GUID of the content plan to delete.
   */
  const deleteHandler = (guid: string) => {
    deleteContentPlan(guid)
      .then(() => {
        setDeleteModal(null);
        fetchPlans();
      })
      .catch(() => {
        setDeleteModal(null);
      });
  };

  /**
   * Close the "New Content Plan" modal and refresh plans.
   */
  const newCloseHandler = () => {
    setDuplicateInfo(null);
    setTimeout(() => fetchPlans(), 60000);
    setNewModal(false);
  };

  /**
   * Render the title cell for the table.
   * @param obj - The data object for the row.
   */
  const RenderTitle = ({ obj }: { obj: any }) => {
    const domain = obj.domain_name
      .replace('https://', '')
      .replace('http://', '')
      .replace('www.', '')
      .replaceAll('/', '');
    return (
      <div>
        <p className="mb-0">
          {obj.keyword}{' '}
          {domain !== domain_name && (
            <span className="badge bg-primary ms-2">{obj.domain_name}</span>
          )}
          {obj?.email && email !== obj?.email && (
            <span>
              {' '}
              by <span className="text-primary">{obj?.email}</span>
            </span>
          )}
        </p>

      </div>
    );
  };

  /**
   * Define the table columns based on the viewport.
   */
  const columnArray: TableColumnArrayProps[] = useMemo(() => {
    if (phone || tablet) {
      return [
        {
          id: 'keyword',
          Header: 'Keyword',
          accessor: (obj) => <RenderTitle obj={obj} />,
        },
        {
          id: 'guid',
          Header: 'Actions',
          accessor: (obj) => (
            <ContentPlanStatusCell
              plan={obj}
              setDeleteModal={setDeleteModal}
              setNewModal={setNewModal}
              setDuplicateInfo={setDuplicateInfo}
            />
          ),
          headerClassName: 'text-end pe-3',
          cellClassName: 'max-325 p-md-0',
        },
      ];
    } else {
      return [
        {
          id: 'keyword',
          Header: 'Keyword',
          accessor: (obj) => <RenderTitle obj={obj} />,
          disableSortBy: false,
        },
        {
          id: 'timestamp',
          Header: 'Timestamp',
          accessor: (obj) =>
            moment(obj.timestamp + 'Z').format(
              'dddd, MMMM Do, YYYY h:mma'
            ),
          disableSortBy: false,
        },
        {
          id: 'stats',
          Header: 'Stats',
          accessor: obj => <ContentPlanStats postCountClickHandler={postCountClickHandler} outlineCountClickHandler={outlineCountClickHandler} guid={obj.guid} />
        },
        {
          id: 'guid',
          Header: 'Actions',
          accessor: (obj) => (
            <ContentPlanStatusCell
              plan={obj}
              setDeleteModal={setDeleteModal}
              setNewModal={setNewModal}
              setDuplicateInfo={setDuplicateInfo}
            />
          ),
          headerClassName: 'text-end pe-3',
          cellClassName: 'max-325 p-0',
        },
      ];
    }
  }, [phone, tablet, domain_name]);

  // Fetch plans on component mount or when dependencies change
  useEffect(() => {
    if (active && !newModal) {
      fetchPlans();
    }
  }, [domain_name, active, paginator.currentPage, paginator.limit, newModal]);

  return (
    <div className={styles.wrap}>
      {/* Header Section */}
      <div className="row g-3 d-flex justify-content-between align-items-center mb-3">
        <div className="col-12 col-md-auto d-flex justify-content-center align-items-end">
          <h2 className="mb-0">
            <TypeWriterText string="Content Plans" withBlink />
          </h2>
          {paginator?.itemCount > 0 && (
            <p className="badge rounded-pill text-white text-bg-primary ms-3 d-flex align-items-center mb-1">
              {paginator?.itemCount}
            </p>
          )}
        </div>
        <div className="col-12 col-md-auto d-flex justify-content-center align-items-center">
          <div className="input-group">
            <button
              onClick={() => setNewModal(true)}
              className="btn btn-primary"
            >
              <i className="bi bi-plus" />
              New Content Plan
            </button>
            <button
              onClick={() => fetchPlans()}
              disabled={loading}
              className="btn btn-secondary"
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {loading && <LoadSpinner />}
      {data?.length > 0 ? (
        <div className="row d-flex justify-content-center">
          <Table rawData={data} isLoading={loading} columnArray={columnArray} />
          <div className="col-auto d-flex justify-content-center">
            {paginator.renderComponent()}
          </div>
        </div>
      ) : (
        <h5>
          <TypeWriterText
            withBlink
            string="There are no results for the given parameters"
          />
        </h5>
      )}

      {/* Modals */}
      <Modal.Overlay open={newModal} onClose={newCloseHandler} closeIcon>
        <Modal.Title title="New Content Plan" />
        <Modal.Description className={styles.newModal}>
          <ContentPlanForm
            initialData={duplicateInfo}
            buttonLabel="Create Plan"
            submitResponse={newCloseHandler}
            isModal
          />
        </Modal.Description>
      </Modal.Overlay>
      <Modal.Overlay open={deleteModal} onClose={() => setDeleteModal(null)}>
        <Modal.Title title="Delete Plan" />
        <Modal.Description>
          Are you sure you want to delete this plan?
          <div className="d-flex justify-content-between mt-5">
            <button
              onClick={() => setDeleteModal(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                deleteHandler(deleteModal);
              }}
              className="btn btn-primary"
            >
              Yes
            </button>
          </div>
        </Modal.Description>
      </Modal.Overlay>
    </div>
  );
};

export default PlansList;


