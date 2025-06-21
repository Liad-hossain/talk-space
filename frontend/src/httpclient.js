import axios from "axios";
import config from "./externals/config";
import qs from 'qs';


const handleTokenRefresh = async (refresh_token) => {
    const data = {
        refresh: refresh_token,
    };

    try {
        const response = await axios.post(config.auth.refresh(), data);
        if (response.status === 200) {
            localStorage.setItem('access_token', response.data.data.access_token);
        }
        return response;
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '/'
    }
};

const handleHTTPRequest = async (method, url, headers, params, data) => {
    const access_token = localStorage.getItem('access_token');
    if (!('Authorization' in headers) || !headers.Authorization){
        headers['Authorization'] = `Token ${access_token}`;
    }

    try{
        let response = await axios({
            method: method,
            url: url,
            headers: headers,
            params: params,
            paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' });
            },
            data: data
        });

        if (response.status === 401){
            response = await handleTokenRefresh(localStorage.getItem('refresh_token'));
            if (response.status === 200){
                return await handleHTTPRequest(method, url, headers, params, data, access_token);
            }
            else{
                return response
            }
        }
        else{
            return response;
        }

    }catch (error) {
        console.log(error);
    }
};


export default handleHTTPRequest;
