// import { JwtUtils } from '@src/utils/jwt';
import UserToken from '@models/UserToken';
import { User } from '@models/index';

import { ErrorTypes } from '@utils/error/GeneralError';
import Internal from '@utils/error/Internal';

import {
  IAuthService,
  ICreateUserTokenPayload,
  IFindTokenParams,
  ISignInResponse,
} from './types';

export class AuthService implements IAuthService {
  async signIn(payload: ICreateUserTokenPayload): Promise<ISignInResponse> {
    return UserToken.create(payload)
      .save()
      .then(data => {
        return {
          accessToken: data.token,
          avatar: data.user.avatar,
          address: data.user.address,
          user_id: data.user.id,
          workspace: {
            id: data.workspace.id,
            name: data.workspace.name,
            avatar: data.workspace.avatar,
            single: data.workspace.single,
            permissions: data.workspace.permissions,
          },
          ...(data.user.type === 'WEB_AUTHN'
            ? { webAuthn: data.user.webauthn }
            : {}),
        };
      })
      .catch(e => {
        throw new Internal({
          type: ErrorTypes.Internal,
          title: 'Error on token creation',
          detail: e,
        });
      });
  }

  async signOut(user: User): Promise<void> {
    try {
      await UserToken.delete({
        user: user,
      });
    } catch (e) {
      throw new Internal({
        type: ErrorTypes.Internal,
        title: 'Error on sign out',
        detail: e,
      });
    }
  }

  async findToken(params: IFindTokenParams): Promise<UserToken | undefined> {
    const queryBuilder = await UserToken.createQueryBuilder('ut')
      .innerJoinAndSelect('ut.user', 'user')
      .innerJoinAndSelect('ut.workspace', 'workspace');

    params.userId &&
      queryBuilder.where('ut.user = :userId', { userId: params.userId });

    params.address &&
      queryBuilder.where('user.address = :address', {
        address: params.address,
      });

    params.signature &&
      queryBuilder.where('ut.token = :signature', { signature: params.signature });

    params.notExpired &&
      queryBuilder.andWhere('ut.expired_at > :now', { now: new Date() });

    return await queryBuilder
      .getOne()
      .then(userToken => userToken)
      .catch(e => {
        throw new Internal({
          type: ErrorTypes.Internal,
          title: 'Error on user token find',
          detail: e,
        });
      });
  }
}
