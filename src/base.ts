import axios from "axios";
import { SERVICE_BASE_URL, configOptions } from "./constants";


export class AuthXProvider {

    #authcode: string;
    #accessToken: string;
    #projectId: string;
    #projectKey: string;
    #redirectUrl: string;

    constructor(args: configOptions)  {
        this.#projectId = args.projectId;
        this.#projectKey = args.projectKey;
        this.#redirectUrl = args.redirectURL;
        this.#authcode = ""
        this.#accessToken = ""
    }

    public async loginWithRedirect(){
        const redirect_url = `${SERVICE_BASE_URL}/validate?projectKey=${this.#projectKey}&projectId=${this.#projectId}&redirectURL=${this.#redirectUrl}`
        window.location.href = redirect_url //go to the authx server login page
    }
    //has to be called on the client
    async #getAuthCode() {
        try {
            const search = window.location.search;
            const urlParams = new URLSearchParams(search);
            if (urlParams.has("code")) {
                this.#authcode = urlParams.get("code") as string;
                console.log("authcode: " + this.#authcode);
                // window.location.replace("http:127.0.0.1:5173/")// replace with the redirect URL removing the code.
                
                await this.#getAccessToken()
            }
            else {
                console.log("this is stoping me");
                this.loginWithRedirect();
            }
        }
        catch (error) {
            throw new Error(error);
        }
        
        
    }
    async #getAccessToken() {
        try {
            if (this.#authcode == "" || !this.#authcode) {
                await this.#getAuthCode();
            }
            else {
                console.log(this.#authcode)
                const tokenResponse = await axios.get(`${SERVICE_BASE_URL}/token?code=${this.#authcode}`);
                console.log("getting auth code", tokenResponse)
                this.#accessToken = tokenResponse.data.token;
                localStorage.setItem('token', this.#accessToken);
                console.log("333",this.#accessToken)
                return;
            }
        }
        catch (error) {
            console.log(error)
            throw new Error("Failed to get Access Token");
        }
    }
    async getUserInfo() {
        let token;
        let userInfo = localStorage.getItem("userInfo");
        try {
            if (userInfo != undefined && userInfo != "" && userInfo != null) {
                console.log("I found userInfo in localStorage so I skipped", userInfo);
                return JSON.parse(userInfo);
            }

            if (localStorage.getItem('token') != undefined && localStorage.getItem('token') != null && localStorage.getItem('token') !== "") {
                token = localStorage.getItem('token');
                console.log("token from localStorage", token)
                const profile = await axios.request({
                    method: "get",
                    url: `${SERVICE_BASE_URL}/users`,
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                });
                localStorage.setItem("userInfo", JSON.stringify(profile.data));
                return profile.data;
            }
            else if(!this.#accessToken && this.#accessToken != ""){
                console.log("Im getting accessToken")
                await this.#getAccessToken();
                token = this.#accessToken;
                console.log("token",token)
                const profile = await axios.request({
                    method: "get",
                    url: `${SERVICE_BASE_URL}/users`,
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                });
                localStorage.setItem("userInfo", JSON.stringify(profile.data));
                return profile.data;
            } else {
                await this.#getAuthCode();
                await this.#getAccessToken();
                token = this.#accessToken;
                console.log("token",token)
                const profile = await axios.request({
                    method: "get",
                    url: `${SERVICE_BASE_URL}/users`,
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                });
                localStorage.setItem("userInfo", JSON.stringify(profile.data));
                return profile.data;

            }
                
                
        }catch (error) {
            console.log(error)
            throw new Error(error);
        }
        
    }
}