// @flow

import type {PermissionsList} from './Permissions.js';

export const ACCEPTED_STATUS = 'ACCEPTED';
export const REFUSED_STATUS = 'REFUSED';
export const ERROR_STATUS = 'ERROR';
export const NEED_SIGNIN_STATUS = 'NEED_SIGNIN';

export type AcceptedAuthState = {
  status: string;
  username: string;
  token: string;
}

export type RefusedAuthState = {
  status: string;
  reasonId: string;
  message: string;
}

export type ErrorAuthState = {
  status: string;
  id: number;
  message: string;
  detail: string;
}

export type NeedSigninState = {
  status: string;
  code: number;
  key: string;
  requestingAppId: string;
  requestedPermissions: PermissionsList;
  returnURL: string;
  poll_rate_ms: number;
  clientData: mixed;
  url: string;
  lang: string;
  poll: string;
  oauthState: string;
}

export type AuthState = AcceptedAuthState|RefusedAuthState|ErrorAuthState|NeedSigninState;
