import { ITransactionResume, TransactionStatus, Transfer, Vault } from 'bsafe';
import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';
import { Provider, TransactionRequest } from 'fuels';

import { Asset, Transaction, Witness } from '@models/index';

import { AuthValidatedRequest } from '@middlewares/auth/types';

import { IOrdination } from '@utils/ordination';
import { IPagination, PaginationParams } from '@utils/pagination';

export enum OrderBy {
  name = 'name',
  status = 'name',
  creation = 'createdAt',
  update = 'updatedAt',
}

export enum Sort {
  asc = 'ASC',
  desc = 'DESC',
}

export interface ICreateTransactionPayload {
  name: string;
  hash: string;
  predicateAddress: string;
  status: TransactionStatus;
  txData: TransactionRequest;
  assets: Partial<Asset>[];
  witnesses: Partial<Witness>[];
  resume?: ITransactionResume;
  sendTime?: Date;
  gasUsed?: string;
  predicateID?: string;
}

export interface IUpdateTransactionPayload {
  name?: string;
  status?: TransactionStatus;
  resume?: ITransactionResume;
  sendTime?: Date;
  gasUsed?: string;
  hash?: string;
}

export type ICloseTransactionPayload = {
  gasUsed: string;
  status: TransactionStatus;
  sendTime: Date;
  resume: ITransactionResume;
};

export interface ITransactionFilterParams {
  predicateId?: string[];
  predicateAddress?: string;
  to?: string;
  hash?: string;
  status?: TransactionStatus[];
  name?: string;
  limit?: number;
  allOfUser?: boolean;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

export type ICloseTransactionBody = {
  gasUsed: string;
  transactionResult: ITransactionResume;
  hasError: boolean;
};

export interface ISignByIdPayload {
  signer: string;
  account: string;
  confirm: boolean;
}

interface ICreateTransactionRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: ICreateTransactionPayload;
}

interface IUpdateTransactionRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: Omit<IUpdateTransactionPayload, 'hash'>;
  [ContainerTypes.Params]: { id: string };
}

interface IDeleteTransactionRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Params]: { id: string };
}

interface ICloseTransactionRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: ICloseTransactionBody;
  [ContainerTypes.Params]: { id: string };
}
interface ISendTransactionRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Params]: { id: string };
}

interface ISignByIdRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: ISignByIdPayload;
  [ContainerTypes.Params]: { id: string };
}

interface IFindTransactionByIdRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Params]: { id: string };
}

interface IFindTransactionByHashRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Params]: { hash: string };
}

interface IFindTransactionByPredicateIdRequestSchema
  extends ValidatedRequestSchema {
  [ContainerTypes.Params]: { predicateId: string };
}

interface IFindTransactionByToRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Params]: { to: string };
}
interface IListRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Query]: {
    status: TransactionStatus[];
    name: string;
    allOfUser: boolean;
    predicateId: string[] | string;
    to: string;
    startDate: string;
    endDate: string;
    createdBy: string;
    orderBy: OrderBy;
    sort: Sort;
    page: string;
    perPage: string;
    limit: number;
  };
}
export interface ITCreateService
  extends Partial<Omit<Transaction, 'assets' | 'witnesses'>> {
  assets: Partial<Asset>[];
  witnesses: Partial<Witness>[];
}

export type ICreateTransactionRequest = AuthValidatedRequest<ICreateTransactionRequestSchema>;
export type IUpdateTransactionRequest = AuthValidatedRequest<IUpdateTransactionRequestSchema>;
export type IDeleteTransactionRequest = AuthValidatedRequest<IDeleteTransactionRequestSchema>;
export type ICloseTransactionRequest = AuthValidatedRequest<ICloseTransactionRequestSchema>;
export type ISendTransactionRequest = AuthValidatedRequest<ISendTransactionRequestSchema>;
export type ISignByIdRequest = AuthValidatedRequest<ISignByIdRequestSchema>;
export type IFindTransactionByIdRequest = AuthValidatedRequest<IFindTransactionByIdRequestSchema>;
export type IFindTransactionByHashRequest = AuthValidatedRequest<IFindTransactionByHashRequestSchema>;
export type IFindTransactionByPredicateIdRequest = AuthValidatedRequest<IFindTransactionByPredicateIdRequestSchema>;
export type IFindTransactionByToRequest = AuthValidatedRequest<IFindTransactionByToRequestSchema>;
export type IListRequest = AuthValidatedRequest<IListRequestSchema>;

export interface ITransactionService {
  ordination(ordination?: IOrdination<Transaction>): this;
  paginate(pagination?: PaginationParams): this;
  filter(filter: ITransactionFilterParams): this;

  instanceTransactionScript: (
    api_transaction: TransactionRequest,
    vault: Vault,
    witnesses: string[],
  ) => Promise<Transfer>;
  validateStatus: (transactionId: string) => Promise<TransactionStatus>;
  checkInvalidConditions: (api_transaction: Transaction) => void;
  verifyOnChain: (
    api_transaction: Transaction,
    provider: Provider,
  ) => Promise<ITransactionResume>;
  sendToChain: (
    bsafe_transaction: TransactionRequest,
    provider: Provider,
  ) => Promise<string>;
  create: (payload: ITCreateService) => Promise<Transaction>;
  update: (id: string, payload: IUpdateTransactionPayload) => Promise<Transaction>;
  list: () => Promise<IPagination<Transaction> | Transaction[]>;
  findById: (id: string) => Promise<Transaction>;
  delete: (id: string) => Promise<boolean>;
}
