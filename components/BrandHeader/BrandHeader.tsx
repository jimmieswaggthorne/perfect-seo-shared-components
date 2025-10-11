import classNames from "classnames"
import TypeWriterText from "../TypeWriterText/TypeWriterText"
import styles from './BrandHeader.module.scss'
import useLogoCheck from "@/perfect-seo-shared-components/hooks/useLogoCheck"

interface BrandHeaderProps {
  synopsis: any
  editable?: boolean;
}
const BrandHeader = ({ synopsis, editable = true }: BrandHeaderProps) => {
  let domain = synopsis?.domain || synopsis?.domain_name
  const logoCheck = useLogoCheck(synopsis?.logo_url, domain, null, synopsis)

  const logoCardClasses = classNames('p-3 h-100 d-flex align-items-center justify-content-center',
    {
      'd-none': !synopsis?.logo_theme,
      'bg-secondary': synopsis?.logo_theme === 'light',
    }
  )

  if (!synopsis || !domain) return null

  return (
    <div className='container-xl content-fluid py-3'>
      <div className='row d-flex justify-content-between g-3'>
        {synopsis?.logo_url && <div className='col-12 col-lg-4'>
          <div className={logoCardClasses}>
            <div className={styles.logoWrap}>
              <img src={synopsis?.logo_url} />
              {editable && <div className={styles.logoUpdate}>
                <a href={`https://preferencesperfect.ai/domain/${domain}?tab=brand-identity`} className='text-primary' target='_blank'>Update Logo</a>
              </div>}
            </div>
          </div>
        </div>}
        <div className='col'>
          <h1 className="text-start text-primary mb-0"><TypeWriterText string={`Content for ${synopsis?.brand_name || domain}`} withBlink /></h1>
          {synopsis?.synopsis && <div className='card p-3'>
            <div className={styles.synopsis}>
              <div className={styles.synopsisHeader}>
                <strong>Synopsis</strong>
                {editable && <a href={`https://preferencesperfect.ai/domain/${domain}`} className={styles.synopsisUpdate} target='_blank'>Update Synopsis</a>}
              </div>
              <p className='mb-0'>{synopsis?.synopsis}</p>
            </div></div>}
        </div>
      </div>
    </div>
  )
}
export default BrandHeader