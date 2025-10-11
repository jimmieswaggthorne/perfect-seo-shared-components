import classNames from "classnames";
import Select from "react-select";


export interface SearchSelectProps {
  defaultValue?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  onChange?: (option: any, actionMeta?: any) => void;
  options: any[];
  className?: string;
  components?: any;
  value?: any;
  label?: string;
  [key: string]: any;
}

const SearchSelect = ({
  defaultValue = '',
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  isSearchable = true,
  onChange,
  options,
  className,
  label,
  ...props
}: SearchSelectProps) => {

  const searchSelectClasses = classNames('react-select',
    { [className]: className }
  )
  const labelNode = label ? (
    <label className="formField-label" >
      {label}
    </label>
  ) : null;
  return (
    <div className="formField">
      {labelNode}
      <Select
        className={searchSelectClasses}
        classNamePrefix="select"
        isDisabled={isDisabled}
        isLoading={isLoading}
        isClearable={isClearable}
        isSearchable={isSearchable}
        options={options}
        components={props?.components}
        onChange={onChange}
        value={props?.value}
        {...props}
      />
    </div>
  );
}
export default SearchSelect
