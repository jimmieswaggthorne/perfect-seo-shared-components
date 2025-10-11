"use client"
// src/axiosInstance.js
import axios from 'axios';
import { createClient } from './supabase/client';
import en from '@/assets/en.json';
const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' }
});

const supabase = createClient()
async function logAxiosErrorToSupabase(error: any) {
  const supabase = createClient();
  let email = typeof window !== "undefined" ? localStorage.getItem("email") : null;
  const errorData = {
    message: error.message,
    stack: error.stack,
    config: error.config,
    response: error.response ? {
      status: error.response.status,
      data: error.response.data
    } : null
  };

  await supabase
    .from('user_history')
    .insert({ email: email, transaction_data: errorData, product: en.product, type: "INFO", action: "Login" })
    .select('*')
}
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    await logAxiosErrorToSupabase(error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  let email;
  try {
    email = localStorage.getItem('email')
  }
  catch (e) {
    email = "not stored"
  }
  supabase
    .from('user_history')
    .insert({ email, transaction_data: { ...error.response }, product: en?.product, type: "ERROR", action: "Axios Error" })
    .select('*')
  return Promise.reject(error);
});

export default axiosInstance;
