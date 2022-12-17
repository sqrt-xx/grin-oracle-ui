import {
  fetchAccount,
  PublicKey,
  PrivateKey,
    Field,
    Signature
} from 'snarkyjs'

import type { ZkappWorkerRequest, ZkappWorkerReponse, WorkerFunctions } from './zkappWorker';

export default class ZkappWorkerClient {

  // ---------------------------------------------------------------------------------------

  loadSnarkyJS() {
    return this._call('loadSnarkyJS', {});
  }

  setActiveInstanceToBerkeley() {
    return this._call('setActiveInstanceToBerkeley', {});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({ publicKey }: { publicKey: PublicKey }): ReturnType<typeof fetchAccount> {
      const result = this._call('fetchAccount', { publicKey58: publicKey.toBase58() });
    return (result as ReturnType<typeof fetchAccount>);
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', { publicKey58: publicKey.toBase58() });
  }

    async createVerifyTransaction(
      grin_amount: Field,
      grin_excess: Field,
      grin_recipient_address: Field,
      grin_recipient_sig: Field,
      grin_sender_address: Field,
      grin_sender_sig: Field,
      signature: Signature) {
      return await this._call('createVerifyTransaction', {
          grin_amount: grin_amount.toString(),
          grin_excess: grin_excess.toString(),
          grin_recipient_address: grin_recipient_address.toString(),
          grin_recipient_sig: grin_recipient_sig.toString(),
          grin_sender_address: grin_sender_address.toString(),
          grin_sender_sig: grin_sender_sig.toString(),
          signature: JSON.stringify(signature.toJSON())
        });
    }
  async proveTransaction() {
    return await this._call('proveTransaction', {});
  }

  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: { [id: number]: { resolve: (res: any) => void, reject: (err: any) => void } };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url))
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject }

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
