import React, { useMemo, useState } from 'react';


import {
  BondingInfo,
  computeLPPrice,
  DecimalUtil,
  getTokenByMint,
  getTokenBySymbol,
  Bonding,
  Token
} from '@pngfi/sdk';
import Decimal from 'decimal.js';
import { u64 } from '@solana/spl-token';

type BondingInfoWithInitSupply = BondingInfo & {
  initSupply: u64;
}

type BondingItemProps = {
  model: Bonding;
  bondingInfo: BondingInfoWithInitSupply & {
    originMint: string;
  };
  allTokens: any,
  allPools: any,
  allTokenPrices: any,
  allStaking: any,
}

export const BondingItem: React.FC<BondingItemProps> = ({ model, bondingInfo, allTokens, allPools, allTokenPrices, allStaking }) => {

  const [amount, setAmount] = useState('');

  const depositToken: Token | any = useMemo(() => allTokens.length && bondingInfo ?
    getTokenByMint(bondingInfo.depositTokenMint.toString(), allTokens) : null
    , [allTokens, bondingInfo]);

  const payoutToken: Token | any = useMemo(() => allTokens.length && bondingInfo ?
    getTokenByMint(bondingInfo.originMint, allTokens) : null
    , [allTokens, bondingInfo]);

  const vestTerm: number = useMemo(() => bondingInfo ? bondingInfo.vestConfigInfo.claimAllDuration / (3600 * 24) : 0, [bondingInfo])

  const assetTokens: Token[] | any = useMemo(() => {
    if (!depositToken) {
      return null;
    }

    if (depositToken?.isLP) {
      const tmpArr = depositToken?.symbol.split('_') || [];
      const tokenA = getTokenBySymbol(tmpArr[0], allTokens);
      const tokenB = getTokenBySymbol(tmpArr[1], allTokens);
      return [tokenA, tokenB];
    } else {
      return [depositToken];
    }
  }, [depositToken, allTokens]);

  const payoutInfo = useMemo(() => {

    if (!model || !bondingInfo || !payoutToken || !depositToken) {
      return null;
    }

    return model.calcPayout(
      bondingInfo, payoutToken.decimals, depositToken.decimals
    );

  }, [model, bondingInfo, payoutToken, depositToken]);

  const payoutTokenPrice = useMemo(() => {
    if (!payoutToken) {
      return 0;
    }
    return allTokenPrices[payoutToken.symbol] || 0;
  }, [payoutToken, allTokenPrices]);

  const depositTokenPrice = useMemo(() => {
    if (!allTokenPrices || !depositToken) {
      return 0;
    }

    if (!depositToken?.isLP) {
      return allTokenPrices[depositToken.symbol] || 0;
    } else {
      const poolInfo = allPools[depositToken.symbol];
      return poolInfo ? computeLPPrice(poolInfo, allTokenPrices) : 0;
    }
  }, [allTokenPrices, allPools, depositToken]);

  const bondingPrice = useMemo(() => {
    if (!payoutInfo || !payoutToken) {
      return 0;
    }
    return new Decimal(depositTokenPrice)
      .div(
        DecimalUtil.fromU64(payoutInfo['payoutAmount'], payoutToken.decimals)
      ).toNumber();

  }, [payoutInfo, payoutToken, depositTokenPrice]);

  const roi = useMemo(() =>
    bondingPrice > 0 ? (payoutTokenPrice - bondingPrice) * 100 / bondingPrice : null,
    [payoutTokenPrice, bondingPrice]
  );

  const onBond = async () => {
    console.log(model);
    // match stake model
    // const stakingModel = allStaking.map((s: any) => s.staking)
    //   .find((item: any) => {
    //     return item.config.address.equals(bondingInfo.stakingPubkey)
    //   })

    if (!amount) return;
    const amount_U64 = DecimalUtil.toU64(
      new Decimal(amount),
      depositToken.decimals
    );

    console.log(amount_U64);
    console.log('1');
    const [bondTx] = await Promise.all([
      model.bond(amount_U64),
    ]);

    // const [bondTx, stakeAllTx, rebaseTx] = await Promise.all([
    //   model.bond(amount_U64),
    //   stakingModel.stakeAll(),
    //   stakingModel.rebase(),
    // ]);

    await bondTx.confirm();
    // await bondTx.combine(stakeAllTx).combine(rebaseTx).confirm();
  }
  return (
    <div>
      <div style={{ width: "100%" }}>
        <p style={{ display: "flex" }}>
          {
            assetTokens?.map((token: { logoURI: any }, idx: any) => (
              <span key={`asset-token-${idx}`}>
                <img src={token.logoURI} width={30} />
              </span>
            ))
          }
        </p>
        {assetTokens?.length ? assetTokens.map((token: { symbol: any; }) => token.symbol).join('/') : 'loading'}

        <div style={{ marginTop: "10px" }} >
          <p >Payout Asset：<img src={payoutToken?.logoURI} width={30} style={{ display: 'inline' }} /></p>
          <p style={{ marginTop: "10px" }}>Bond Price：${DecimalUtil.beautify(new Decimal(bondingPrice))} </p>
          <p style={{ marginTop: "10px" }}>Market Price：${DecimalUtil.beautify(new Decimal(payoutTokenPrice))} </p>
        </div>

        <div style={{ display: "flex", marginTop: "10px" }}>
          <p >TBV：</p>
          {
            bondingInfo && depositToken ?
              (payoutTokenPrice > 0 ? '$' : '') + DecimalUtil.beautify(
                payoutTokenPrice > 0 ?
                  DecimalUtil.fromU64(
                    bondingInfo.bondingSupply.sub(bondingInfo.initSupply),
                    payoutToken?.decimals
                  ).mul(payoutTokenPrice) :
                  DecimalUtil.fromU64(
                    bondingInfo.bondingSupply.sub(bondingInfo.initSupply),
                    payoutToken?.decimals
                  )
              ) : 'loading'
          }

        </div>
        <div style={{ display: "flex", marginTop: "10px" }}>
          <p >ROI：</p>
          <div>
            {
              roi === null ? '-' :
                DecimalUtil.beautify(DecimalUtil.fromNumber(roi), 2) + '%'
            }
          </div>
        </div>

        <div style={{ display: "flex", marginTop: "10px" }}>
          <p >Vesting Term：</p>
          <div>
            {vestTerm} days
          </div>
        </div>

        <div style={{ display: "flex", marginTop: "10px" }}>
          <p>Max payout：</p>
          {
            bondingInfo ?
              DecimalUtil.beautify(DecimalUtil.fromU64(bondingInfo.bondingSupply, 6)
                .mul(DecimalUtil.fromU64(bondingInfo.maxPayoutFactor))
                .div(DecimalUtil.fromNumber(100000))
              ) : ''
          }
        </div>

        <div>
          <input type="text" style={{ padding: "5px", marginRight: "5px", color: "#000" }}
            onChange={val => setAmount(val.target.value)} placeholder='input amount' />
          <button
            style={{ border: "1px solid", padding: "5px", borderRadius: "8px", marginTop: "10px" }}
            type="button"
            disabled={false}
            onClick={() => onBond()}
          >
            Bond
          </button>
        </div>
      </div>
    </div>

  )
}