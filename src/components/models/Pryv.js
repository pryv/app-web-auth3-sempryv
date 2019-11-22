// @flow

import axios from 'axios';
import Hostings from './Hostings.js';
import type {AuthState} from './AuthStates.js';
import type {PermissionsList} from './Permissions.js';

type SempryvCode = {
  code: string,
  display: string,
  system: string,
  system_name: string,
}

export type Stream = {
  clientData: {
    'sempryv:codes': { [string]: Array<SempryvCode> },
  },
  name: string,
  id: string,
  children: Array<Stream>,
}

type AppAccess = {
  type: 'app',
  permissions: PermissionsList,
  expires: ?number,
  token: string,
};

type AppCheck = {
  permissions: PermissionsList,
  match: AppAccess,
  mismatch: AppAccess,
};

export type NewUser = {
  username: string,
  server: string,
};

export type ServiceInfos = {
  version: string,
  register: string,
  access: string,
  api: string,
  name: string,
  home: string,
  support: string,
  terms: string,
}

class Pryv {
  core: (string) => string;
  register: string;

  constructor (domain: string) {
    this.core = username => `https://${username}.${domain}`;
    this.register = `https://reg.${domain}`;
  }

  // ---------- AUTH calls ----------

  // GET/reg: polling with according poll key
  async poll (pollKey: string): Promise<AuthState> {
    const res = await axios.get(`${this.register}/access/${pollKey}`);
    return res.data;
  }

  // POST/reg: advertise updated auth state
  async updateAuthState (pollKey: string, authState: AuthState): Promise<number> {
    const res = await axios.post(
      `${this.register}/access/${pollKey}`,
      authState
    );
    return res.status;
  }

  // POST/core: login with Pryv credentials
  async login (username: string, password: string, appId: string): Promise<string> {
    const res = await axios.post(
      `${this.core(username)}/auth/login`, {
        username: username,
        password: password,
        appId: appId,
      },
    );
    return res.data.token;
  }

  // GET/streams: retrieve all streams
  async getStreams (username: string, auth: string): Promise<Array<Stream>> {
    const res = await axios.get(
      `${this.core(username)}/streams`, {
        headers: { Authorization: auth },
      }
    );
    return res.data.streams;
  }

  // POST/core: check if requested app access already exists or not,
  // answering with one of the three:
  // 1. checkedPermissions: corrected permissions if the access does not exists yet
  // 2. match: existing access with matching permissions
  // 3. mismatch: existing access with mismatching permissions
  async checkAppAccess (username: string, permissions: PermissionsList,
    personalToken: string, appId: string, deviceName: ?string): Promise<AppCheck> {
    const res = await axios.post(
      `${this.core(username)}/accesses/check-app`, {
        requestingAppId: appId,
        requestedPermissions: permissions,
        deviceName: deviceName,
      }, {
        headers: { Authorization: personalToken },
      }
    );
    const data = res.data;
    return {
      permissions: data.checkedPermissions,
      match: data.matchingAccess,
      mismatch: data.mismatchingAccess,
    };
  }

  // POST/core: create a new app access, returns the according app token
  async createAppAccess (username: string, personalToken: string,
    permissions: PermissionsList, appId: string,
    clientData: ?{}, appToken: ?string, expireAfter: ?number): Promise<AppAccess> {
    const res = await axios.post(
      `${this.core(username)}/accesses`, {
        name: appId,
        type: 'app',
        permissions: permissions,
        token: appToken,
        expireAfter: expireAfter,
        clientData: clientData,
      }, {
        headers: { Authorization: personalToken },
      }
    );
    return res.data.access;
  }

  // PUT/core: update an existing app access, returns the according app token
  async updateAppAccess (accessId: string, username: string, personalToken: string,
    permissions: PermissionsList, appId: string,
    clientData: ?{}, appToken: ?string, expireAfter: ?number): Promise<AppAccess> {
    const res = await axios.put(
      `${this.core(username)}/accesses/${accessId}`, {
        name: appId,
        type: 'app',
        permissions: permissions,
        token: appToken,
        expireAfter: expireAfter,
        clientData: clientData,
      }, {
        headers: { Authorization: personalToken },
      }
    );
    return res.data.access;
  }

  // ---------- REGISTER calls ----------

  // GET/reg: retrieve all available Pryv hostings
  async getAvailableHostings (): Promise<Hostings> {
    const res = await axios.get(
      `${this.register}/hostings`
    );
    return new Hostings(res.data);
  }

  // POST/reg: create a new Pryv user
  async createUser (username: string, password: string, email: string,
    hosting: string, lang: string, appId: string,
    invitation: ?string, referer: ?string): Promise<NewUser> {
    const res = await axios.post(
      `${this.register}/user`, {
        appid: appId,
        username: username,
        password: password,
        email: email,
        hosting: hosting,
        languageCode: lang || 'en',
        invitationtoken: invitation || 'enjoy',
        referer: referer,
      }
    );
    return res.data;
  }

  async checkUsernameExistence (username: string): Promise<string> {
    const res = await axios.post(
      `${this.register}/${username}/server`
    );
    return res.server;
  }

  // GET/reg: convert email to Pryv username
  async getUsernameForEmail (usernameOrEmail: string): Promise<string> {
    if (usernameOrEmail.search('@') < 0) {
      return usernameOrEmail;
    }
    const res = await axios.get(
      `${this.register}/${usernameOrEmail}/uid`
    );
    return res.data.uid;
  }

  // ---------- RESET calls ----------

  // POST/core: request a password reset
  async requestPasswordReset (username: string, appId: string): Promise<number> {
    const res = await axios.post(
      `${this.core(username)}/account/request-password-reset`, {
        appId: appId,
        username: username,
      }
    );
    return res.status;
  }

  // POST/core: change Pryv password using a reset token
  async changePassword (username: string, newPassword: string,
    resetToken: string, appId: string): Promise<number> {
    const res = await axios.post(
      `${this.core(username)}/account/reset-password`, {
        username: username,
        newPassword: newPassword,
        appId: appId,
        resetToken: resetToken,
      }
    );
    return res.status;
  }

  // ---------- UTILS calls ----------

  // GET/reg: retrieve service information
  async getServiceInfo (): Promise<ServiceInfos> {
    const res = await axios.get(
      `${this.register}/service/infos`);
    return res.data;
  }
}

export default Pryv;
