'use client'

import { Suspense } from "react"
import LoadSpinner from "../LoadSpinner/LoadSpinner"
import DomainsList from "./DomainsList"

const DomainManage = () => {

  return (
    <div>
      <Suspense fallback={<LoadSpinner />}>
        <DomainsList />
      </Suspense>
    </div>
  )
}
export default DomainManage