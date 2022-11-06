import axios from 'axios';
import { configOptions, SERVICE_BASE_URL } from './constants';
export class AuthXProvider {
  #authcode: string | null = '';
  #accessToken: string = '';
  #projectId: string;
  #projectKey: string;
  #redirectUrl: string;

  constructor(args: configOptions) {
    this.#projectId = args.projectId;
    this.#projectKey = args.projectKey;
    this.#redirectUrl = args.redirectURL;
  }
  async login() {
    const redirect_url = `${SERVICE_BASE_URL}/validate?projectKey=${
      this.#projectKey
    }&projectId=${this.#projectId}&redirectURL=${this.#redirectUrl}`;

    window.open(redirect_url, '_self', 'width=700;height=300;location=0');
  }

  //has to be called on the client
  async #getAuthCode() {
    try {
      const search = window.location.search;
      const urlParams = new URLSearchParams(search);
      if (urlParams.has('code')) {
        this.#authcode = urlParams.get('code');
        const url = new URL(this.#redirectUrl);
        const urlWithoutQuery = url.hostname + url.pathname;

        window.history.pushState({}, '', '/');
        await this.#getAccessToken();
        window.close();
      } else {
        console.log('this is stoping me');
        this.login();
      }
    } catch (error) {
      throw new Error(error as string);
    }
  }
  async #getAccessToken() {
    try {
      if (this.#authcode == '' || !this.#authcode) {
        await this.#getAuthCode();
      } else {
        const tokenResponse = await axios.get(
          `${SERVICE_BASE_URL}/token?code=${this.#authcode}`
        );
        this.#accessToken = tokenResponse.data.token;
        localStorage.setItem('token', this.#accessToken);
        return;
      }
    } catch (error) {
      throw new Error('Failed to get Access Token');
    }
  }
  async getUserInfo() {
    let token;
    let userInfo = localStorage.getItem('userInfo');
    try {
      if (userInfo != undefined && userInfo != '' && userInfo != null) {
        return JSON.parse(userInfo);
      }
      if (
        localStorage.getItem('token') != undefined &&
        localStorage.getItem('token') != null &&
        localStorage.getItem('token') !== ''
      ) {
        token = localStorage.getItem('token');
        const profile = await axios.request({
          method: 'get',
          url: `${SERVICE_BASE_URL}/users`,
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        localStorage.setItem('userInfo', JSON.stringify(profile.data));
        return profile.data;
      } else if (!this.#accessToken && this.#accessToken != '') {
        await this.#getAccessToken();
        token = this.#accessToken;
        const profile = await axios.request({
          method: 'get',
          url: `${SERVICE_BASE_URL}/users`,
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        localStorage.setItem('userInfo', JSON.stringify(profile.data));
        return profile.data;
      } else {
        await this.#getAuthCode();
        await this.#getAccessToken();
        token = this.#accessToken;
        const profile = await axios.request({
          method: 'get',
          url: `${SERVICE_BASE_URL}/users`,
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        localStorage.setItem('userInfo', JSON.stringify(profile.data));
        return profile.data;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error as string);
    }
  }
}
