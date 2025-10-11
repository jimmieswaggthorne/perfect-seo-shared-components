import axiosInstance from "@/perfect-seo-shared-components/utils/axiosInstance";
import * as Request from "@/perfect-seo-shared-components/data/requestTypes";
import { urlSanitization } from "@/perfect-seo-shared-components/utils/conversion-utilities";
import axios from "axios";
import { PaginationRequest } from "@/perfect-seo-shared-components/data/types";
import { createClient } from "../utils/supabase/client";

/**
 * ================================================================================
 * PERFECT SEO SHARED SERVICES
 * ================================================================================
 * This file contains all API service functions used across Perfect SEO applications.
 * Services are organized by usage frequency and application coverage.
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_LOGGING: Set to 'true' to enable dev console logging
 * - NODE_ENV: Used to determine if logging should be enabled in development
 * 
 * Application Usage Summary:
 * - SEOPerfect: Landing page app - Does NOT directly use services (uses shared components only)
 * - contentPerfect: Content generation app - Heavily uses most services
 * - preferencesPerfect: Domain preferences app - Uses subset of services
 * - socialPerfect: Social media app - Uses social-specific services
 * - indexPerfect: URL indexing app - Uses indexing-specific services
 * 
 * Usage Categories:
 * 1. High Usage (Multiple Apps) - Core services used extensively across contentPerfect and preferencesPerfect
 * 2. Medium Usage (Multiple Apps) - Moderately used services across applications
 * 3. Single App Usage - Services used only in one application
 * 4. Unused Services - Legacy services with no current references
 * ================================================================================
 */

export interface PlanItemProps {
  brand_name: string;
  domain_name: string;
  email: string;
  entity_voice?: string;
  inspiration_url_1?: string;
  inspiration_url_2?: string;
  inspiration_url_3?: string;
  priority1?: "high" | "medium" | "low";
  priority2?: "high" | "medium" | "low";
  priority3?: "high" | "medium" | "low";
  target_keyword?: string;
}

// ================================================================================
// CONFIGURATION & UTILITIES
// ================================================================================

const supabase = createClient();
const API_URL = "https://planperfectapi.replit.app";
const NEW_CONTENT_API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api`;

const headers = {
  "X-API-Key": process.env.NEXT_PUBLIC_API_KEY,
  "Content-Type": "application/json",
};

const newContentAPIHeader = {
  "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

/**
 * Development logging utility - only logs when NEXT_PUBLIC_API_LOGGING=true or NODE_ENV=development
 */
const devLog = {
  request: (serviceName: string, data: any) => {
    if (process.env.NEXT_PUBLIC_API_LOGGING === 'true' || process.env.NODE_ENV === 'development') {
      console.log(`🚀 [${serviceName}] Request:`, data);
    }
  },
  response: (serviceName: string, response: any) => {
    if (process.env.NEXT_PUBLIC_API_LOGGING === 'true' || process.env.NODE_ENV === 'development') {
      console.log(`✅ [${serviceName}] Response:`, response);
    }
  },
  error: (serviceName: string, error: any) => {
    if (process.env.NEXT_PUBLIC_API_LOGGING === 'true' || process.env.NODE_ENV === 'development') {
      console.error(`❌ [${serviceName}] Error:`, error);
    }
  }
};

const parseQueries = (obj: object) => {
  return Object.keys(obj).reduce(
    (prev, curr, i) => {
      if (i === Object.keys(obj).length - 1) {
        return prev + curr + "=" + obj[curr]
      }
      else {
        return prev + curr + "=" + obj[curr] + "&"
      }
    },
    "?",
  );
};

// ================================================================================
// HIGH USAGE SERVICES (Multiple Apps)
// ================================================================================
// These services are heavily used across multiple applications and are core to functionality

/**
 * Get synopsis information for a domain - core data retrieval service for synopsisPerfect
 * Used extensively in StatusActionBar, CreateContentModal, OutlineItem, DashboardPage
 * In preferencesPerfect: Used in DashboardPage for domain configuration data retrieval
 * In socialPerfect: Used in SocialInput.tsx and SettingsPage.tsx for brand context and domain configuration
 * USAGE: contentPerfect (13+ matches), preferencesPerfect (DashboardPage), socialPerfect (SocialInput, SettingsPage)
 * SEOPerfect: Not directly used - app is landing page only with no domain-specific functionality
 */
export const getSynopsisInfo = (domain: string) => {
  devLog.request('getSynopsisInfo', { domain });

  const response = supabase
    .from('pairs')
    .select('key, value, last_updated')
    .eq('domain', domain)
    .order('last_updated', { ascending: false })
    .then((res) => {
      if (res?.data.length === 0) {
        const result = { data: [], error: { message: 'No data found for the provided domain' } };
        devLog.response('getSynopsisInfo', result);
        return result;
      }
      const result: any = res.data.reduce((acc, { key, value }) => {
        if (!acc[key]) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const finalResult = { ...res, data: [result] };
      devLog.response('getSynopsisInfo', finalResult);
      return finalResult;
    });

  return response;
};

/**
 * Generate comprehensive schema markup for content outlines
 * Used extensively in StatusActionBar and multiple content generation workflows
 * USAGE: contentPerfect (16+ matches), preferencesPerfect (16+ matches)
 * SEOPerfect: Not used - app has no content generation functionality
 */
export const generateSchema = (content_plan_outline_guid: string) => {
  devLog.request('generateSchema', { content_plan_outline_guid });

  const response = axiosInstance.post('/api/post/generate-schema', { content_plan_outline_guid });
  response.then(res => devLog.response('generateSchema', res)).catch(err => devLog.error('generateSchema', err));

  return response;
};

/**
 * Update impression data for domain analytics
 * Used in StatusActionBar and PostsList for tracking user engagement
 * In preferencesPerfect: Used in DashboardPage and useLogoCheck hook for domain analytics
 * In socialPerfect: Used in SettingsPage.tsx for domain configuration and usage analytics
 * USAGE: contentPerfect (5+ matches), preferencesPerfect (DashboardPage, useLogoCheck), socialPerfect (SettingsPage)
 * SEOPerfect: Not used - app has no domain-specific analytics or impression tracking
 */
export const updateImpression = (domain: string, obj: any) => {
  devLog.request('updateImpression', { domain, obj });

  let newData = Object.keys(obj).reduce((prev, curr) => {
    let newObj = { domain: domain, key: curr, value: obj[curr] }
    return [...prev, newObj]
  }, [])

  const response = supabase
    .from('pairs')
    .upsert(newData)
    .eq('domain', domain)
    .select('*')
    .then((res) => {
      let newRes = res;
      newRes.data = [res.data.reduce((prev, curr) => ({ ...prev, [curr.key]: curr.value }), {})]
      devLog.response('updateImpression', newRes);
      return newRes;
    });

  return response;
};

/**
 * Fetch outline status information for tracking content generation progress
 * Used in StatusActionBar and OutlinesList for real-time status updates
 * USAGE: contentPerfect (8+ matches), preferencesPerfect (8+ matches)
 */
export const fetchOutlineStatus = (guid: string) => {
  devLog.request('fetchOutlineStatus', { guid });

  const response = supabase
    .from('content_plan_outline_statuses')
    .select('*')
    .order('timestamp', { ascending: false })
    .eq('outline_guid', guid);

  response.then(res => devLog.response('fetchOutlineStatus', res));
  return response;
};

/**
 * Fetch detailed outline data for content generation
 * Used in StatusActionBar and OutlinesList for content management
 * USAGE: contentPerfect (7+ matches), preferencesPerfect (7+ matches)
 */
export const fetchOutlineData = (guid: string) => {
  devLog.request('fetchOutlineData', { guid });

  const response = supabase
    .from('content_plan_outlines')
    .select('*')
    .eq('guid', guid);

  response.then(res => devLog.response('fetchOutlineData', res));
  return response;
};

/**
 * Create new content posts from outline data
 * Core content generation service used throughout both applications
 * In preferencesPerfect: Used in OutlineItem, CreateContentModal, and StatusActionBar components
 * USAGE: contentPerfect (6+ matches), preferencesPerfect (OutlineItem, CreateContentModal, StatusActionBar)
 */
export const createPost = (reqObj: Request.GenerateContentPost) => {
  devLog.request('createPost', reqObj);

  const response = axiosInstance.post(
    `https://content-v5.replit.app/generate_content_from_outline_guid`,
    reqObj
  );

  response.then(res => devLog.response('createPost', res)).catch(err => devLog.error('createPost', err));
  return response;
};

/**
 * Regenerate existing outline content with updated parameters
 * Used for content refinement and updates
 * USAGE: contentPerfect (4+ matches), preferencesPerfect (4+ matches)
 */
export const regenerateOutline = (content_plan_outline_guid: string, other?: any) => {
  devLog.request('regenerateOutline', { content_plan_outline_guid, other });

  let reqObj: any = {
    guid: content_plan_outline_guid,
  }

  if (other) {
    reqObj = { ...reqObj, ...other }
  }
  if (reqObj?.domain) {
    reqObj.client_domain = reqObj?.domain
    delete reqObj?.domain
  }

  const response = axiosInstance.post(
    `https://planperfectapi.replit.app/regenerate_outline`,
    reqObj
  );

  response.then(res => devLog.response('regenerateOutline', res)).catch(err => devLog.error('regenerateOutline', err));
  return response;
};

/**
 * Regenerate existing post content with updated parameters
 * Used for content refinement and updates
 * USAGE: contentPerfect (4+ matches), preferencesPerfect (4+ matches)
 */
export const regeneratePost = (guid: string, other?: any) => {
  devLog.request('regeneratePost', { guid, other });

  let reqObj = {
    content_plan_outline_guid: guid,
  }

  if (other) {
    reqObj = { ...reqObj, ...other }
  }

  const response = axiosInstance.post(
    `https://content-v5.replit.app/generate_content_from_outline_guid`,
    reqObj
  );

  response.then(res => devLog.response('regeneratePost', res)).catch(err => devLog.error('regeneratePost', err));
  return response;
};

// ================================================================================
// GOOGLE INDEXING API SERVICES (Index Perfect)
// ================================================================================
// Services specifically for Google Indexing API operations in Index Perfect app

/**
 * Submit a URL to Google for indexing
 * Used in BulkUploadTab and individual URL submission workflows
 * USAGE: indexPerfect (multiple matches across indexing workflows)
 */
export const indexUrl = async (url: string, user?: string, contentPlanOutlineGuid?: string, reindex?: boolean) => {
  devLog.request('indexUrl', { url, user, contentPlanOutlineGuid, reindex });

  try {
    const response = await fetch('/api/index-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        contentPlanOutlineGuid,
        reindex,
        user
      })
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      devLog.error('indexUrl', error);
      throw error;
    }

    const data = await response.json();
    devLog.response('indexUrl', data);
    return data;
  } catch (error) {
    devLog.error('indexUrl', error);
    throw error;
  }
};

/**
 * Submit multiple URLs to Google for indexing in batch
 * Used in BulkUploadTab for processing multiple URLs efficiently
 * USAGE: indexPerfect (BulkUploadTab batch processing)
 */
export const indexUrlsBatch = async (urls: string[], user?: string, batchSize: number = 5) => {
  devLog.request('indexUrlsBatch', { urls: urls.length, user, batchSize });

  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPromises = batch.map(url => indexUrl(url, user));

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      devLog.error('indexUrlsBatch', error);
      throw error;
    }
  }

  devLog.response('indexUrlsBatch', results);
  return results;
};

/**
 * Check the indexation status of a URL using Google's API
 * Used in useIndex hook and AllUrlsTab for status verification
 * USAGE: indexPerfect (status checking workflows)
 */
export const checkIndexationStatus = async (url: string, user?: string) => {
  devLog.request('checkIndexationStatus', { url, user });

  try {
    const { data, error } = await supabase.functions.invoke('check-indexation', {
      body: { url, user },
    });

    if (error) {
      devLog.error('checkIndexationStatus', error);
      throw error;
    }

    devLog.response('checkIndexationStatus', data);
    return data;
  } catch (error) {
    devLog.error('checkIndexationStatus', error);
    throw error;
  }
};

/**
 * Get URL display data including submission history and indexation status
 * Used in AllUrlsTab and dashboard for comprehensive URL information
 * USAGE: indexPerfect (URL management and display)
 */
export const getUrlDisplayData = async (domain?: string, user?: string) => {
  devLog.request('getUrlDisplayData', { domain, user });

  try {
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (user) params.append('user', user);

    const response = await fetch(`/api/url-display-data?${params.toString()}`);

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      devLog.error('getUrlDisplayData', error);
      throw error;
    }

    const data = await response.json();
    devLog.response('getUrlDisplayData', data);
    return data;
  } catch (error) {
    devLog.error('getUrlDisplayData', error);
    throw error;
  }
};

/**
 * Validate if a string is a valid URL
 * Used in BulkUploadTab for URL validation and header detection
 * USAGE: indexPerfect (URL validation across components)
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    // Also check for relative URLs or URLs without protocol
    return /^(https?:\/\/|www\.|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,})/i.test(url.trim());
  }
};

/**
 * Process CSV content and extract URLs with header detection
 * Used in BulkUploadTab for file upload processing
 * USAGE: indexPerfect (file upload and processing)
 */
export const processCsvUrls = (content: string, forceSkipHeader: boolean = false) => {
  devLog.request('processCsvUrls', { contentLength: content.length, forceSkipHeader });

  let urlLines = content.split('\n')
    .filter(url => url.trim() !== '')
    .map(url => url.trim());

  // Auto-detect header: if first row doesn't look like a URL, remove it
  if (urlLines.length > 0 && !validateUrl(urlLines[0])) {
    urlLines = urlLines.slice(1);
  }

  // Remove header if forced to skip
  if (forceSkipHeader && urlLines.length > 0) {
    urlLines = urlLines.slice(1);
  }

  const result = {
    urls: urlLines,
    detectedHeader: urlLines.length > 0 && !validateUrl(content.split('\n')[0]?.trim()),
    processedCount: urlLines.length
  };

  devLog.response('processCsvUrls', result);
  return result;
};

// ================================================================================
// SOCIALPERFECT SERVICES
// ================================================================================
// Services specifically used by socialPerfect for social media post generation and management

/**
 * Get social content from URL for social media post generation
 * Extracts readable content from web pages for social media processing
 * In socialPerfect: Used in SocialInput.tsx to fetch page content before creating social posts
 * USAGE: socialPerfect (SocialInput content extraction)
 */
export const getSocialContent = (url: string) => {
  devLog.request('getSocialContent', { url });

  const response = axiosInstance.post('https://socialperfectapi.replit.app/get-content', { url });
  response.then(res => devLog.response('getSocialContent', res)).catch(err => devLog.error('getSocialContent', err));

  return response;
};

/**
 * Create social media post with platform-specific content generation
 * Generates social media posts for multiple platforms (Twitter, Facebook, LinkedIn, Instagram, TikTok)
 * In socialPerfect: Used in SocialInput.tsx to create new social posts from URL content
 * USAGE: socialPerfect (SocialInput post creation)
 */
export const createSocialPost = async (postData: Request.SocialPostCreate) => {
  devLog.request('createSocialPost', { postData });

  const response = axiosInstance.post('https://socialperfectapi.replit.app/create_post', postData);
  response.then(res => devLog.response('createSocialPost', res)).catch(err => devLog.error('createSocialPost', err));

  return response;
};

/**
 * Get social media post by ID for editing and display
 * Retrieves existing social post data including all platform-specific content
 * In socialPerfect: Used in Dashboard.tsx to fetch post data for editing
 * USAGE: socialPerfect (Dashboard post retrieval)
 */
export const getSocialPost = async (id: string) => {
  devLog.request('getSocialPost', { id });

  const response = axiosInstance.get(`https://socialperfectapi.replit.app/socialposts/${id}`);
  response.then(res => devLog.response('getSocialPost', res)).catch(err => devLog.error('getSocialPost', err));

  return response;
};

/**
 * Update social media post content for specific platforms
 * Modifies existing social post data with new content or platform-specific updates
 * In socialPerfect: Used in Dashboard.tsx for saving edited social post content
 * USAGE: socialPerfect (Dashboard post updates)
 */
export const updateSocialPost = async (reqObj: any) => {
  devLog.request('updateSocialPost', { reqObj });

  const response = axiosInstance.patch(`https://socialperfectapi.replit.app/socialposts/${reqObj.id || reqObj.uuid}`, reqObj);
  response.then(res => devLog.response('updateSocialPost', res)).catch(err => devLog.error('updateSocialPost', err));

  return response;
};

/**
 * Regenerate social media post content for specific platform
 * Creates new variations of social post content for improved engagement
 * In socialPerfect: Used in Dashboard.tsx for regenerating platform-specific content
 * USAGE: socialPerfect (Dashboard content regeneration)
 */
export const regenerateSocialPost = async (guid: string, platform: string) => {
  devLog.request('regenerateSocialPost', { guid, platform });

  const response = axiosInstance.post(`https://socialperfectapi.replit.app/regenerate_post/${guid}/${platform}`);
  response.then(res => devLog.response('regenerateSocialPost', res)).catch(err => devLog.error('regenerateSocialPost', err));

  return response;
};

/**
 * Generate social media post content for specific platform
 * Creates platform-optimized content with appropriate tone, hashtags, and emojis
 * Available for socialPerfect but not currently in active use in components
 * USAGE: Available for socialPerfect platform-specific generation
 */
export const generateSocialPost = async (reqObj: Request.GenerateSocialPostProps) => {
  devLog.request('generateSocialPost', { reqObj });

  const response = axiosInstance.post(`https://socialperfectapi.replit.app/generate_post/${reqObj.uuid}`, reqObj, {
    headers: { 'Content-Type': 'application/json' }
  });

  response.then(res => devLog.response('generateSocialPost', res)).catch(err => devLog.error('generateSocialPost', err));
  return response;
};

/**
 * Generate synopsis for synopsisPerfect domain analysis
 * Connects to synopsisperfectai.replit.app API for domain synopsis generation
 * In socialPerfect: Used in SocialInput.tsx as fallback when getSynopsisInfo fails
 * USAGE: socialPerfect (SocialInput fallback for brand info generation)
 */
export const generateSynopsis = (domain: string) => {
  devLog.request('generateSynopsis', { domain });

  let newDomain = urlSanitization(domain);
  const response = axiosInstance.get(`https://synopsisperfectai.replit.app/domain/${newDomain}`);

  response.then(res => devLog.response('generateSynopsis', res)).catch(err => devLog.error('generateSynopsis', err));
  return response;
};

// ================================================================================
// MEDIUM USAGE SERVICES (Both Apps)
// ================================================================================
// These services are moderately used across both applications

/**
 * Add incoming plan items for content planning workflows
 * Used in CreateContentModal for initial content setup
 * In preferencesPerfect: Used in ContentPlanForm component for content plan creation
 * USAGE: contentPerfect (3+ matches), preferencesPerfect (ContentPlanForm component)
 */
export const addIncomingPlanItem = (reqObj: PlanItemProps) => {
  devLog.request('addIncomingPlanItem', reqObj);

  const response = axiosInstance.post(`${API_URL}/add_incoming_plan_item`, reqObj);
  response.then(res => devLog.response('addIncomingPlanItem', res)).catch(err => devLog.error('addIncomingPlanItem', err));

  return response;
};

/**
 * Save content plan post data to database
 * Used in StatusActionBar for content persistence
 * In preferencesPerfect: Used in OutlineItem and CreateContentModal components
 * USAGE: contentPerfect (3+ matches), preferencesPerfect (OutlineItem, CreateContentModal)
 */
export const saveContentPlanPost = (reqObj: Request.SaveContentPost) => {
  devLog.request('saveContentPlanPost', reqObj);

  const response = axiosInstance.post(`${API_URL}/post_outline`, reqObj);
  response.then(res => devLog.response('saveContentPlanPost', res)).catch(err => devLog.error('saveContentPlanPost', err));

  return response;
};

/**
 * Generate image prompts for visual content creation
 * Used in StatusActionBar for AI-generated image descriptions
 * USAGE: contentPerfect (3+ matches), preferencesPerfect (3+ matches)
 */
export const generateImagePrompt = (content_plan_outline_guid: string) => {
  devLog.request('generateImagePrompt', { content_plan_outline_guid });

  const response = axiosInstance.post('/api/post/generate-image-prompt', { content_plan_outline_guid });
  response.then(res => devLog.response('generateImagePrompt', res)).catch(err => devLog.error('generateImagePrompt', err));

  return response;
};

/**
 * Regenerate HTML content from existing data
 * Used in StatusActionBar for content formatting updates
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const regenerateHTML = (reqObj: Request.RegeneratePost) => {
  devLog.request('regenerateHTML', reqObj);

  const response = axiosInstance.post(`https://content-v5.replit.app/regenerate_html${parseQueries(reqObj)}`, reqObj);
  response.then(res => devLog.response('regenerateHTML', res)).catch(err => devLog.error('regenerateHTML', err));

  return response;
};

/**
 * Regenerate HTML content from document outline
 * Used in StatusActionBar for document-based content formatting
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const regenerateHTMLfromDoc = (reqObj: Request.RegeneratePost) => {
  devLog.request('regenerateHTMLfromDoc', reqObj);

  const response = axiosInstance.post(`https://content-v5.replit.app/regenerate_html_from_outline_guid${parseQueries(reqObj)}`, reqObj);
  response.then(res => devLog.response('regenerateHTMLfromDoc', res)).catch(err => devLog.error('regenerateHTMLfromDoc', err));

  return response;
};

/**
 * Get post data by GUID for content management
 * Used in StatusActionBar and PostsList for content retrieval
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const getPost = (guid: string) => {
  devLog.request('getPost', { guid });

  const response = supabase.from('tasks')
    .select('*')
    .eq('task_id', guid)
    .neq("is_deleted", true)
    .order('created_at', { ascending: false })
    .single();

  response.then(res => devLog.response('getPost', res));
  return response;
};

/**
 * Get post status from outline GUID
 * Used in StatusActionBar for status tracking
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const getPostStatusFromOutline = (guid: string) => {
  devLog.request('getPostStatusFromOutline', { guid });

  const response = supabase.from('tasks')
    .select('*')
    .eq('content_plan_outline_guid', guid)
    .neq("is_deleted", true)
    .order('created_at', { ascending: false });

  response.then(res => devLog.response('getPostStatusFromOutline', res));
  return response;
};

/**
 * Publish content to WordPress platform
 * Used in StatusActionBar for content distribution
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const publishToWordPress = async (guid: string) => {
  devLog.request('publishToWordPress', { guid });

  const response = axiosInstance.post('/api/post/wordpress-publish', { content_plan_outline_guid: guid });
  response.then(res => devLog.response('publishToWordPress', res)).catch(err => devLog.error('publishToWordPress', err));

  return response;
};

/**
 * Update live URL for published content
 * Used in StatusActionBar for URL management
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const updateLiveUrl = (guid: string, url: string) => {
  devLog.request('updateLiveUrl', { guid, url });

  let reqObj = {
    content_plan_outline_guid: guid,
    live_post_url: url || ''
  }

  const response = axiosInstance.post(`/api/post/update-live-url`, reqObj);
  response.then(res => devLog.response('updateLiveUrl', res)).catch(err => devLog.error('updateLiveUrl', err));

  return response;
};

/**
 * Delete post by task GUID
 * Used in StatusActionBar and PostsList for content management
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const deletePost = (task_guid: string) => {
  devLog.request('deletePost', { task_guid });

  const response = supabase.from('tasks')
    .update({ is_deleted: true })
    .eq("task_id", task_guid)
    .select('*');

  response.then(res => devLog.response('deletePost', res));
  return response;
};

/**
 * Delete outline by GUID
 * Used in StatusActionBar and OutlinesList for content management
 * USAGE: contentPerfect (2+ matches), preferencesPerfect (2+ matches)
 */
export const deleteOutline = (guid: string) => {
  devLog.request('deleteOutline', { guid });

  const response = supabase.from('content_plan_outlines')
    .update({ is_deleted: true })
    .eq("guid", guid)
    .select('*');

  response.then(res => devLog.response('deleteOutline', res));
  return response;
};

/**
 * Check domain CSS file - Both Apps
 * Used for CSS file verification and domain styling checks
 * In preferencesPerfect: Used in MyContent component for CSS validation
 * USAGE: contentPerfect, preferencesPerfect (MyContent component)
 */
export const checkDomainCSSFile = async (domain: string) => {
  devLog.request('checkDomainCSSFile', { domain });

  const response = axios.post('/api/check-css', { domain });
  response.then(res => devLog.response('checkDomainCSSFile', res)).catch(err => devLog.error('checkDomainCSSFile', err));

  return response;
};

// ================================================================================
// SINGLE APP USAGE SERVICES
// ================================================================================
// These services are used in only one application

/**
 * Get plan status by ID - contentPerfect only
 * Used for content plan status tracking
 * USAGE: contentPerfect only
 */
export const getPlanStatus = (id: string) => {
  devLog.request('getPlanStatus', { id });

  const response = axiosInstance.get(`${API_URL}/status/${id}`);
  response.then(res => devLog.response('getPlanStatus', res)).catch(err => devLog.error('getPlanStatus', err));

  return response;
};

/**
 * Get completed plan data - contentPerfect only
 * Used for retrieving finalized content plans
 * USAGE: contentPerfect only
 */
export const getCompletedPlan = (id: string, server?: boolean) => {
  devLog.request('getCompletedPlan', { id, server });

  const response = server ?
    axios.get(`${API_URL}/get_content_plan/${id}`) :
    axiosInstance.get(`${API_URL}/get_content_plan/${id}`);

  response.then(res => devLog.response('getCompletedPlan', res)).catch(err => devLog.error('getCompletedPlan', err));
  return response;
};

/**
 * Generate content plan outline - contentPerfect only
 * Used for initial content structure creation
 * USAGE: contentPerfect only
 */
export const generateContentPlanOutline = (reqObj: Request.PostOutlineGenerateRequest) => {
  devLog.request('generateContentPlanOutline', reqObj);

  const response = axiosInstance.post('/api/outlines/generate', reqObj);
  response.then(res => devLog.response('generateContentPlanOutline', res)).catch(err => devLog.error('generateContentPlanOutline', err));

  return response;
};

/**
 * Update content plan data - contentPerfect only
 * Used for modifying existing content plans
 * USAGE: contentPerfect only
 */
export const updateContentPlan = (guid: string, reqObj: any, other?: any) => {
  devLog.request('updateContentPlan', { guid, reqObj, other });

  let reqBody: any = {
    guid,
    content_plan_table: reqObj,
  }
  if (other) {
    reqBody = { ...other, ...reqBody }
    delete reqBody.content_plan_json
    delete reqBody?.content_plan
  }

  const response = axiosInstance.post(`${API_URL}/update_content_plan`, reqBody);
  response.then(res => devLog.response('updateContentPlan', res)).catch(err => devLog.error('updateContentPlan', err));

  return response;
};

/**
 * Get post status by GUID - contentPerfect only
 * Used for content generation status tracking
 * USAGE: contentPerfect only
 */
export const getPostStatus = (guid: string) => {
  devLog.request('getPostStatus', { guid });

  const response = axiosInstance.get(`${NEW_CONTENT_API_URL}/content/status/${guid}`, { headers: newContentAPIHeader });
  response.then(res => devLog.response('getPostStatus', res)).catch(err => devLog.error('getPostStatus', err));

  return response;
};

/**
 * Get latest status by outline GUID - contentPerfect only
 * Used for tracking the most recent status updates
 * USAGE: contentPerfect only
 */
export const getLatestStatusByOutlineGUID = (guid: string) => {
  devLog.request('getLatestStatusByOutlineGUID', { guid });

  const response = supabase
    .from('tasks')
    .select('*')
    .eq('content_plan_outline_guid', guid)
    .order('last_updated_at', { ascending: false });

  response.then(res => devLog.response('getLatestStatusByOutlineGUID', res));
  return response;
};

/**
 * Create user credit account - contentPerfect only
 * Used for user credit system initialization
 * USAGE: contentPerfect only
 */
export const createUserCreditAccount = (email: string) => {
  devLog.request('createUserCreditAccount', { email });

  const response = axiosInstance.post(
    "https://lucsperfect.replit.app/users/",
    { email, amount: 9000 },
    { headers: headers },
  );

  response.then(res => devLog.response('createUserCreditAccount', res)).catch(err => devLog.error('createUserCreditAccount', err));
  return response;
};

/**
 * Add user credits - contentPerfect only
 * Used for crediting user accounts
 * USAGE: contentPerfect only
 */
export const addUserCredit = (email: string, amount: number) => {
  devLog.request('addUserCredit', { email, amount });

  const response = axiosInstance.put(
    "https://lucsperfect.replit.app/users/add_credits",
    { email, amount },
    { headers: headers },
  );

  response.then(res => devLog.response('addUserCredit', res)).catch(err => devLog.error('addUserCredit', err));
  return response;
};

/**
 * Check user credits - contentPerfect only  
 * Used for verifying user account balance
 * USAGE: contentPerfect only
 */
export const checkUserCredits = (email: string) => {
  devLog.request('checkUserCredits', { email });

  const response = axiosInstance.get(`https://lucsperfect.replit.app/users/${email}/credits`, {
    headers: headers,
  });

  response.then(res => devLog.response('checkUserCredits', res)).catch(err => devLog.error('checkUserCredits', err));
  return response;
};

/**
 * Get batch status for multiple items - contentPerfect only
 * Used for bulk status checking operations
 * USAGE: contentPerfect only
 */
export const getBatchStatus = (guids: string[]) => {
  devLog.request('getBatchStatus', { guids });

  const response = axiosInstance.post(
    `${NEW_CONTENT_API_URL}/content/status/batch`,
    guids,
    { headers: newContentAPIHeader }
  );

  response.then(res => devLog.response('getBatchStatus', res)).catch(err => devLog.error('getBatchStatus', err));
  return response;
};

/**
 * Get posts by domain - contentPerfect only
 * Used for domain-specific content retrieval
 * USAGE: contentPerfect only
 */
export const getPostsByDomain = (domain: string, reqObj?: any) => {
  devLog.request('getPostsByDomain', { domain, reqObj });

  const startIndex = reqObj?.page === 1 ? 0 : (reqObj.page - 1) * reqObj.page_size;
  const endIndex = startIndex + reqObj.page_size - 1;

  const baseQuery = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq("client_domain", domain)
    .neq("is_deleted", true)
    .range(startIndex, endIndex)
    .order('last_updated_at', { ascending: false });

  let response;
  if (reqObj?.has_live_post_url !== undefined) {
    response = reqObj.has_live_post_url === true ?
      baseQuery.neq("live_post_url", null) :
      baseQuery.is("live_post_url", null);
  } else if (reqObj?.status) {
    response = reqObj.status === 'completed' ?
      baseQuery.eq("status", "Complete").is("live_post_url", null) :
      baseQuery.neq("status", "Complete");
  } else {
    response = baseQuery;
  }

  response.then(res => devLog.response('getPostsByDomain', res)).catch(err => devLog.error('getPostsByDomain', err));
  return response;
};

/**
 * Get posts by email - contentPerfect only
 * Used for user-specific content retrieval
 * USAGE: contentPerfect only
 */
export const getPostsByEmail = (email: string, reqObj?: any) => {
  devLog.request('getPostsByEmail', { email, reqObj });

  const startIndex = reqObj?.page === 1 ? 0 : (reqObj.page - 1) * reqObj.page_size;
  const endIndex = startIndex + reqObj.page_size - 1;

  const baseQuery = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq("email", email)
    .neq("is_deleted", true)
    .range(startIndex, endIndex)
    .order('last_updated_at', { ascending: false });

  let response;
  if (reqObj?.has_live_post_url !== undefined) {
    response = reqObj.has_live_post_url === true ?
      baseQuery.neq("live_post_url", null) :
      baseQuery.is("live_post_url", null);
  } else if (reqObj?.status) {
    response = reqObj.status === 'completed' ?
      baseQuery.eq("status", "Complete").is("live_post_url", null) :
      baseQuery.neq("status", "Complete");
  } else {
    response = baseQuery;
  }

  response.then(res => devLog.response('getPostsByEmail', res)).catch(err => devLog.error('getPostsByEmail', err));
  return response;
};

/**
 * Delete content plan - contentPerfect only
 * Used for removing entire content plans
 * USAGE: contentPerfect only
 */
export const deleteContentPlan = (guid: string) => {
  devLog.request('deleteContentPlan', { guid });

  const response = axiosInstance.delete(`${API_URL}/delete_content_plan/${guid}`);
  response.then(res => devLog.response('deleteContentPlan', res)).catch(err => devLog.error('deleteContentPlan', err));

  return response;
};

/**
 * Get fact check status - contentPerfect only
 * Used for content verification workflows
 * USAGE: contentPerfect only
 */
export const getFactCheckStatus = (guid: string) => {
  devLog.request('getFactCheckStatus', { guid });

  const response = axiosInstance.get(`https://factcheck-perfectai.replit.app/status/${guid}`);
  response.then(res => devLog.response('getFactCheckStatus', res)).catch(err => devLog.error('getFactCheckStatus', err));

  return response;
};

/**
 * Post fact check data - contentPerfect only
 * Used for submitting content for fact verification
 * USAGE: contentPerfect only
 */
export const postFactCheck = (reqObj: any) => {
  devLog.request('postFactCheck', reqObj);

  const response = axiosInstance.post(`https://factcheck-perfectai.replit.app/fact_check_html`, reqObj, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  response.then(res => devLog.response('postFactCheck', res)).catch(err => devLog.error('postFactCheck', err));
  return response;
};

/**
 * Get outlines by content plan - contentPerfect only
 * Used for retrieving related outlines
 * USAGE: contentPerfect only
 */
export const getOutlinesByContentPlan = async (content_plan_guid: string, paginator?: PaginationRequest) => {
  devLog.request('getOutlinesByContentPlan', { content_plan_guid, paginator });

  let response;
  if (paginator) {
    let startIndex = paginator?.page === 1 ? 0 : (paginator.page - 1) * paginator.page_size;
    let endIndex = startIndex + paginator.page_size - 1;
    response = supabase.from('content_plan_outlines')
      .select('*', { count: 'exact' })
      .eq("content_plan_guid", content_plan_guid)
      .range(startIndex, endIndex)
      .order('updated_at', { ascending: false });
  } else {
    response = supabase.from('content_plan_outlines')
      .select('*')
      .eq("content_plan_guid", content_plan_guid)
      .order('updated_at', { ascending: false });
  }

  response.then(res => devLog.response('getOutlinesByContentPlan', res)).catch(err => devLog.error('getOutlinesByContentPlan', err));
  return response;
};

/**
 * Get content plan outlines by domain - contentPerfect only
 * Used for domain-specific outline retrieval
 * USAGE: contentPerfect only
 */
export const getContentPlanOutlinesByDomain = (domain: string, paginator: PaginationRequest, status?: string) => {
  devLog.request('getContentPlanOutlinesByDomain', { domain, paginator, status });

  let startIndex = paginator?.page === 1 ? 0 : (paginator.page - 1) * paginator.page_size;
  let endIndex = startIndex + paginator.page_size - 1;

  const baseQuery = supabase.from('content_plan_outlines')
    .select('*', { count: 'exact' })
    .eq("domain", domain)
    .range(startIndex, endIndex)
    .neq("is_deleted", true)
    .order('created_at', { ascending: false });

  let response;
  if (status) {
    switch (status) {
      case 'completed':
        response = baseQuery.eq("status", "completed");
        break;
      case 'in-progress':
        response = baseQuery.neq("status", "completed");
        break;
      case 'error':
        response = baseQuery.like('status', '%err%');
        break;
      default:
        response = baseQuery.eq("status", status);
    }
  } else {
    response = baseQuery;
  }

  response.then(res => devLog.response('getContentPlanOutlinesByDomain', res)).catch(err => devLog.error('getContentPlanOutlinesByDomain', err));
  return response;
};

/**
 * Get content plan outlines by email - contentPerfect only
 * Used for user-specific outline retrieval
 * USAGE: contentPerfect only
 */
export const getContentPlanOutlinesByEmail = (email: string, paginator: PaginationRequest, status?: string) => {
  devLog.request('getContentPlanOutlinesByEmail', { email, paginator, status });

  let startIndex = paginator?.page === 1 ? 0 : (paginator.page - 1) * paginator.page_size;
  let endIndex = startIndex + paginator.page_size - 1;

  const baseQuery = supabase.from('content_plan_outlines')
    .select('*', { count: 'exact' })
    .eq("email", email)
    .neq("is_deleted", true)
    .range(startIndex, endIndex)
    .order('created_at', { ascending: false });

  let response;
  if (status) {
    switch (status) {
      case 'completed':
        response = baseQuery.eq("status", "completed");
        break;
      case 'in-progress':
        response = baseQuery.neq("status", "completed");
        break;
      case 'failed':
        response = baseQuery.like('status', '%fail%');
        break;
      default:
        response = baseQuery.eq("status", status);
    }
  } else {
    response = baseQuery;
  }

  response.then(res => devLog.response('getContentPlanOutlinesByEmail', res)).catch(err => devLog.error('getContentPlanOutlinesByEmail', err));
  return response;
};

/**
 * Get content plans by email - contentPerfect only
 * Used for user content plan management
 * USAGE: contentPerfect only
 */
export const getContentPlansByEmail = (email: string, paginator: PaginationRequest) => {
  devLog.request('getContentPlansByEmail', { email, paginator });

  let startIndex = paginator?.page === 1 ? 0 : (paginator.page - 1) * paginator.page_size;
  let endIndex = startIndex + paginator.page_size - 1;

  const response = supabase.from('content_plans')
    .select('*', { count: 'exact' })
    .eq("email", email)
    .range(startIndex, endIndex)
    .order('timestamp', { ascending: false });

  response.then(res => devLog.response('getContentPlansByEmail', res));
  return response;
};

/**
 * Patch content plan data by GUID - contentPerfect only
 * Used for updating specific fields in content plans without full replacement
 * USAGE: contentPerfect only
 */
export const patchContentPlan = (guid: string, data: any) => {
  devLog.request('patchContentPlan', { guid, data });

  const response = axiosInstance.patch(
    `https://planperfectapi.replit.app/update_outline/${guid}`, data
  );

  response.then(res => devLog.response('patchContentPlan', res)).catch(err => devLog.error('patchContentPlan', err));
  return response;
};


/**
 * Get content plans by domain - contentPerfect only
 * Used for domain content plan management
 * USAGE: contentPerfect only
 */
export const getContentPlansByDomain = (domain: string, paginator: PaginationRequest) => {
  devLog.request('getContentPlansByDomain', { domain, paginator });

  let startIndex = paginator?.page === 1 ? 0 : (paginator.page - 1) * paginator.page_size;
  let endIndex = startIndex + paginator.page_size - 1;

  const response = supabase.from('content_plans')
    .select('*', { count: 'exact' })
    .eq("domain_name", domain)
    .range(startIndex, endIndex)
    .order('timestamp', { ascending: false });

  response.then(res => devLog.response('getContentPlansByDomain', res));
  return response;
};

/**
 * Patch post field data - contentPerfect only
 * Used for updating specific post fields
 * USAGE: contentPerfect only
 */
export const patchPost = (guid: string, field: string, value: string) => {
  devLog.request('patchPost', { guid, field, value });

  const response = axiosInstance.patch(`${NEW_CONTENT_API_URL}/content/update/${guid}/field`,
    { "field": field, "value": value },
    { headers: { 'Content-Type': 'application/json' } }
  );

  response.then(res => devLog.response('patchPost', res)).catch(err => devLog.error('patchPost', err));
  return response;
};

/**
 * Patch outline title by GUID - contentPerfect only
 * Used for updating outline titles
 * USAGE: contentPerfect only
 */
export const patchOutlineTitle = (guid: string, title: string) => {
  devLog.request('patchOutlineTitle', { guid, title });

  const response = axiosInstance.patch(`https://planperfectapi.replit.app/update_outline_title/${guid}?new_title=${title.toString()}`, title);

  response.then(res => devLog.response('patchOutlineTitle', res)).catch(err => devLog.error('patchOutlineTitle', err));
  return response;
};

/**
 * Fact check by post GUID - contentPerfect only
 * Used for content verification by post ID
 * USAGE: contentPerfect only
 */
export const factCheckByPostGuid = (reqObj: any) => {
  devLog.request('factCheckByPostGuid', reqObj);

  const response = axiosInstance.post(`https://factcheck-perfectai.replit.app/fact_check_content_by_guid`, reqObj);
  response.then(res => devLog.response('factCheckByPostGuid', res)).catch(err => devLog.error('factCheckByPostGuid', err));

  return response;
};

/**
 * Get GSC search analytics - contentPerfect only
 * Used for Google Search Console data retrieval
 * USAGE: contentPerfect only  
 */
export const getGSCSearchAnalytics = (reqObj: Request.GSCRequest) => {
  devLog.request('getGSCSearchAnalytics', reqObj);

  const response = axiosInstance.get(`https://search-analytics-api-dev456.replit.app/gsc_search_analytics_data${parseQueries(reqObj)}`);
  response.then(res => devLog.response('getGSCSearchAnalytics', res)).catch(err => devLog.error('getGSCSearchAnalytics', err));

  return response;
};

/**
 * Get Ahrefs domain rating - contentPerfect only
 * Used for domain authority analysis
 * USAGE: contentPerfect only
 */
export const getAhrefsDomainRating = (reqObj: Request.DomainReportsRequest) => {
  devLog.request('getAhrefsDomainRating', reqObj);

  const response = axiosInstance.get(`https://search-analytics-api-dev456.replit.app/ahrefs_domain_rating${parseQueries(reqObj)}`);
  response.then(res => devLog.response('getAhrefsDomainRating', res)).catch(err => devLog.error('getAhrefsDomainRating', err));

  return response;
};

/**
 * Get Ahrefs URL rating - contentPerfect only
 * Used for page authority analysis
 * USAGE: contentPerfect only
 */
export const getAhrefsUrlRating = (reqObj: Request.PageRequest) => {
  devLog.request('getAhrefsUrlRating', reqObj);

  const response = axiosInstance.get(`https://search-analytics-api-dev456.replit.app/ahrefs_url_rating${parseQueries(reqObj)}`);
  response.then(res => devLog.response('getAhrefsUrlRating', res)).catch(err => devLog.error('getAhrefsUrlRating', err));

  return response;
};

/**
 * Get GSC live URL report - contentPerfect only
 * Used for Google Search Console URL analysis
 * USAGE: contentPerfect only
 */
export const getGSCLiveURLReport = (reqObj: Request.GSCTotalsRequest) => {
  devLog.request('getGSCLiveURLReport', reqObj);

  const response = axiosInstance.get(`https://search-analytics-api-dev456.replit.app/gsc_benchmarks${parseQueries(reqObj)}`);
  response.then(res => devLog.response('getGSCLiveURLReport', res)).catch(err => devLog.error('getGSCLiveURLReport', err));

  return response;
};

/**
 * Populate bulk GSC data - contentPerfect only
 * Used for batch Google Search Console operations
 * USAGE: contentPerfect only
 */
export const populateBulkGSC = (reqObj: any) => {
  devLog.request('populateBulkGSC', reqObj);

  const response = axiosInstance.post(`https://gsc-batch-job-dev456.replit.app/trigger_gsc_job`, reqObj);
  response.then(res => devLog.response('populateBulkGSC', res)).catch(err => devLog.error('populateBulkGSC', err));

  return response;
};

/**
 * Get content plan children - contentPerfect only
 * Used for hierarchical content structure
 * USAGE: contentPerfect only
 */
export const getContentPlanChildren = async (guid: string) => {
  devLog.request('getContentPlanChildren', { guid });

  const response = axiosInstance.post(`/api/content-plan/get-child-content`, { content_plan_guid: guid });
  response.then(res => devLog.response('getContentPlanChildren', res)).catch(err => devLog.error('getContentPlanChildren', err));

  return response;
};

/**
 * Store CSS file for domain styling - preferencesPerfect only
 * Used in DashboardPage for saving custom CSS styles to domain configurations
 * Stores domain-specific CSS content via API for custom styling features
 * USAGE: preferencesPerfect only (DashboardPage CSS style management)
 */
export const storeCSSFile = async (domain: string, cssContent: string) => {
  devLog.request('storeCSSFile', { domain, cssContentLength: cssContent?.length || 0 });

  try {
    const response = await fetch('/api/store-css', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        cssContent
      })
    });

    const result = await response.json();

    if (!response.ok) {
      devLog.error('storeCSSFile', result.error);
      return { data: null, error: result.error };
    }

    devLog.response('storeCSSFile', result.data);
    return {
      data: result.data,
      error: result.error
    };
  } catch (error) {
    devLog.error('storeCSSFile', error);
    return { data: null, error: { message: 'Network error: ' + error.message } };
  }
};

// ================================================================================
// UNUSED SERVICES
// ================================================================================
// These services have no current references in either application
// They are kept for potential future use or legacy compatibility

/**
 * Process TSV URL - UNUSED
 * Legacy service for TSV file processing
 * DEV NOTE: Consider removing if TSV functionality is not needed
 */
export function processTsvUrl(url: string) {
  devLog.request('processTsvUrl', { url });

  const response = axiosInstance.post<Request.ProcessTsvUrlResponse>('/process-tsv-url', { url }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  response.then(res => devLog.response('processTsvUrl', res)).catch(err => devLog.error('processTsvUrl', err));
  return response;
}

/**
 * Deduct user credit - UNUSED
 * Legacy credit system function
 * DEV NOTE: May be needed for future billing features
 */
export const deductUserCredit = (email: string, amount: number) => {
  devLog.request('deductUserCredit', { email, amount });

  const response = axiosInstance.put(
    "https://lucsperfect.replit.app/users/deduct_credits",
    { email, amount },
    { headers: headers },
  );

  response.then(res => devLog.response('deductUserCredit', res)).catch(err => devLog.error('deductUserCredit', err));
  return response;
};

/**
 * Delete user credit account - UNUSED
 * Legacy credit system function
 * DEV NOTE: May be needed for user account deletion
 */
export const deleteUserCreditAccount = (email: string) => {
  devLog.request('deleteUserCreditAccount', { email });

  const response = axiosInstance.delete(`https://lucsperfect.replit.app/users/${email}`, { headers: headers });
  response.then(res => devLog.response('deleteUserCreditAccount', res)).catch(err => devLog.error('deleteUserCreditAccount', err));

  return response;
};

/**
 * Generate voice prompts - UNUSED
 * Legacy voice generation service
 * DEV NOTE: Related to voicePerfect integration - may be reactivated
 */
export const generateVoicePrompts = (domain: string) => {
  devLog.request('generateVoicePrompts', { domain });

  const response = axiosInstance.get(`https://voice-perfect-api.replit.app/GenerateVoicePrompt?domain=${urlSanitization(domain)}`);
  response.then(res => devLog.response('generateVoicePrompts', res)).catch(err => devLog.error('generateVoicePrompts', err));

  return response;
};

/**
 * Save details - UNUSED
 * Legacy data persistence function
 * DEV NOTE: Generic save function - may be reused for various features
 */
export const saveDetails = (data: any) => {
  devLog.request('saveDetails', { data });

  const response = axiosInstance.post('https://voice-perfect-api.replit.app/SaveUserDetails', data);
  response.then(res => devLog.response('saveDetails', res)).catch(err => devLog.error('saveDetails', err));

  return response;
};

/**
 * Get domains - UNUSED
 * Legacy domain management function
 * DEV NOTE: May be useful for domain administration features
 */
export const getDomains = async (domains?: string[], hidden?: boolean | null, blocked?: boolean | null, paginator?: PaginationRequest) => {
  devLog.request('getDomains', { domains, hidden, blocked, paginator });

  let response;
  if (paginator) {
    let startIndex = paginator?.page === 1 ? 0 : (paginator.page - 1) * paginator.page_size;
    let endIndex = startIndex + paginator.page_size - 1;

    let query = supabase.from('domains')
      .select('*', { count: 'exact' })
      .range(startIndex, endIndex)
      .order('domain', { ascending: true });

    if (blocked === true) {
      query = query.eq('blocked', true);
    } else {
      query = query.eq('blocked', false);
    }

    if (domains && domains.length > 0) {
      query = query.in('domain', domains);
    }

    if (hidden !== null && hidden !== undefined) {
      query = query.eq('hidden', hidden);
    }

    response = query;
  } else {
    let query = supabase.from('domains')
      .select('*')
      .order('domain', { ascending: true });

    if (domains && domains.length > 0) {
      query = query.in('domain', domains);
    }

    if (hidden !== null && hidden !== undefined) {
      query = query.eq('hidden', hidden);
    }

    response = query;
  }

  response.then(res => devLog.response('getDomains', res)).catch(err => devLog.error('getDomains', err));
  return response;
};

// ================================================================================
// SEOPE RFECT APP USAGE SUMMARY
// ================================================================================
/**
 * SEOPerfect App Service Usage Analysis (Last Updated: 2025-09-25)
 * 
 * DIRECT SERVICE USAGE: NONE
 * The main SEOPerfect app (src/app/, src/components/) does not directly import or use 
 * any services from this file. The app serves as a landing page and brand showcase.
 * 
 * INDIRECT SERVICE AVAILABILITY: ALL SERVICES AVAILABLE
 * While not directly used, all services remain available through the shared component 
 * system for potential future functionality expansion.
 * 
 * MAIN APP USAGE PATTERN:
 * - Uses shared UI components (TypeWriterText, Modal, Form components)
 * - Uses data types and brand assets from shared system
 * - Uses Supabase client directly for any data operations
 * - Focuses on brand display and navigation to other Perfect SEO apps
 * 
 * RECOMMENDATION: 
 * Keep all services available for future expansion while acknowledging current 
 * SEOPerfect app has minimal functional requirements as a landing page.
 */