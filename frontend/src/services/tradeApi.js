import axios from "axios";

const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
}/api/trades`;

export const getTrades = async (params = {}) => {
  const response = await axios.get(API_URL, {
    params,
  });

  return response.data;
};

export const startTradePull = async () => {
  const response = await axios.post(
    `${API_URL}/pull`
  );

  return response.data;
};

export const getPullStatus = async () => {
  const response = await axios.get(
    `${API_URL}/status`
  );

  return response.data;
};