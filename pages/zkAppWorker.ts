import {
  Mina,
  isReady,
  PublicKey,
  PrivateKey,
  Field,
  fetchAccount,
    Signature,
    fetchLastBlock,
    VerificationKey,
    AccountUpdate
} from 'snarkyjs'

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { GRINOracle } from '../../contracts/src/GRINOracle';

const state = {
  GRINOracle: null as null | typeof GRINOracle,
  zkapp: null as null | Mac,
  transaction: null as null | Transaction,
    vKey: null as null | VerificationKeyData
}

// ---------------------------------------------------------------------------------------

const functions = {
  loadSnarkyJS: async (args: {}) => {
    await isReady;
  },
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.BerkeleyQANet(
      "https://proxy.berkeley.minaexplorer.com/graphql"
    );
    Mina.setActiveInstance(Berkeley);
  },
    loadContract: async (args: {}) => {
    const { GRINOracle } = await import(
          '../../contracts/build/src/GRINOracle.js');
    state.GRINOracle = GRINOracle;
  },
  fetchBlockchainLength: async (args: {}) => {
    let block = await fetchLastBlock(
            "https://proxy.berkeley.minaexplorer.com/graphql");
    return block.blockchainLength.toJSON();
  },
  compileContract: async (args: {}) => {
      let { verificationKey } = await state.GRINOracle!.compile();
      state.vKey = verificationKey;
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.GRINOracle!(publicKey);
  },
    createVerifyTransaction: async (args: {
        grin_amount: string,
        grin_excess: string,
        grin_recipient_address: string,
        grin_recipient_sig: string,
        grin_sender_address: string,
        grin_sender_sig: string,
        signature: string
    }) => {
        const _grin_amount: Field = new Field(args.grin_amount);
        const _grin_excess: Field = new Field(args.grin_excess);
        const _grin_recipient_address: Field = new Field(args.grin_recipient_address);
        const _grin_recipient_sig: Field = new Field(args.grin_recipient_sig);
        const _grin_sender_address: Field = new Field(args.grin_sender_address);
        const _grin_sender_sig: Field = new Field(args.grin_sender_sig);
        const _signature: Signature = JSON.parse(Signature.fromJSON(args.signature));
        const transaction = await Mina.transaction(() => {
            state.zkapp!.verify(
                _grin_amount,
                _grin_excess,
                _grin_recipient_address,
                _grin_recipient_sig,
                _grin_sender_address,
                _grin_sender_sig,
                _signature);
        });
        state.transaction = transaction;
    },
  proveTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number,
  fn: WorkerFunctions,
  args: any
}

export type ZkappWorkerReponse = {
  id: number,
  data: any
}
if (process.browser) {
  addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
    const returnData = await functions[event.data.fn](event.data.args);

    const message: ZkappWorkerReponse = {
      id: event.data.id,
      data: returnData,
    }
    postMessage(message)
  });
}
