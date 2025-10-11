import { Claim } from "@/perfect-seo-shared-components/data/types"

interface ClaimResultProps {
  claim: Claim
}

const ClaimResult = ({ claim }: ClaimResultProps) => {

  const renderHeader = () => {
    // return <h5 className="card-header bg-primary p-3 text-light text-center">{claim?.result}</h5>
    switch (claim.result) {
      case 'fully supported by the sources':
        return <h5 className="card-header bg-success p-3 text-center">Fully Supported</h5>
      case 'not supported by the sources':
        return <h5 className="card-header bg-danger p-3 text-center">Not Supported</h5>
      case 'partially supported by the sources':
        return <h5 className="card-header bg-warning p-3 text-light text-center">Partially Supported</h5>
      default:
        return <h5 className="card-header bg-primary p-3 text-light text-center">{claim?.result}</h5>
    }
  }
  return (
    <li className="col-12 col-md-6">
      <div className='card bg-secondary'>
        {renderHeader()}
        <div className="card-body text-center">
          <p><strong className='text-warning me-2'>Claim</strong><br /><i>&quot;{claim.claim}&quot;</i></p>
          <p className="preserve-spacing"><strong className='text-warning me-2'>Explanation</strong><br /> {claim.explanation}</p>
          {claim.suggestion && <p className="preserve-spacing"><strong className='text-warning me-2'>Suggestion</strong><br /> {claim.suggestion}</p>}
          {claim.result && <p><strong className='text-warning me-2'>Suggestion</strong><br /> {claim.result}</p>}
        </div>
      </div>
    </li>
  )
}
export default ClaimResult;