export default function About() {
    return (
        <article className="container gap-8 columns-2 prose">
            <h1>About <i>MAC!</i></h1>
            <div className="break-inside-avoid">
                <p>For most cryptocurrencies transaction data is publicly available. There exist a set of privacy-oriented cryptocurrencies, one of them is <a href="https://grin.mw/" target="_blank" rel="noreferrer">GRIN</a> based on the Mimblewimble protocol that provides privacy and scalability simultaneously. Due to its private nature, checking payments is not trivial. For most cryptocurrencies it consists of simply checking the transaction hash using one of the public blockchain explorers, in case of GRIN it is more complicated because of lack of on-chain addresses and amounts. Long story short - neither the transaction amounts, neither the addresses are stored on chain. It is still possible to check if payment was done by exporting a <a href="https://docs.grin.mw/wiki/transactions/payment-proofs/" target="_blank" rel="noreferrer">payment proof</a> and letting a third partyverify it.</p>
            </div>
            <div className="break-inside-avoid">
                <p>This project is an <a href="https://docs.minaprotocol.com/zkapps/tutorials/oracle#emitting-events" target="_blank" rel="noreferrer">oracle</a> that verifies such payment proofs to serve as data source for <a href="https://minaprotocol.com/" target="_blank" rel="noreferrer">Mina blockchain</a>. It has been developed for the <a href="https://minaprotocol.com/blog/zkignite-cohort0" target="_blank" rel="noreferrer">zkIgnite Cohort0 program</a>. Mina is another fascinating protocol that is based on <a href="https://en.wikipedia.org/wiki/Non-interactive_zero-knowledge_proof" target="_blank" rel="noreferrer">zero-knowledge technology</a> which (extremely briefly) consists of proving the existence of data instead of revealing.</p>
            </div>
            <div className="break-inside-avoid">
                <p>An oracle is a bridge between external world and blockchain. A GRIN payment proof oracle could serve as bridge between Mina and GRIN blockchains. If community starts to run such oracles we could implement zero-knowledge smart contracts allowing to swap Mina coins and tokens against GRIN coins and vice-versa, providing GRIN with liquidity it deserves in a semi-decentralized way. Better than centralized exchanges, but less decentralized than real atomic swaps.</p>
                <p>This project takes advantage of <a href="https://github.com/mimblewimble/grin-wallet/blob/master/doc/samples/v3_api_node/src/index.js) by [XiaoJay](https://github.com/xiaojay" target="_blank" rel="noreferrer">wallet Owner API V3 client</a>.</p>
            </div>
        </article>);
}
