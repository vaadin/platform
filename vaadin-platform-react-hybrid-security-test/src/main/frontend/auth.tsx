import { UserInfoService } from 'Frontend/generated/endpoints';
import {configureAuth} from "@vaadin/hilla-react-auth";

const auth = configureAuth(UserInfoService.getUserInfo, {
    getRoles: (userInfo) => userInfo.authorities,
});

export const useAuth = auth.useAuth;
export const AuthProvider = auth.AuthProvider;