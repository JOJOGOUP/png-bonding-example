import React, { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Provider } from '@project-serum/anchor';

import {
  Bonding,
  Staking,
  DecimalUtil,
} from '@pngfi/sdk';
import { BondingItem } from './BondingItem';
import axios from 'axios';
import { u64 } from '@solana/spl-token';

const Bond: React.FC = () => {

  const { wallet } = useWallet();
  const { connection } = useConnection();

  const provider = useMemo(
    () => new Provider(connection, wallet as any, {
      commitment: 'confirmed'
    }), [connection, wallet]);

  const [bondingList, setBondingList] = useState([]);
  const [stakingList, setStakingList] = useState([]);
  const [allTokens, setAllTokens] = useState([]);
  const [allPools, setPools] = useState([]);
  const [allTokenPrices, setAllTokenPrices] = useState([]);


  useEffect(() => {
    const API_HOST = 'https://api-staging.png.fi';

    // Promise.all([
    //   axios.get(`${API_HOST}/bonding`),
    //   axios.get(`${API_HOST}/tokens`),
    //   axios .get(`${API_HOST}/pools`)
    // ]).then();

    axios.get(`${API_HOST}/bonding`)
      .then(res => res.data)
      .then(data => {
        const tmpData = data.map((item: any) => toBondingInfo(item));
        setBondingList(tmpData);
      });

    axios.get(`${API_HOST}/staking`)
      .then(res => res.data)
      .then(data => {
        const tmpData = data.map((item: any) => toStakingInfo(item));
        setStakingList(tmpData);
      });

    axios
      .get(`${API_HOST}/tokens`)
      .then(res => res.data)
      .then(tokens => setAllTokens(tokens));

    axios
      .get(`${API_HOST}/pools`)
      .then(res => res.data)
      .then(data => {
        const poolsInfo = data.map((item: any) => toPoolInfo(item));
        const pools = poolsInfo.reduce((record: any, item: any) => {
          const pair = `${item?.tokenA.symbol}_${item?.tokenB.symbol}`;
          record[pair] = item;
          return record;
        }, {});
        setPools(pools);

        const pairs = Object.keys(pools);
        if (!pairs.length) {
          return;
        }
        const idsArr = [...new Set(
          pairs.map(pair => pair.split('_')).flat(Infinity)
        )];

        axios
          .get(`${API_HOST}/prices/${idsArr.join(',')}`)
          .then(res => res.data)
          .then(prices => setAllTokenPrices(prices));
      });
  }, [])

  const allBonding = useMemo(() =>
    bondingList
      .map((info: any) => {
        console.log(info)
        return {
          bonding: new Bonding(provider, { address: info.pubkey }, info),
          bondingInfo: Object.assign({}, info, {
            originMint: allTokens.find((item: any) => item.mint === info.payoutTokenMint.toBase58())?.['originMint']
          })
        }
      })
    , [provider, bondingList]);

  const allStaking = useMemo(() =>
    stakingList
      .map((info: any) => {
        return {
          staking: new Staking(
            provider as any,
            { address: info.pubkey, vestConfig: info.vestConfigInfo.pubkey },
            info
          ),
          stakingInfo: info,
        }
      })
    , [provider, stakingList]);


  const toBondingInfo = (item: any) => {
    if (!item) return;

    const {
      pubkey,
      stakingAddress,
      payoutHolder,
      bondingSupply,
      controlVariable,
      decayFactor,
      depositHolder,
      depositHolderAmount,
      depositTokenMint,
      initSupply,
      lastDecay,
      maxDebt,
      maxPayoutFactor,
      minPrice,
      payoutTokenMint,
      totalDebt,
      vestConfigInfo
    } = item;

    return {
      pubkey: new PublicKey(pubkey),
      stakingPubkey: new PublicKey(stakingAddress),
      payoutHolder: new PublicKey(payoutHolder),
      payoutTokenMint: new PublicKey(payoutTokenMint),
      depositHolder: new PublicKey(depositHolder),
      depositTokenMint: new PublicKey(depositTokenMint),
      depositHolderAmount: DecimalUtil.toU64(DecimalUtil.fromString(depositHolderAmount)),
      initSupply: DecimalUtil.toU64(DecimalUtil.fromString(initSupply)),
      bondingSupply: DecimalUtil.toU64(DecimalUtil.fromString(bondingSupply)),
      maxPayoutFactor: DecimalUtil.toU64(DecimalUtil.fromString(maxPayoutFactor)),
      maxDebt: DecimalUtil.toU64(DecimalUtil.fromString(maxDebt)),
      minPrice: DecimalUtil.toU64(DecimalUtil.fromString(minPrice)),
      totalDebt: DecimalUtil.toU64(DecimalUtil.fromString(totalDebt)),
      controlVariable,
      decayFactor,
      lastDecay,
      vestConfigInfo
    }
  }

  const toStakingInfo = (item: any) => {
    if (!item) return;

    const {
      pubkey,
      tokenMint,
      sTokenMint,
      tokenHolder,
      tokenHolderAmount,
      rebaseEpochDuration,
      rebaseLastTime,
      rebaseRateNumerator,
      rebaseRateDenominator,
      rebaseRewardsAmount,
      rewardsHolder,
      rebaseSupply,
      apy,
      rewardsPerDay,
      sTokenMintSupply,
      vestConfigInfo
    } = item;

    return {
      pubkey: new PublicKey(pubkey),
      tokenMint: new PublicKey(tokenMint),
      sTokenMint: new PublicKey(sTokenMint),
      tokenHolder: new PublicKey(tokenHolder),
      payoutTokenMint: new PublicKey(tokenHolder),
      tokenHolderAmount: DecimalUtil.toU64(DecimalUtil.fromString(tokenHolderAmount)),
      rebaseEpochDuration,
      rebaseLastTime,
      apy,
      rewardsPerDay,
      rebaseRateNumerator,
      rebaseRateDenominator,
      rewardsHolder: new PublicKey(rewardsHolder),
      rebaseSupply: DecimalUtil.toU64(DecimalUtil.fromString(rebaseSupply)),
      sTokenMintSupply: DecimalUtil.toU64(DecimalUtil.fromString(sTokenMintSupply)),
      rebaseRewardsAmount: DecimalUtil.toU64(DecimalUtil.fromString(rebaseRewardsAmount)),
      vestConfigInfo: {
        pubkey: new PublicKey(vestConfigInfo.pubkey),
        vestMint: new PublicKey(vestConfigInfo.vestMint),
        claimAllDuration: vestConfigInfo.claimAllDuration,
        halfLifeDuration: vestConfigInfo.halfLifeDuration,
        claimableHolder: new PublicKey(vestConfigInfo.claimableHolder),
        claimableMint: new PublicKey(vestConfigInfo.claimableMint),
      }
    }
  }

  const toPoolInfo = (item: any) => {

    const {
      pubkey,
      authority,
      curveType,
      feeAccount,
      feeStructure,
      lpSupply,
      nonce,
      poolTokenDecimals,
      poolTokenMint,
      tokenA,
      tokenB
    } = item;

    return {
      address: new PublicKey(pubkey),
      authority: new PublicKey(authority),
      curveType,
      feeAccount: new PublicKey(feeAccount),
      feeStructure,
      lpSupply: DecimalUtil.fromString(lpSupply),
      nonce,
      poolTokenDecimals,
      poolTokenMint: new PublicKey(poolTokenMint),
      tokenA: {
        ...tokenA,
        addr: new PublicKey(tokenA.addr),
        amount: new u64(tokenA.amount)
      },
      tokenB: {
        ...tokenB,
        addr: new PublicKey(tokenB.addr),
        amount: new u64(tokenB.amount)
      }

    }
  }

  return (
    <div className="max-w-full md:max-w-lg">

      <div>
        <div>
          {
            allBonding?.length ?
              allBonding?.map((item, idx) => (
                <BondingItem
                  key={`bonding-item-${idx}`}
                  model={item.bonding}
                  bondingInfo={item.bondingInfo as any}
                  allTokens={allTokens}
                  allPools={allPools}
                  allTokenPrices={allTokenPrices}
                  allStaking={allStaking}
                />
              )) :
              <div> no bonding </div>
          }
        </div>
      </div>

    </div >
  );
};

export default Bond;
