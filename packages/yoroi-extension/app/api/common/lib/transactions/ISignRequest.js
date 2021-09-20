// @flow

import {
  MultiToken,
} from '../MultiToken';

export interface ISignRequest<T> {
  inputs(): Array<{|
    address: string,
    value: MultiToken,
  |}>,
  totalInput(): MultiToken;
  outputs(): Array<{|
    address: string,
    value: MultiToken,
  |}>,
  totalOutput(): MultiToken;
  fee(): MultiToken;
  size?: () => {| full: number, outputs: number[] |};
  uniqueSenderAddresses(): Array<string>;
  receivers(includeChange: boolean): Array<string>;
  isEqual(tx: ?mixed): boolean;
  self(): T;
}
