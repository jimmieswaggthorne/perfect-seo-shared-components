'use client'
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import classNames from "classnames";
import Form from "@/perfect-seo-shared-components/components/Form/Form";
import TextInput from "@/perfect-seo-shared-components/components/Form/TextInput";
import * as Select from "@/perfect-seo-shared-components/components/Form/Select";
import SearchSelect from "@/perfect-seo-shared-components/components/SearchSelect/SearchSelect";
import { domainValidator, emailValidator } from "@/perfect-seo-shared-components/utils/validators";
import { addIncomingPlanItem, getSynopsisInfo } from "@/perfect-seo-shared-components/services/services";
import { convertFormDataToOutgoing, urlSanitization } from "@/perfect-seo-shared-components/utils/conversion-utilities";
import useForm from "@/perfect-seo-shared-components/hooks/useForm";
import { createClient } from "@/perfect-seo-shared-components/utils/supabase/client";
import { selectDomains, selectEmail, selectIsAdmin, selectIsLoggedIn } from "@/perfect-seo-shared-components/lib/features/User";
import { ContentRequestFormProps } from "@/perfect-seo-shared-components/data/types";
import styles from "./ContentPlanForm.module.scss";

// 2. Constants and Options
const blankFormData: ContentRequestFormProps = {
  email: "",
  domainName: "",
  brandName: "",
  targetKeyword: "",
};

const blankForm: Partial<ContentRequestFormProps> = {
  priority1: "high",
  priority2: "high",
  priority3: "high",
};

const languageOptions = [
  "English", "Arabic", "Bengali", "Bulgarian", "Chinese (Simplified)", "Chinese (Traditional)", "Czech", "Danish", "Dutch", "English", "Finnish", "French", "German", "Greek", "Hebrew", "Hindi", "Hungarian", "Indonesian", "Italian", "Japanese", "Korean", "Malay", "Norwegian", "Polish", "Portuguese", "Romanian", "Russian", "Slovak", "Spanish", "Swedish", "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese"
].map((language) => ({ label: language, value: language }))

// 3. Types/Interfaces
interface ContentPlanFormProps {
  buttonLabel: string,
  initialData?: ContentRequestFormProps
  submitResponse: (guid?) => void
  isModal?: boolean
}

// 4. Main Component
const ContentPlanForm = ({ buttonLabel, initialData, submitResponse, isModal }: ContentPlanFormProps) => {
  // Redux Selectors
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const email = useSelector(selectEmail);
  const isAdmin = useSelector(selectIsAdmin);
  const domain_access = useSelector(selectDomains);

  // State Hooks
  const [selected, setSelected] = useState({ label: 'English', value: 'English' });
  const [domainSelected, setDomainSelected] = useState(null);
  const [load, setLoad] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [domains, setDomains] = useState([]);

  // Hooks
  const form = useForm();
  const supabase = createClient();

  // 5. Handlers
  const checkDomain = (domain) => {
    supabase
      .from('domains')
      .select("*")
      .eq('domain', urlSanitization(domain))
      .select()
      .then(res => {
        if (res.data.length === 0) {
          console.log("Domain not found")
          supabase
            .from('domains')
            .insert([
              { 'domain': urlSanitization(domain) }
            ])
            .select()
            .then(res => { console.log(res) })
        }
      })
  }

  const clickHandler = (e) => {
    setLoad(true);
    e.preventDefault();
    let validateFields = isLoggedIn ? ["email"] : ["email", "domainName"];
    if (form.validate({ validatorFields: validateFields, requiredFields: ['email', 'brandName', 'targetKeyword'] })) {
      let newData = JSON.stringify(form.getState);
      localStorage.setItem("formData", newData);
      checkDomain(form.getState.domainName);
      supabase
        .from('user_history')
        .insert({ email: email, domain: form?.getState?.domainName, transaction_data: form.getState, product: 'contentPerfect', type: "CREATE", action: "Create Plan" })
        .select('*')
        .then(res => { })
      addIncomingPlanItem(
        convertFormDataToOutgoing(form.getState as ContentRequestFormProps),
      )
        .then(async (res) => {
          if (res.data.guid) {
            setLoad(false);
            submitResponse(res.data.guid);
          }
        })
        .catch((err) => {
          console.log(err);
          setLoad(false);
        });
    } else {
      setLoad(false);
    }
  };

  const clickAdvancedHandler = (e) => {
    e.preventDefault();
    setShowAdvanced((showing) => !showing);
  };

  const languageChangeHandler = (e) => {
    setSelected(e);
    let formState = form.getState;
    formState.writing_language = e.value;
    form.setState(formState)
  }

  const searchButton = () => {
    const clickHandler = (e) => {
      e.preventDefault();
      setShowSearch(true)
    }
    return (
      <button className="btn-primary" onClick={clickHandler}>
        <i className="bi bi-search text-primary" />
      </button>
    )
  }

  const fetchDomains = () => {
    supabase
      .from("domains")
      .select("*")
      .then((res) => {
        if (res.data?.length > 0) {
          setDomains(res?.data?.sort((a, b) => a?.domain?.localeCompare(b?.domain)));
        }
      });
  };

  const searchDomainChangeHandler = (e) => {
    setDomainSelected(e)
    if (e) {
      supabase
        .from('pairs') // Replace with your actual table name
        .select('value')
        .eq('key', 'brand_name')
        .eq('domain', e.value)
        .order('last_updated', { ascending: false })
        .then(res => {
          form.setState({ ...form.getState, brandName: res.data[0].value, domainName: e.value })
        })
    }

  };

  // 6. Effects
  useEffect(() => {
    let formState = blankForm;
    if (email) {
      formState.email = email
    }
    form.setState(formState);
  }, [email])

  useEffect(() => {
    if (initialData) {
      if (!initialData?.brandName) {
        getSynopsisInfo(initialData?.domainName)
          .then((res) => {
            if (res.data) {
              let data: any = res.data[0]
              form.setState({ ...initialData, brandName: data?.brand_name })
            }
          })
      } else {
        form.setState(initialData)
      }
    }
  }, [initialData])

  useEffect(() => {
    if (isAdmin) {
      fetchDomains();
    }
  }, [isAdmin])

  // 7. Memoized Values
  const domainsList = useMemo(() => {
    let list: any = []
    if (isAdmin) {
      list = [...list, ...domains?.sort((a, b) => a.domain.localeCompare(b.domain)).map(({ domain }) => ({ label: domain, value: domain }))
      ]
    } else if (domain_access?.length > 0) {
      list = [...list, ...domain_access.map((domain) => {
        return domain?.siteUrl?.toLowerCase()
      })].sort((a, b) => a?.localeCompare(b)).map((domain) => {
        checkDomain(domain)
        return ({ label: domain, value: domain })
      });
    }
    if (list?.length > 0) {
      list = list.reduce((acc, current) => {
        if (!acc.find(item => item.value === current.value)) {
          return [...acc, current]
        } else {
          return acc
        }
      }, [])
    }
    return list
  }, [domain_access, domains, isAdmin])

  // 8. Render
  return (
    <div className="w-100">
      <Form controller={form}>
        <div className="row g-3">
          <div className="form-group col-12 col-md-6">
            <label htmlFor="email">
              Email
              <span className={styles.subLabel}>
                Where are we sending the content?
              </span>
            </label>
            <TextInput validator={emailValidator} autoComplete="email" required fieldName="email" />
          </div>
          <div className="form-group col-12 col-md-6">
            <label htmlFor="domainName">
              Website
              <span className={styles.subLabel}>
                Which website is this going on?
              </span>
            </label>
            {showSearch ?
              <div className="d-flex align-items-center">
                <SearchSelect
                  onChange={searchDomainChangeHandler}
                  options={domainsList}
                  isLoading={!domainsList}
                  value={domainSelected || null}
                  placeholder="Select a Domain"
                  bottomSpacing={false}
                  fieldName="domainName"
                  className='w-100 mt-1'
                />
                <button className="btn btn-secondary h-100" title="Close Search" onClick={() => setShowSearch(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              : <TextInput validator={domainValidator} fieldName="domainName" required button={searchButton()} />}

          </div>
          <div className="form-group col-12 col-md-6">
            <label htmlFor="brandName">
              Brand
              <span className={styles.subLabel}>
                What’s the brand name?
              </span>
            </label>
            <TextInput fieldName="brandName" required />
          </div>
          <div className="form-group col-12 col-md-6">
            <label htmlFor="targetKeyword">
              <div>
                Keyword <i className="text-primary">*</i>
              </div>
              <span className={styles.subLabel}>What’s the topic?</span>
            </label>
            <TextInput fieldName="targetKeyword" required />
          </div>
        </div>
        {/* <!-- Advanced section that is hidden by default --> */}
        {showAdvanced && (
          <div className="row g-3" id="advancedSection">
            <div className="form-group col-12 col-md-6 col-lg-4">
              <label htmlFor="entityVoice">Entity Voice</label>
              <TextInput fieldName="entityVoice" />
            </div>
            <div className="form-group col-12 col-md-6 col-lg-4">
              <label htmlFor="priorityCode">Priority Code</label>
              <TextInput fieldName="priorityCode" />
            </div>
            <div className="form-group col-12 col-md-6 col-lg-4">
              <label htmlFor="writing_language">Writing Language</label>
              <SearchSelect value={selected} onChange={languageChangeHandler} options={languageOptions} fieldName="writing_language" isClearable={false} isSearchable={true} />
            </div>
            <h4>URLs for Inspiration</h4>
            <div className="col-12">
              <div className="row">
                <div className="col">
                  <label>URL 1</label>
                  <TextInput fieldName="url1" />
                </div>
                <div className="col-auto">
                  <label>Priority</label>
                  <Select.Select fieldName="priority1">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select.Select>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="row">
                <div className="col">
                  <label>URL 2</label>
                  <TextInput fieldName="url2" />
                </div>
                <div className="col-auto">
                  <label>Priority</label>
                  <Select.Select fieldName="priority2">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select.Select>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="row">
                <div className="col">
                  <label>URL 3</label>
                  <TextInput fieldName="url3" />
                </div>
                <div className="col-auto">
                  <label>Priority</label>
                  <Select.Select fieldName="priority3">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select.Select>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* <!-- Advanced section link --> */}
        <div className="mb-3 text-center">
          <a onClick={clickAdvancedHandler} id="advancedLink">
            {showAdvanced ?
              <span>
                <i className='bi bi-caret-up-fill' /> Hide Advanced
              </span>
              :
              <span>
                <i className='bi bi-caret-down-fill' /> Show Advanced
              </span>}
          </a>
        </div>
        <div className="text-center justify-content-center d-flex flex-column align-items-center">
          <div>
            <button
              id="startButton"
              className={classNames("btn btn-primary", {
                "btn-secondary": load,
              })}
              disabled={load}
              onClick={clickHandler}
              type="submit"
            >
              {buttonLabel}
            </button>
          </div>
          {isModal &&
            <p className="mt-3 text-dark"><small>*Please note it may take up to 5 minutes for your new plan to appear on you plans list.</small></p>}
        </div>
      </Form>
    </div>
  )
}

export default ContentPlanForm