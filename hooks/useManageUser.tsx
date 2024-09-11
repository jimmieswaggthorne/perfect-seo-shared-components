import { RootState } from '@/perfect-seo-shared-components/lib/store'
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from 'react'
import { reset, setAdmin, setLoading, setLoggedIn, setUser } from '@/perfect-seo-shared-components/lib/features/User'
import { createClient } from '@/perfect-seo-shared-components/utils/supabase/client'

const useManageUser = (appKey) => {
  const { isLoggedIn, user, isAdmin, isLoading } = useSelector((state: RootState) => state);
  const [userData, setUserData] = useState(null)

  const dispatch = useDispatch();
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select("*")
        .eq('id', user.id)
        .select()
        .then(res => {
          dispatch(setLoading(false))
          if (res.data[0]) {
            setUserData(res.data[0])
            dispatch(setAdmin(res.data[0]?.admin))
          }
        })
    }
    else {
      dispatch(setLoading(false))
    }
  }, [user])

  useEffect(() => {
    if (userData) {

      let domains = [userData?.email?.split("@")[1]]
      if (userData?.user_metadata?.custom_claims) {
        let customClaims = Object.keys(userData?.user_metadata.custom_claims).reduce((prev, curr) => {
          if (userData?.user_metadata?.custom_claims[curr] !== domains[0]) {
            return [...prev, userData?.user_metadata?.custom_claims[curr]]
          }
          else return prev
        }, [])
        domains = [...domains, ...customClaims]
      }

      let products = userData.products;
      let key = appKey;
      if (products) {
        if (products[key]) {
          products[key] = new Date().toISOString()
        }
        else {
          products = { ...products, [key]: new Date().toISOString() }
        }
      }
      let profileObj: any = { meta_data: user, email: user.email, domains: domains, products: products };

      supabase
        .from('profiles')
        .update(profileObj)
        .eq('id', user.id)
        .select()
    }
  }, [userData])

  useEffect(() => {
    if (isLoading !== false) {
      supabase.auth.getUser()
        .then((res) => {
          if (res.data.user === null) {
            dispatch(setLoading(false))
          }
          else if (res.error !== null) {
            dispatch(reset())
          } else {
            dispatch(setLoggedIn(true))
            return dispatch(setUser(res.data.user))
          }
        })
    }
  }, [])
}

export default useManageUser;