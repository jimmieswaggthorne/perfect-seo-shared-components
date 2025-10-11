
import { ContentIncomingProps, ContentRequestFormProps } from "@/perfect-seo-shared-components/data/types"
import { defaultPrompts } from "../data/defaults"


export const urlSanitization = (url: string): string => {
  if (!url) return ""
  let newUrl = url.replaceAll("https://", "").replaceAll("http://", "").replaceAll("www.", "").replaceAll("//", "")
  newUrl = newUrl.split("/")[0]
  return newUrl?.replaceAll("/", "")?.toLowerCase()?.replaceAll("sc-domain:", "")
}

export const trimSynopsis = (synopsis: any) => {

  let emptyObject = {
    service_1_category: "Service Category 1",
    service_1_url: "Service URL 1",
    service_3_category: "Service Category 3",
    service_3_url: "Service URL 3",
    product_1_name: "Product 1",
    product_1_url: "Product URL 1",
    product_2_name: "Product 2",
    product_2_url: "Product URL 2",
    product_3_name: "Product 3",
    product_3_url: "Product URL 3",
    service_2_category: "Service Category 2",
    service_2_url: "Service URL 2"
  }

  let emptyKeys = Object.keys(emptyObject)

  let newData: any = Object.keys(synopsis).reduce((prev, key) => {
    if (emptyKeys.includes(key) && synopsis[key] === emptyObject[key]) {
      return prev
    }
    else {

      return { ...prev, [key]: synopsis[key] }

    }
  }, {})
  return newData
}


export const findUniqueKeys = (newObj, oldObj) => {
  let keys = Object.keys(newObj)
  let finalObj = keys.reduce((prev, curr) => {

    if (newObj[curr] && keys.includes(curr) === false) {
      return ({ ...prev, [curr]: newObj[curr] })
    }
    else if (newObj[curr] !== oldObj[curr]) {
      return ({ ...prev, [curr]: newObj[curr] })
    } else if (newObj[curr] === false) {
      return ({ ...prev, [curr]: false })
    }
    else if (!oldObj[curr]) {
      return ({ ...prev, [curr]: newObj[curr] })
    }
    else {
      return prev
    }
  }, {})
  return finalObj
}

export const getAverage = (arr: number[]) => {
  let quantity = arr.length;
  let sum = arr.reduce((prev, curr) => prev + curr, 0)

  return sum / quantity
}


export const convertArrayToObject = (arr: any[]) => {
  let obj = arr.reduce((prev, curr) => {
    return ({ ...prev, [curr.key]: curr.value })
  }, {})
  return obj
}



export const convertFormDataToOutgoing = (data: ContentRequestFormProps): ContentIncomingProps => {
  return ({
    email: data.email,
    domain_name: data?.domainName && urlSanitization(data?.domainName),
    brand_name: data?.brandName,
    target_keyword: data?.targetKeyword,
    priority_code: data?.priorityCode && urlSanitization(data?.priorityCode),
    entity_voice: data?.entityVoice,
    inspiration_url_1: data?.url1,
    priority1: data?.priority1,
    inspiration_url_2: data?.url2,
    priority2: data?.priority2,
    inspiration_url_3: data?.url3,
    priority3: data?.priority3,
    writing_language: data?.writing_language
  })

}

export const convertIncomingToFormData = (data: ContentIncomingProps) => {
  return (
    {
      email: data?.email,
      domainName: data?.domain_name,
      brandName: data?.brand_name,
      targetKeyword: data?.target_keyword,
      priorityCode: data?.priority_code,
      entityVoice: data?.entity_voice,
      url1: data?.inspiration_url_1,
      priority1: data?.priority1,
      url2: data?.inspiration_url_2,
      priority2: data?.priority2,
      url3: data?.inspiration_url_3,
      priority3: data?.priority3,
      writing_language: data?.writing_language
    }
  )
}

export function text2Binary(text) {
  return text.split('').map((char) => char.charCodeAt(0).toString(2)).join(' ');
}

export function keyToLabel(text: string, capAll?: boolean) {
  let newText = '';
  if (capAll) {
    newText = text.split("_").map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(" ")
  }
  else {
    newText = text.replaceAll("_", " ")
  }
  return newText

}


export const mapObject = (obj, exclude_keys?) => {
  let newObject = obj;
  if (exclude_keys) {
    newObject = Object.keys(obj).reduce((acc, key) => {
      if (!exclude_keys.includes(key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {})
  }

  if (typeof newObject !== 'object' || newObject === null) {
    return 'Input is not an object';
  }
  else if (Array.isArray(newObject)) {
    return 'Input is an array';
  }
  else {
    return Object.keys(newObject).map((key) => {
      return `${key}: ${newObject[key]}`;
    }).join('---');
  }
}
