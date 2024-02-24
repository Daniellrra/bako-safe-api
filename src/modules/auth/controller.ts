import { add, addMinutes } from 'date-fns';

import { Encoder } from '@src/models';
import UserToken from '@src/models/UserToken';
import { Workspace } from '@src/models/Workspace';
import GeneralError, { ErrorTypes } from '@src/utils/error/GeneralError';

import { IAuthRequest } from '@middlewares/auth/types';

import { NotFound, error } from '@utils/error';
import { Responses, successful, bindMethods, Web3Utils } from '@utils/index';

import { IUserService } from '../user/types';
import { WorkspaceService } from '../workspace/services';
import { IAuthService, IChangeWorkspaceRequest, ISignInRequest } from './types';

export class AuthController {
  private authService: IAuthService;
  private userService: IUserService;

  constructor(authService: IAuthService, userService: IUserService) {
    this.authService = authService;
    this.userService = userService;
    bindMethods(this);
  }

  async signIn(req: ISignInRequest) {
    try {
      const { signature, workspace_id, ...payloadWithoutSignature } = req.body;
      const expiresIn = process.env.TOKEN_EXPIRATION_TIME ?? '15';

      new Web3Utils({
        signature,
        message: JSON.stringify(payloadWithoutSignature),
        signerAddress: req.body.address,
      }).verifySignature();

      const existingToken = await this.authService.findToken({
        userId: req.body.user_id,
      });

      if (existingToken) {
        await this.authService.signOut(existingToken.user);
      }

      const workspace = await new WorkspaceService()
        .filter(
          workspace_id
            ? { id: workspace_id }
            : {
                owner: req.body.user_id,
                single: true,
              },
        )
        .list()
        .then((response: Workspace[]) => response[0]);

      const userToken = await this.authService.signIn({
        token: req.body.signature,
        encoder: Encoder[req.body.encoder],
        provider: req.body.provider,
        expired_at: addMinutes(req.body.createdAt, Number(expiresIn)),
        payload: JSON.stringify(payloadWithoutSignature),
        user: await this.userService.findOne(req.body.user_id),
        workspace,
      });

      return successful(userToken, Responses.Ok);
    } catch (e) {
      if (e instanceof GeneralError) throw e;

      return error(e.error, e.statusCode);
    }
  }

  async signOut(req: IAuthRequest) {
    try {
      const response = await this.authService.signOut(req.user);

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error[0], e.statusCode);
    }
  }

  async updateWorkspace(req: IChangeWorkspaceRequest) {
    try {
      const { workspace: workspaceId, user } = req.body;
      const workspace = await new WorkspaceService()
        .filter({ id: workspaceId })
        .list()
        .then((response: Workspace[]) => response[0]);

      if (!workspace)
        throw new NotFound({
          type: ErrorTypes.NotFound,
          title: 'Workspace not found',
          detail: `Workspace not found`,
        });

      const isUserMember = workspace.members.find(m => m.id === user);

      const token = await this.authService.findToken({
        userId: user,
      });

      if (isUserMember) {
        token.workspace = workspace;
      }

      return successful(
        await token.save().then(({ workspace, token, user }: UserToken) => {
          return {
            workspace: {
              id: workspace.id,
              name: workspace.name,
              avatar: workspace.avatar,
              permissions: workspace.permissions[user.id],
              single: workspace.single,
            },
            token: token,
            avatar: user.avatar,
            address: user.address,
          };
        }),
        Responses.Ok,
      );
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }
}
