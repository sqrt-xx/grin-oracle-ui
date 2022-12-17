import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    return (
        <article className="container prose">
            <div className="hero min-h-screen bg-base-200">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold">Hello there!</h1>
                        <p className="py-6">I am <i>MAC!</i>, or <i>Mina Arbitrated Contracts</i> if you want to be formal. I am an <a href="https://docs.minaprotocol.com/zkapps/tutorials/oracle#emitting-events" target="_blank" rel="noreferrer">oracle</a> that can verify <a href="https://docs.grin.mw/wiki/transactions/payment-proofs/" target="_blank" rel="noreferrer">payment proof</a> for <a href="https://grin.mw/" target="_blank" rel="noreferrer">GRIN</a> cryptocurrency.</p>
                        <Link href="/try"><button className="btn">Try me!</button></Link>
                    </div>
                </div>
            </div>
        </article>
    )
}


