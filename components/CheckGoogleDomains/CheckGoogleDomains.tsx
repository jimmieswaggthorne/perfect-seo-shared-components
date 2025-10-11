"use client"
import useGoogleUser from "@/perfect-seo-shared-components/hooks/useGoogleUser";
import { selectDomains } from "@/perfect-seo-shared-components/lib/features/User";
import { useMemo, useState } from "react"
import { useSelector } from "react-redux";
import en from '@/assets/en.json'

const CheckGoogleDomains = () => {
  const domain_access = useSelector(selectDomains)
  const { fetchAllDomains } = useGoogleUser(en.product)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const clickHandler = (e) => {
    setLoading(true)
    e.preventDefault();

    fetchAllDomains()
      .then(res => {
        if (!res) {
          setError("No Domains were returned")
        }
        setLoading(false)
      })
  }

  const domainRenderList = useMemo(() => {
    let consolidatedDomains = {}
    if (domain_access) {

      domain_access.forEach((domain) => {

        let keys = Object.keys(consolidatedDomains) || []
        if (keys.includes(domain.siteUrl)) {
          let access = [...consolidatedDomains[domain.siteUrl], domain.permissionLevel]
          consolidatedDomains[domain.siteUrl] = access
        }
        else {
          consolidatedDomains[domain.siteUrl] = [domain.permissionLevel]
        }
      })
    }
    return { data: consolidatedDomains, keys: Object.keys(consolidatedDomains) }
  }, [domain_access])

  return (
    <div className="card bg-primary p-3">
      <h4 className="text-center">Re-verify Google Search Console Domain Access</h4>
      <div className="card p-3 bg-light mt-3 text-white">
        <h5 className="text-center">Current Domains</h5>
        {Object.keys(domainRenderList)?.length > 0 && <ul className="clear-list-properties d-flex row align-items-center justify-content-start">
          {domainRenderList?.keys?.sort((a, b) => a.localeCompare(b))?.map((domainKey, index) => {
            let permissions = domainRenderList.data[domainKey].join(", ")
            return (<li className="col-12 col-md-4 col-lg-6" key={index} ><span className="text-primary"> {domainKey.replace("sc-domain:", "")}</span><br /> {permissions}</li>
            )
          })
          }
        </ul>}
      </div>
      <div className="text-center d-flex justify-content-center mt-3">
        <button onClick={clickHandler} disabled={loading} className="btn btn-secondary">{loading ? 'verifying' : 're-verify'}</button>
        {error && <span className="text-white">{error}</span>}
      </div>
    </div>
  )
}

export default CheckGoogleDomains