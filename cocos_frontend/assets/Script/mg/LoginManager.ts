import {
    ensureAuthClient as ensureAuthClientAdapter,
    getIdentity as getIdentityAdapter,
    getPrincipalText as getPrincipalTextAdapter,
    initAuth as initAuthAdapter,
    isAuthenticated as isAuthenticatedAdapter,
    login as loginAdapter,
} from "../icp/auth";

export default class LoginManager {
    public static readonly Instance: LoginManager = new LoginManager();
    private constructor() {}

    Init() {
        initAuthAdapter();
    }

    public async ensureAuthClient(): Promise<any> {
        return await ensureAuthClientAdapter();
    }

    async isAuthenticated(): Promise<boolean> {
        return await isAuthenticatedAdapter();
    }

    async getIdentity(): Promise<any> {
        return await getIdentityAdapter();
    }

    getPrincipalText(): string | null {
        return getPrincipalTextAdapter();
    }

    login(onSuccessCallBack?: () => void, onError?: (err: any) => void): void {
        loginAdapter({
            onSuccess: () => {
                if (onSuccessCallBack) onSuccessCallBack();
            },
            onError: (err: any) => {
                if (onError) onError(err);
            },
        });
    }
}
