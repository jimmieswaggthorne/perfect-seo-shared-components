"use client"
import useGoogleUser from "@/perfect-seo-shared-components/hooks/useGoogleUser";
import { RootState } from "@/perfect-seo-shared-components/lib/store";
import { useMemo, useState } from "react"
import { useSelector } from "react-redux";

const CheckGoogleDomains = () => {
  const { user, isAdmin, isLoading, isLoggedIn, profile, settings } = useSelector((state: RootState) => state);
  const { fetchAllDomains } = useGoogleUser('contentPerfect')
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
    if (profile?.domain_access) {

      profile?.domain_access.forEach((domain) => {

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
  }, [profile?.domain_access])

  return (
    <div className="card bg-primary p-3">
      <h4 className="text-center">Re-verify Google Search Console Domain Access</h4>
      <div className="card p-3 bg-dark mt-3 text-white">
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