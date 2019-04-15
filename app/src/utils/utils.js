import axios from 'axios';

/**
 * Sends a ajax request using axios and returns a promise for the request.
 * @param {String} url URL to send request to
 * @param {String} method Method to use for request
 * @param {Any} options Additional options
 * @return {Promise} A promise to resolve or reject with the server response.
 */
export function ajaxRequest(url, method = 'get', options = null) {
  return axios({
    url,
    method,
    ...options
  });
}
