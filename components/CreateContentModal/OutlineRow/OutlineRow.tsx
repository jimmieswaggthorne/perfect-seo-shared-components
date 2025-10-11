import styles from './OutlineRow.module.scss';
import TextInput from '@/perfect-seo-shared-components/components/Form/TextInput';
import classNames from 'classnames';
import { Ref, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const DragHandle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="Drag Handle">
      <path id="Vector" d="M4 15V13H20V15H4ZM4 11V9H20V11H4Z" fill="#7E8A95" />
    </g>
  </svg>

);

interface OutlineRowInt {
  rows: number,
  index: number,
  selected: number,
  setSelected: (num: number) => void;
  reorderRow: (dragI: number, dropI: number) => void
  reorderSubheadingRow: (dragI: number, dropI: number, headingI: number) => void,
  addSubheading: (index: number) => void
  deleteHeadingHandler: (index: number) => void
  deleteSubheadingHandler: (headingIndex: number, index: number) => void
  all: boolean,
  isAuthorized: boolean;
}

const OutlineRow = ({ rows,
  index,
  setSelected,
  selected,
  reorderRow,
  reorderSubheadingRow,
  addSubheading,
  deleteHeadingHandler,
  deleteSubheadingHandler,
  isAuthorized,
  all }: OutlineRowInt) => {

  const [subheadingSelected, setSubheadingSelected] = useState<number>(null)

  const [show, setShow] = useState(false)

  const [{ isOver }, dropRef] = useDrop({
    accept: 'row',
    drop: (draggedRow: any) => reorderRow(draggedRow.index, index),
    collect: (monitor) =>
      ({ isOver: monitor?.isOver() }),
  });


  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => ({ index: index }),
    type: 'row',
  });

  const dropRefType = dropRef as unknown as Ref<HTMLDivElement>;
  const dragRefType = dragRef as unknown as Ref<HTMLDivElement>;
  const previewRefType = previewRef as unknown as Ref<HTMLDivElement>;

  useEffect(() => {
    setShow(all)
  }, [all])

  useEffect(() => {
    if (isDragging && index) {
      setSelected(index);
    }
  }, [isDragging, isOver]);

  const addSubheadingHandler = (e) => {
    e.preventDefault();
    addSubheading(index)
  }

  const rowClasses = classNames(styles.row,
    {
      [styles.isOver]: isOver,
      [styles.down]: isOver && index >= selected,
      [styles.up]: isOver && index < selected,
      [styles.dragging]: isDragging,
    });

  const accordionClassname = classNames(
    `${styles.accordionButton}  btn btn-secondary no-outline`,
    { [styles.collapsed]: show }
  )

  const accordionHandler = (e) => {
    e.preventDefault();
    setShow(!show)
  }

  return (
    <div className={rowClasses}>
      <div className={styles.rowBody}>
        <div ref={dropRefType}>
          <div className={styles.rowHeading} ref={previewRefType}>
            <div className={styles.rowTitle} ref={dragRefType}>
              <div className={styles.rowHandle} title="Drag Item">
                <span className={styles.rowIndex}>
                  {index + 1}
                </span>
                {isAuthorized && <DragHandle />
                }
              </div>
              <TextInput fieldName={`heading-${index}`} className={styles.headingInput} bottomSpacing={false} disabled={!isAuthorized} />
              <button onClick={(e) => {
                e.preventDefault();
                deleteHeadingHandler(index)
              }}
                disabled={!isAuthorized}
                className={`${styles.deleteButton} btn btn-primary`}><i className="bi bi-trash" /></button>
              <button className={accordionClassname} onClick={accordionHandler} title={show ? 'Collapse' : 'Expand'}>
                <span className={styles.dropDownArrow}>
                  {show ?
                    <i className="bi bi-caret-up-fill" />
                    : <i className="bi bi-caret-down-fill" />
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className={styles.rowSubsections}>
          {show && new Array(rows).fill(0).map((na, i) => {
            let newKey = `${index}-subheading-${i}`

            return (
              <SubheadingRow
                deleteSubheadingHandler={(idx) => { deleteSubheadingHandler(index, idx) }}
                isAuthorized={isAuthorized}
                headingIndex={index}
                index={i}
                selected={subheadingSelected}
                setSelected={setSubheadingSelected}
                reorderRow={reorderSubheadingRow}
                key={newKey} />
            )
          })}
          <div className={styles.subHeadingHandlerButton}>
            <button disabled={!isAuthorized} onClick={addSubheadingHandler} className="btn btn-primary">+ Add Subheading</button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SubheadingRowInt {
  headingIndex: number,
  index: number,
  selected: number,
  setSelected: (num: number) => void;
  reorderRow: (dragI: number, dropI: number, headingIndex: number) => void,
  deleteSubheadingHandler: (index: number) => void,
  isAuthorized: boolean;
}

const SubheadingRow = ({ headingIndex, index, setSelected, selected, reorderRow, deleteSubheadingHandler, isAuthorized }: SubheadingRowInt) => {

  const [{ isOver }, dropRef] = useDrop({
    accept: 'row',
    drop: (draggedRow: any) => reorderRow(draggedRow.index, index, headingIndex),
    collect: (monitor) =>
      ({ isOver: monitor?.isOver() }),
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => ({ index: index }),
    type: 'row',
  });

  useEffect(() => {
    if (isDragging && index) {
      setSelected(index);
    }
  }, [isDragging, isOver]);

  const dropRefType = dropRef as unknown as Ref<HTMLDivElement>;
  const dragRefType = dragRef as unknown as Ref<HTMLDivElement>;
  const previewRefType = previewRef as unknown as Ref<HTMLDivElement>;

  const subRowClasses = classNames(styles.subRow,
    {
      [styles.isOver]: isOver,
      [styles.down]: isOver && index >= selected,
      [styles.up]: isOver && index < selected,
      [styles.dragging]: isDragging,
    });

  return (
    <div className={subRowClasses}>
      <div className={styles.subRowBody} ref={previewRefType}>
        <div className={styles.subRowHeading} ref={dropRefType}>
          <div className={styles.subRowTitle} ref={dragRefType}>
            <div className={styles.subRowHandle}>
              <span className={styles.subRowIndex}>
                {index + 1}
              </span>
              <DragHandle />
            </div>
            <TextInput disabled={!isAuthorized} fieldName={`${headingIndex}-subheading-${index}`} className={styles.subRowHeadingInput} bottomSpacing={false} />
            {isAuthorized && <button onClick={(e) => {
              e.preventDefault();
              deleteSubheadingHandler(index)
            }} className={`${styles.deleteButton} btn btn-primary`}><i className="bi bi-trash" /></button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OutlineRow