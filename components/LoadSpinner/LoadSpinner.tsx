import classNames from "classnames"

const LoadSpinner = ({ withBackground = true }) => {

  const className = classNames('load-overlay', {
    'with-background': withBackground
  })

  return (
    <div className={className}>
      <div>
        <div className="spinner-border" role="status">
          <span className="d-none">Loading...</span>
        </div>
      </div>
    </div>
  )
}

export default LoadSpinner