import { useContext } from 'react';
import * as bech32 from 'bech32-buffer';

import {
    Field,
    Signature,
    Poseidon
} from 'snarkyjs';

import AppContext from '../components/AppContext';

function Uint8ArrayConcatNumber(arrays) {
    let t = [];
    for (let j = 0; j < arrays.length; ++j) {
        for (let i = 0; i < arrays[j].length; ++i) {
            t.push(arrays[j][i]);
        }
    }
    return t;
}
export function grinAddressToUint8Array(grin_address) {
    console.log(bech32);
    const res = bech32.decode(grin_address);
    if (res.prefix != 'grin' && res.prefix != 'tgrin') {
        throw new Error('Only GRIN Bech32 encoded addresses are supported.');
    }
    const decoded_hex = Buffer.from(res.data).toString('hex');
    return new Uint8Array(Buffer.from(decoded_hex.padStart(2 * 32, '00'), 'hex'));
}
export function getGRINKernelCommitment(kernel_hex) {
    const decoded = new Uint8Array(Buffer.from(kernel_hex.padStart(2 * 33, '00'), 'hex'));
    const numbers = Uint8ArrayConcatNumber([decoded]);
    // split it into two fields, first takes first 16 bytes, second takes next 17
    const member_1 = Field.fromBytes(numbers.slice(0, 16));
    const member_2 = Field.fromBytes(numbers.slice(16, 33));
    // compute the commitment field using the Poseidon hash
    return Poseidon.hash([member_1, member_2]);
}
export function getGRINSignatureCommitment(signature_hex) {
    const decoded = new Uint8Array(Buffer.from(signature_hex.padStart(2 * 64, '00'), 'hex'));
    const numbers = Uint8ArrayConcatNumber([decoded]);
    // split it into three fields,
    const member_1 = Field.fromBytes(numbers.slice(0, 21));
    const member_2 = Field.fromBytes(numbers.slice(21, 42));
    const member_3 = Field.fromBytes(numbers.slice(42, 64));
    // compute the commitment field using the Poseidon hash
    return Poseidon.hash([member_1, member_2, member_3]);
}
export function getGRINAddressCommitment(grin_address) {
    const decoded = grinAddressToUint8Array(grin_address);
    const numbers = Uint8ArrayConcatNumber([decoded]);
    // split it into two fields
    const member_1 = Field.fromBytes(numbers.slice(0, 16));
    const member_2 = Field.fromBytes(numbers.slice(16, 32));
    // compute the commitment field using the Poseidon hash
    return Poseidon.hash([member_1, member_2]);
}
export function grinPaymentProofToCommitment(payment_proof) {
    const amount = new Field(parseInt(payment_proof['amount']));
    const excess = getGRINKernelCommitment(payment_proof['excess']);
    const recipient_address = getGRINAddressCommitment(payment_proof['recipient_address']);
    const recipient_sig = getGRINSignatureCommitment(payment_proof['recipient_sig']);
    const sender_address = getGRINAddressCommitment(payment_proof['sender_address']);
    const sender_sig = getGRINSignatureCommitment(payment_proof['sender_sig']);
    return [
        amount,
        excess,
        recipient_address,
        recipient_sig,
        sender_address,
        sender_sig,
    ];
}

const onSendTransaction = async (context, commitment, signature) => {
    context.setState({ ...context.state, creatingTransaction: true });
    console.log('sending a transaction...');
    await context.state.zkappWorkerClient!.fetchAccount({ publicKey: context.state.publicKey! });
    await context.state.zkappWorkerClient.createVerifyTransaction(
        commitment[0],
        commitment[1],
        commitment[2],
        commitment[3],
        commitment[4],
        commitment[5],
        signature);
    console.log('creating proof...');
    await context.state.zkappWorkerClient!.proveUpdateTransaction();
    console.log('getting Transaction JSON...');
    const transactionJSON = await context.state.zkappWorkerClient!.getTransactionJSON()
    console.log('requesting send transaction...');
    const { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
            fee: transactionFee,
            memo: '',
        },
    });
    console.log(
        'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
    );
    context.setState({ ...context.state, creatingTransaction: false, txHash: hash });
}

async function runVerify(context) {
    let element = document.getElementById('import-payment-proof');
    let payment_proof_text = (element.innerText || element.textContent);

    let element2 = document.getElementById('import-signature');
    let signature_text = (element2.innerText || element2.textContent);

    console.log(payment_proof_text);
    console.log();
    let payment_proof = JSON.parse(payment_proof_text);
    let commitment: Field[] = grinPaymentProofToCommitment(payment_proof);

    let signature_object = JSON.parse(signature_text);
    let signature: Signature = Signature.fromJSON(signature_object.signature);

    console.log('commitment');
    console.log(commitment);
    console.log('signature');
    console.log(signature);

    await onSendTransaction(context, commitment, signature);
}

export const RenderVerifyButton = () => {
    const context = useContext(AppContext);
    if ((context.state.compilationButtonState == 2) &&
        (context.state.connectionButtonState > 1)) {
        if (context.state.creatingTransaction) {
            return (<button className="btn btn-disabled animate-pulse">
                Verify</button>);
        }
        return (<button className="btn" onClick={async () => {
            await runVerify(context);
        }}>Verify</button>);
    }
    return (<button className="btn btn-disabled">Verify</button>);
}

const OracleResult = () => {
    const context = useContext(AppContext);
    if (context.state.txHash != '') {
        const url = "https://berkeley.minaexplorer.com/transaction/" + context.txHash;
        console.log(url);
        return (<p>Your last transaction is <a href={url} target="_blank" rel="noreferrer">{context.txHash}</a></p>);
    }
    return (<p></p>);
}

export default function _Try() {
    const context = useContext(AppContext);
    return (
        <div>
            <article className="container prose">
                <h1>Put your signed payment proof</h1>
                <div><p>The code section below is editable. Click on it and paste your GRIN payment proof.</p>
                    <div className="rounded-md not-prose bg-secondary text-primary-content">
                        <div className="p-4">
                            <code contentEditable="true" id="import-payment-proof">
                                {JSON.stringify({
                                    'amount': '10000000',
                                    'excess': '0903284a6e6b90c657fe08277c6cc7062744939192f0a956526cd241a7cc2259b1',
                                    'recipient_address': 'grin1kjxlcgad4m8rde5ktzussu2yn2l36tl7ega9qp475c3q8qjra3ysrn2s8r',
                                    'recipient_sig': 'e8ee267c99b3069573302ea88836a1e4769ff1cdd013e6238f4c685c67a7da2880af36cdec788ce19b01350a30dc9ce36f2aaf54a9be528b0d2e7b83e7a00609',
                                    'sender_address': 'grin1zvhxtzjvu7kdz5r6mxkax3qdf6m4f7x8jcyeufx9ppjfwtnpkcrs494l5f',
                                    'sender_sig': '9f63f36fb6aeed051a0ee899a1f5e945a06bbfe93c398516ba8f21c6879d938bbbe7af3135df3e3f1849120d42fcf90f3d9326ab85ee47649234497c5958d10c'
                                })}
                            </code>
                        </div>
                    </div>
                    <p>And below you may put the signature from the oracle</p>
                    <div className="rounded-md not-prose bg-secondary text-primary-content">
                        <div className="p-4">
                            <code contentEditable="true" id="import-signature">
                                {JSON.stringify({
                                    'valid': true,
                                    'signature': {
                                        'r': '14983957032727564949366483203960178276572722300139837302127152837184185916137',
                                        's': '12020990200524643933971201937391550466857128251083210042648705055264197870976'
                                    }
                                })}
                            </code>
                        </div>
                    </div>
                    <p>Then hit the import button below!</p><button className="btn" onClick={async () => {
                        await runVerify(context);
                    }}>Verify</button></div>
                <p>The transaction will only work if payment proof is valid, which means it is confirmed by the oracle.</p>
                <p><OracleResult/></p>
            </article>
        </div>
    )
}
