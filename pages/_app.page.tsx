import '../styles/globals.css';
import type { AppProps } from 'next/app';

import AppContext from '../components/AppContext';
import Layout from '../components/Layout';

import { createContext, useEffect, useState, useContext } from 'react';
import type { Mac } from '../../contracts/src/Mac';
import {
    Mina,
    Field,
    isReady,
    PrivateKey,
    PublicKey,
    fetchAccount,
    fetchLastBlock
} from 'snarkyjs';

import ZkappWorkerClient from './zkappWorkerClient';

async function runLoadSnarkyJS(context) {
    console.log('runLoadSnarkyJS')
    // indicate it is compiling now
    await context.setCompilationButtonState(1);
    let zkappPublicKey: PublicKey = PublicKey.fromBase58('B62qmmB8K4inPGR1jdRShDzKkt4dHunHjkqshzzVArBALZK958ekB6c');
    setTimeout(async () => {
        const zkappWorkerClient = new ZkappWorkerClient();
        console.log(zkappPublicKey);
        await context.setState({
            ...context.state,
            zkappWorkerClient: zkappWorkerClient,
            zkappPublicKey: zkappPublicKey
        });
        console.log('loading SnarkyJS');
        await zkappWorkerClient.loadSnarkyJS();
        await zkappWorkerClient.setActiveInstanceToBerkeley();
        console.log('SnarkyJS loaded');
        console.log('loading contract')
        await zkappWorkerClient.loadContract();
        await zkappWorkerClient.initZkappInstance(zkappPublicKey);
        console.log('contract loaded');
        await context.setCompilationButtonState(2);
    }, 2000)
}

async function runCompile(context) {
    console.log('runCompile');
    await context.setCompilationButtonState(3);
    try {
        console.log('compiling');
        await context.state.zkappWorkerClient.compileContract();
        console.log('compiled');
        await context.setCompilationButtonState(4);
    } catch (e:any) {
        console.log(e);
        await context.setCompilationButtonState(2);
    }
}

async function connectWallet(context) {
    console.log('connectWallet');
    await context.setConnectionButtonState(1);
    setTimeout(async () => {
        await context.setConnectionButtonState(1);
        try {
            await context.state.zkappWorkerClient.setActiveInstanceToBerkeley();
            const mina = (window as any).mina;
            if (mina == null) {
                context.setState({
                    ...context.state, hasWallet: false
                });
                return;
            }
            const publicKeyBase58: string[] = await mina.requestAccounts();
            console.log('auro connected');
            console.log(publicKeyBase58);
            const pk: PublicKey = PublicKey.fromBase58(publicKeyBase58[0]);
            context.setState({...context.state, publicKey: pk});
            await context.setConnectionButtonState(2);
        } catch (e:any) {
            console.log(e);
            await context.setConnectionButtonState(0);
        }
    }, 2000)
}

function MyApp({ Component, pageProps }: AppProps) {

    let [state, setState] = useState({
        zkappWorkerClient: null as null | ZkappWorkerClient,
        hasWallet: null as null | boolean,
        hasBeenSetup: false,
        usingAuro: true,
        accountExists: false,
        currentNum: null as null | Field,
        zkappPublicKey: null as null | PublicKey,
        publicKey: null as null | PublicKey,
        txHash: '',
        creatingTransaction: false,
        runLoadSnarkyJS: runLoadSnarkyJS,
        runCompile: runCompile,
        connectWallet: connectWallet
    });


    let [compilationButtonState, setCompilationButtonState] = useState(0);
    let [connectionButtonState, setConnectionButtonState] = useState(0);

    // -------------------------------------------------------
    // Do Setup
    useEffect(() => {(async () => {
            const mina = (window as any).mina;
            window.mina.on('accountsChanged', async (accounts: string[]) => {
                console.log('accountsChanged');
                console.log(accounts);
                if (accounts.length > 0) {
                    context.setState({ ...context.state, publicKey: PublicKey.fromBase58(accounts[0]) });
                } else {
                    return alert('AURO wallet failed to provide MAC! with this account...');
                }
            });
    })();
    }, []);

    // -------------------------------------------------------

    return (
        <AppContext.Provider value={{
            state, setState,
            compilationButtonState, setCompilationButtonState,
            connectionButtonState, setConnectionButtonState}}>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AppContext.Provider>
    )
}

export default MyApp
