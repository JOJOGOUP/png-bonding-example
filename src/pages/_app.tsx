import React from "react";
import type { AppProps } from "next/app";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";
import logoCircle from './logo-circle.png';
import { WalletKitProvider } from '@gokiprotocol/walletkit';

function MyApp({ Component, pageProps }: AppProps) {

  const onWalletConnect = () => {
  }

  const onWalletDisconnect = () => {
  }

  return (
    <WalletKitProvider
      onConnect={onWalletConnect}
      onDisconnect={onWalletDisconnect}
      commitment={'processed'}
      defaultNetwork={'mainnet-beta'}
      networkConfigs={{
        ['mainnet-beta']: {
          name: ' mainnet-beta',
          endpoint: 'https://solana-api.projectserum.com'
        }
      }}
      app={{
        name: 'Penguin'
      }}
    >
      <Component {...pageProps} />
    </WalletKitProvider>

  );
}

export default MyApp;
