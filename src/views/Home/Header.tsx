import React from 'react'
import { useConnectedWallet, useSolana } from '@saberhq/use-solana';
import { useWalletKit } from '@gokiprotocol/walletkit';

const Header = () => {
    const { disconnect } = useSolana();
    const wallet = useConnectedWallet();
    const { connect } = useWalletKit();
    return (
        <div className="navbar w-full mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
            <div className="flex-none">
                <button className="btn btn-square btn-ghost">
                    <span className="text-4xl">🦤</span>
                </button>
            </div>
            <div className="flex-1 px-2 mx-2">
                <span className="text-lg font-bold">Caw Caw</span>
            </div>
            <div className="flex-none">
                {
                    wallet ? 
                    <button className="btn btn-ghost" onClick={disconnect}>Disconnect</button>
                    :
                    <button className="btn btn-ghost" onClick={connect}>Connect Wallet</button>
                }
                
            </div>
        </div>
    )
}

export default Header
