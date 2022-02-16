import { FC } from "react";

import Header from "./Header";
import SiteDescription from "./SiteDescription";
import Bond from "../Bond";
import { BondingProvider } from '@pngfi/sdk';
// import { BondingProvider } from '../../contexts/BondingProvider';
import styles from "./index.module.css";
import { useSolana } from '@saberhq/use-solana';

const Home: FC = () => {
  const { providerMut } = useSolana();

  return (
    <BondingProvider cluster="mainnet-bate" provider={providerMut as any} >
      <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
        <div className={styles.container}>
          <Header />
          <SiteDescription />
          <Bond />
        </div>
      </div>
    </BondingProvider>
  );
};

export default Home;