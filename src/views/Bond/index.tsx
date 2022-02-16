import React, { useEffect, useMemo, useState } from 'react';

import {
  DecimalUtil,
} from '@pngfi/sdk';
import Decimal from 'decimal.js';
import { useBonding } from '@pngfi/sdk';
import { useSolana } from '@saberhq/use-solana';
// import { useBonding } from '../../contexts/BondingProvider';

const Bond: React.FC = () => {
  const { bondingInfo } = useBonding();
  const { providerMut } = useSolana();
  console.log(bondingInfo);

  const [hash, setHash] = useState('');
  const [tips, setToast] = useState('');
  const [amount, setAmount] = useState('');

  const setTips = () => {
    setToast('please connect wallet')
    setTimeout(() => setToast(''), 3000);
  };

  const onBond = async (bondingData: any) => {
    // match stake model
    if (!!!providerMut) return setTips();
    const { bondingModel, stakingModel, depositAsset } = bondingData;

    if (!amount) return;

    const amount_U64 = DecimalUtil.toU64(
      new Decimal(amount),
      depositAsset.decimal
    );

    const [bondTx, stakeAllTx, rebaseTx] = await Promise.all([
      bondingModel.bond(amount_U64),
      stakingModel.stakeAll(),
      stakingModel.rebase(),
    ]);

    const hash = await (await bondTx.combine(stakeAllTx).combine(rebaseTx).confirm()).signature;

    setHash(hash);
  }

  return (
    <div className="max-w-full md:max-w-lg">
      {
        bondingInfo && bondingInfo.length ?
          bondingInfo.map((item: any, idx: any) => {
            return (
              <div key={`bonding-${idx}`} style={{ width: "500px", textAlign: "center", wordBreak: "break-all" }}>
                <p style={{ display: "flex", justifyContent: "center" }}>
                  {
                    item.depositAsset.icon.map((icon: any, idx: any) => (
                      <span key={`depositAsset-${idx}`}>
                        <img src={icon} width={30} />
                      </span>
                    ))
                  }
                  {item.depositAsset.symbol}
                </p>

                <div style={{ marginTop: "10px" }} >
                  <p >Payout Asset：<img src={item.payoutAsset.icon} width={30} style={{ display: 'inline' }} /></p>
                  <p style={{ marginTop: "10px" }}>Bond Price：${DecimalUtil.beautify(new Decimal(item.bondingPrice))} </p>
                  <p style={{ marginTop: "10px" }}>Market Price：${DecimalUtil.beautify(new Decimal(item.marketPrice))} </p>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <p >TBV：
                    ${DecimalUtil.beautify(new Decimal(item.tbv))}
                  </p>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <p >ROI：
                    {
                      item.roi === null ? '-' :
                        DecimalUtil.beautify(DecimalUtil.fromNumber(item.roi), 2) + '%'
                    }
                  </p>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <p >Vesting Term： {item.vestTerm} days
                  </p>
                </div>

                <div>
                  <input type="text" style={{ padding: "5px", marginRight: "5px", color: "#000" }}
                    onChange={val => setAmount(val.target.value)} placeholder='input amount' />
                  <button
                    style={{ border: "1px solid", padding: "5px", borderRadius: "8px", marginTop: "10px" }}
                    type="button"
                    disabled={false}
                    onClick={() => onBond(item)}
                  >
                    Bond
                  </button>
                </div>
                <div style={{ marginTop: "10px" }}>
                  {
                    hash ?
                      <span>hash : {hash} </span>
                      : ''
                  }</div>
                <div>
                  <span>{tips}</span>
                </div>

              </div>
            )
          })
          : 'no bonding'
      }

    </div >
  );
};

export default Bond;
