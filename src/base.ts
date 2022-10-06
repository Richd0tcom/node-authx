import axios from "axios";

type configOptions = {
    projectKey: string,
    projectId: string,
    redirectURL: string,
}


class AuthXProvider {

    #authcode: string;
    #accessToken: string;
    projectId: string;
    projectKey: string;
    redirectUrl: string;

    constructor(args: configOptions)  {
        this.projectId = args.projectId;
        this.projectKey = args.projectKey;
        this.redirectUrl = args.redirectURL;
        this.#authcode = ""
        this.#accessToken = ""
    }

    public async loginWithRedirect(){
        const d = `http://localhost:3000/oauth/login`
        window.location //go to the authx server login page
        
    }
    //has to be called on the client
    async #getAuthCode() {
        const search = window.location.search
        const urlParams = new URLSearchParams(search)
        if (urlParams.has("code")){
            this.#authcode = urlParams.get("code") as string
            
            await this.#getAccessToken()
            window.location.replace("")// replace with the redirect URL remaoving the code.
        } else {
            this.loginWithRedirect()
        }
        
    }
    async #getAccessToken() {
        if(this.#authcode != ""){
            await this.#getAuthCode()
        }
        const tokenResponse = await axios.get(`http://localhost:3000/api/v1/auth/token?code=${this.#authcode}`);
        this.#accessToken = tokenResponse.data;
        localStorage.setItem('token', this.#accessToken);
    }
    async getUserInfo() {
        let token;
        let userInfo = localStorage.getItem("userInfo")
        
        try {
            if (userInfo != undefined){
                return JSON.parse(userInfo);
            }
            
            if(localStorage.getItem('token')!= undefined && localStorage.getItem('token')!= null && localStorage.getItem('token')!== "") {
                token = localStorage.getItem('token');
            } else {
                await this.#getAccessToken()
                token = this.#accessToken
            }

            const profile = await axios.request({
                method: "get",
                url: "http://localhost:3000/api/v1/users",
                headers: {
                  authorization: `Bearer ${token}`
                }
            });
            localStorage.setItem("userInfo", JSON.stringify(profile.data))
            return profile.data;
        } catch (error) {
            throw new Error(error as string);
        }
        
    }
}