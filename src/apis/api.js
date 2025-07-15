import axios from "axios";
import routes from "@/router";
import { useUserStore } from "@/stores/user";
import { apiHostURL as host } from "@/config";

const Api = axios.create({
  baseURL: host,
  timeout: 30000, // 30 seconds
});

Api.interceptors.request.use((config) => {
  // We are importing store before it is populated.
  // We intercept the request and use the current apiKey
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers.Authorization = "Bearer " + userStore.token;
  }

  return config;
});

const errorInterceptor = (error) => {
  // check if it's a server error
  if (!error.response) {
    //notify.warn('Network/Server error');
    console.error("**Network/Server error");

    alert("Server is offline or unreachable");
    return Promise.reject(error);
  }
  if (error.code === "ECONNABORTED") {
    console.error("Request timed out");
    alert("Server took too long to respond.");
    return Promise.reject(error);
  }

  // all the other error responses
  switch (error.response.status) {
    case 400:
      console.error(error.response.status, error.message);
      //notify.warn('Nothing to display', 'Data Not Found');
      break;

    case 401: // authentication error, logout the user
      const userStore = useUserStore();
      userStore.logout();
      routes.push("/login");
      break;

    case 403:
      routes.push({ name: "accessDenied" });
      break;

    default:
      console.error(error.response.status, error.message);
    //notify.error('Server Error');
  }
  return Promise.reject(error);
};

Api.interceptors.response.use(null, errorInterceptor);

export default Api;
