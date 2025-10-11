/* eslint-disable no-restricted-globals, import/no-extraneous-dependencies */
import classNames from 'classnames';
import { ReactElement, useEffect, useMemo, useState } from 'react';

import {
  RowPinningState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DraggableRow from './DraggableRow';
import LoadSpinner from '../LoadSpinner/LoadSpinner';


export interface TableColumnArrayProps {
  Header?: string;
  accessor?: any;
  id: string;
  disableSortBy?: boolean;
  sortDescFirst?: boolean;
  headerTextAlign?: string;
  cellTextAlign?: string;
  footerTextAlign?: string;
  cellClassName?: string;
  columnClassName?: string;
  headerClassName?: string;
  sortingFn?: any;
  filter?: (rows, columnIds, filterValue) => any | string,
}

export interface TableSortProps {
  id: string,
  desc: boolean
}

interface TableProps {
  pinnedRows?: any[];
  draggable?: boolean;
  rawData: any[];
  columnArray: TableColumnArrayProps[];
  sortedBy?: TableSortProps[];
  sortTrack?: (TableSortProps) => void;
  hideColumn?: string[]
  rowClassNames?: (any) => void;
  footer?: boolean;
  hideHeader?: boolean;
  isLoading?: boolean;
  className?: string;
  id?: number | string;
  onChange?: (val) => void;
  zeroState?: boolean;
  manualSortBy?: (val) => void,
  rowOnClick?: (any) => void
  reorder?: (any) => void
}

const Table = ({ isLoading,
  rawData,
  columnArray,
  sortedBy,
  sortTrack,
  hideColumn,
  className,
  draggable = false,
  footer = false,
  hideHeader,
  id,
  pinnedRows,
  onChange,
  rowClassNames,
  zeroState = false,
  manualSortBy,
  rowOnClick,
  reorder,
  ...props }: TableProps) => {
  //table states
  const [sorting, setSorting] = useState<SortingState>(sortedBy || []);
  const [data, setData] = useState<Object[]>([]);
  const [selected, setSelected] = useState<number>();
  const [rowPinning, setRowPinning] = useState<RowPinningState>({
    top: pinnedRows || [],
    bottom: [],
  })
  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    data.splice(targetRowIndex, 0, data.splice(draggedRowIndex, 1)[0]);
    if (reorder) {
      reorder([...data]);
    }
    setData([...data]);
  };

  const convertColumnArray = (array) => {
    let newArray = array.map((column) => {
      let newColumn = column;

      if (typeof column.accessor === 'string') {
        newColumn.accessorKey = column.accessor;
      } else if (column.accessor) {
        newColumn.accessorKey = column.id;
        newColumn.cell = (obj) => {
          return column.accessor(obj.row.original, obj.row.index);
        };
      }
      else {
        newColumn.accessorKey = column.id;

      }

      newColumn.header = newColumn.Header;
      if (newColumn?.Footer) {
        newColumn.footer = newColumn.Footer;
      }
      newColumn.enableSorting = newColumn.disableSortBy === false ? true : false;
      return newColumn;
    });

    return newArray;
  };

  const columns = useMemo(() => {
    if (columnArray) {
      return convertColumnArray(columnArray);
    } else {
      return [];
    }
  }, [columnArray]);

  useEffect(() => {
    if (rawData) {
      setData(rawData);
    } else {
      setData([]);
    }
  }, [rawData]);

  const initialState = useMemo(() => {
    if (sortedBy && hideColumn) {
      return { sorting: sortedBy, hiddenColumns: hideColumn };
    }
    else if (hideColumn) {
      return { hiddenColumns: hideColumn };
    }
    else if (sortedBy) {
      setSorting(sortedBy);
      return { sorting: sortedBy };
    }
    else {
      return {}
    }
  }, [sortedBy, hideColumn]);

  const tableInstance = useReactTable({
    columns,
    data,
    state: {
      sorting,
      rowPinning,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: false,
    initialState: initialState,
  });

  const tableWrapClassName = classNames('table-wrap table-responsive',
    { 'loading': isLoading || (data === null && columns === null) || data?.length === 0 || columns?.length === 0 },
  );

  const tableClassName = classNames('table table-responsive',
    {
      [`${className}`]: className,
      'table-drag': draggable,
    },
  );

  return (

    <div className={tableWrapClassName}>
      {isLoading && <LoadSpinner />}
      {(data !== null && columns !== null) && data?.length > 0 && columns?.length > 0 ?
        <table className={tableClassName}>
          {!hideHeader && <thead>
            {tableInstance.getHeaderGroups().map((headerGroup) => {
              return (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => {
                    let { column } = header;

                    let isSorted = column.getIsSorted();

                    let isSortedDesc = isSorted === false ? false : isSorted === 'desc';

                    const columnHeaderClasses = classNames({
                      [`header-align-${column.columnDef.headerTextAlign}`]: column.columnDef.headerTextAlign,
                      [column.columnDef.headerClassName]: column.columnDef.headerClassName,
                      [column.columnDef.columnClassName]: column.columnDef.columnClassName,
                      ['sort']: column.columnDef.enableSorting,
                      ['desc']: isSorted && isSortedDesc,
                      ['asc']: isSorted && !isSortedDesc,
                      'hidden': hideColumn?.includes(header.id),
                    });

                    return (
                      <th
                        title={column.columnDef.enableSorting ? 'Toggle Sorting' : header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={columnHeaderClasses}
                        key={header.id}>
                        {header.isPlaceholder ?
                          null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>}
          <tbody>
            {pinnedRows && tableInstance?.getTopRows()?.map(
              (row, i) => {
                let rowClassName;

                if (rowClassNames) {
                  rowClassName = rowClassNames(row.original);
                }

                if (rowOnClick) {
                  rowClassName = `${rowClassName} onClick`;
                }


                const clickHandler = (e) => {
                  e.preventDefault();
                  if (rowOnClick) {
                    rowOnClick(row.original);
                  }
                };


                return (
                  <tr key={row.id} className={rowClassName} onClick={clickHandler}>
                    {row.getVisibleCells().map((cell: any) => {

                      const cellClasses = classNames('bg-primary', {
                        [cell.column.columnDef.cellClassName]: cell.column.columnDef.cellClassName,
                        [cell.column.columnDef.columnClassName]: cell.column.columnDef.columnClassName,
                        [`cell-align-${cell.column.columnDef.cellTextAlign}`]: cell.column.columnDef.cellTextAlign,
                        'onClick': cell.column.columnDef.onClick,
                        'hidden': hideColumn?.includes(cell.column.columnDef.id),
                      });

                      const onClick = (e) => {
                        e.preventDefault();
                        if (cell.column.columnDef.onClick) {
                          cell.column.columnDef.onClick(row.original);
                        }
                      };

                      return (
                        <td className={cellClasses} key={cell.id} onClick={onClick} data-label={cell.column.columnDef.header}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>);
                    })}
                  </tr>
                );

              }
            )}
            {tableInstance.getCenterRows().map((row, i) => {
              let rowClassName;

              if (rowClassNames) {
                rowClassName = rowClassNames(row.original);
              }

              if (rowOnClick) {
                rowClassName = `${rowClassName} onClick`;
              }

              const clickHandler = (e) => {
                e.preventDefault();
                if (rowOnClick) {
                  rowOnClick(row.original);
                }
              };
              if (draggable) {
                return <DraggableRow selected={selected && selected} setSelected={setSelected} key={row.id} row={row} reorderRow={reorderRow} />;
              } else {
                return (
                  <tr key={row.id} className={rowClassName} onClick={clickHandler}>
                    {row.getVisibleCells().map((cell: any) => {

                      const cellClasses = classNames({
                        [cell.column.columnDef.cellClassName]: cell.column.columnDef.cellClassName,
                        [cell.column.columnDef.columnClassName]: cell.column.columnDef.columnClassName,
                        [`cell-align-${cell.column.columnDef.cellTextAlign}`]: cell.column.columnDef.cellTextAlign,
                        'onClick': cell.column.columnDef.onClick,
                        'hidden': hideColumn?.includes(cell.column.columnDef.id),
                      });

                      const onClick = (e) => {
                        e.preventDefault();
                        if (cell.column.columnDef.onClick) {
                          cell.column.columnDef.onClick(row.original);
                        }
                      };

                      return (
                        <td className={cellClasses} key={cell.id} onClick={onClick} data-label={cell.column.columnDef.header}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>);
                    })}
                  </tr>
                );
              }
            })}

          </tbody>
          {footer && <tfoot>
            {tableInstance.getFooterGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header: any) => {
                  let { column } = header;

                  const cellClasses = classNames({
                    [column.columnDef.footerClassName]: column.columnDef.footerClassName,
                    [`footer-align-${column.columnDef.footerTextAlign}`]: column.columnDef.footerTextAlign,
                  });

                  return (
                    <td className={cellClasses} key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                    </td>
                  );
                },
                )}
              </tr>
            ))}

          </tfoot>}
        </table> : null}
    </div>
  );
};



export default Table;

export const sumFooter = (rows, footKey): number | null => {
  if (rows?.table?.options?.data?.length > 0) {
    return rows.table.options.data.reduce((sum, row) => {
      if (typeof row[footKey] === 'string') {
        let value = row[footKey].includes('$') ? row[footKey].replace('$', "") : row[footKey];

        return parseFloat(value) + sum;
      } else if (typeof row[footKey] === 'number') {
        return sum + row[footKey];
      } else {
        return sum + 0;
      }
    }, 0);
  }
  return null;
};
