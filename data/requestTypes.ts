import { OutlineRowProps, Sitemap } from "./types"

export interface ContentPlanPostRequest {
  content_plan_guid: string,
  post_title: string,
  client_domain: string
}
export interface GetPostOutlineRequest {
  content_plan_guid: string,
  post_title: string,
  client_domain: string,
  client_name: string,
  priority_code?: string,
  entity_voice?: string,
  inspiration_url_1?: string,
  priority1?: 'high' | 'medium' | 'low'
  inspiration_url_2?: string,
  priority2?: 'high' | 'medium' | 'low'
  inspiration_url_3?: string,
  priority3?: 'high' | 'medium' | 'low'
}

export interface SaveContentPost {
  guid?: string,
  content_plan_guid: string,
  post_title: string,
  client_name: string,
  client_domain: string,
  outline_details: {
    sections: OutlineRowProps[]
  }
}

export interface PostOutlineGenerateRequest {
  content_plan_guid: string,
  post_title: string,
  content_plan_keyword: string,
  post_keyword: string,
  domain: string
}

export interface RegeneratePost {
  content_plan_outline_guid: string,
  email?: string,
  receiving_email?: string
}

export interface GenerateContentPost {
  content_plan_outline_guid: string,
  email: string,
  receiving_email: string,
  entity_voice?: string,
  writing_language?: string,
  html_template_url?: string,
  voice_url?: string,
  custom_outline?: string
}

export interface ContentPlanPostRequest {
  content_plan_guid: string,
  post_title: string,
  client_domain: string
}

export interface BrandVoiceResponse {
  freq_phrases: string
  lang_style: string
  lexicon: string
  ling_style: string
  tone: string
  voice_prompt: string
  voice_prompt_logic: string
  voice_traits: string
}
export interface PromoValidationResponse {
  amount_off: number
  cost_per_url: number
  final_cost: number
  minimum_purchase_cost: number
  name: string
  percent_off: number
  savings: number
  total_cost: number
}


export interface DomainResponse {
  sitemap_list: Array<Sitemap>,
  total_sitemap_urls: number,
  total_ahrefs_urls: number,
  max_urls: number

}

export interface MetaRequest {

  optimize_data_guid: string,
  url: string,
  meta_description: string,
  seo_title_tag: string,
  social_media_title_tag: string,
  seo_headline: string,
  social_media_headline: string,
  clarifying_content_subheadline: string,
  seo_product_name: string,
  clarifying_content_blurb: string,
  selected_keywords: string[],
  keyword_logic: string

}


export interface FactCheckRequest {
  model?: string
  file?: any
  content?: string,
  type: string,
  url?: string
}

export interface ProcessTsvUrlResponse {
  message: string;
  guids: string[];
}

export interface SocialPostCreate {
  target_domain: string;
  client_name: string;
  post_url?: string;
  post_content: string;
}

export interface SocialPost extends SocialPostCreate {
  id: string;
  created_date: string;
}

export interface GenerateSocialPostProps {
  uuid: string,
  target_domain: string,
  client_name: string,
  post_url: string,
  platform: string,
  post_content: string
}

export interface PaginationRequest {
  limit?: number,
  page?: number
}

export interface DateRangeRequest {
  start_date: string,
  end_date: string,
}
export interface DateAndPageRequest extends DateRangeRequest, PaginationRequest { }

export interface GSCRequest extends DateAndPageRequest {
  domain: string,
  page_url?: string,
  keyword?: boolean,
}

export interface PageRequest extends DateAndPageRequest {
  page_url: string
}
export interface DomainReportsRequest extends DateAndPageRequest {
  domain: string,
}

export interface GSCTotalsRequest extends DateRangeRequest {
  domain: string,
  limit: number
}

