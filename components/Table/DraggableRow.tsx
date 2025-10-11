import { Row, flexRender } from '@tanstack/react-table';
import classNames from 'classnames';
import { FC, Ref, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';


export const DragHandle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="Drag Handle">
      <path id="Vector" d="M4 15V13H20V15H4ZM4 11V9H20V11H4Z" fill="#7E8A95" />
    </g>
  </svg>

);

const DraggableRow: FC<{
  row: Row<Object>,
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void,
  selected?: number | null,
  setSelected: (val: number) => void,
}> = ({ row, reorderRow, selected = 0, setSelected }) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: 'row',
    drop: (draggedRow: Row<Object>) => reorderRow(draggedRow.index, row.index),
    collect: (monitor) =>
      ({ isOver: monitor?.isOver() }),
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => row,
    type: 'row',
  });

  useEffect(() => {
    if (isDragging && row) {
      setSelected(row?.index);
    }
  }, [isDragging, isOver]);

  const dropRefType = dropRef as unknown as Ref<HTMLDivElement>;
  const dragRefType = dragRef as unknown as Ref<HTMLDivElement>;
  const previewRefType = previewRef as unknown as Ref<HTMLDivElement>;

  const rowClasses = classNames('table-drag-row-wrapper',
    {
      'table-drag-row-hover': isOver,
      'down': isOver && selected && row.index >= selected,
      'up': isOver && selected && row.index < selected,
      'dragging': isDragging,
    });

  return (
    <div className={rowClasses}>
      <div
        className="table-drag-row"
        ref={dropRefType}

      >
        <div className="table-drag-row-wrap" ref={previewRefType}>
          <div ref={dragRefType} className="table-drag-row-wrap">
            {row.getVisibleCells().map(cell => (

              <div key={cell.id} className="table-drag-row-cell">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
            <div className="table-drag-row-button">
              <DragHandle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableRow;