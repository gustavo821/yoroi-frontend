// @flow

import { getCardanoHaskellBaseConfig, isCardanoHaskell, isJormungandr } from '../api/ada/lib/storage/database/prepackaged/networks';
import { MultiToken } from '../api/common/lib/MultiToken';

const generateRewardGraphData: ({|
    delegationRequests: DelegationRequests,
    currentEpoch: number,
    publicDeriver: PublicDeriver<>,
    getLocalPoolInfo: ($ReadOnly<NetworkRow>, string) => void | PoolMeta,
    tokenInfo: TokenInfoMap,
|}) => ?{|
    totalRewards: Array<GraphItems>,
    perEpochRewards: Array<GraphItems>,
|} = request => {
    console.log({request})
    const defaultToken = request.publicDeriver.getParent().getDefaultToken();

    const history = request.delegationRequests.rewardHistory.result;
    if (history == null) {
      return null;
    }
    if (!request.delegationRequests.getCurrentDelegation.wasExecuted) {
      return null;
    }
    let historyIterator = 0;

    // the reward history endpoint doesn't contain entries when the reward was 0
    // so we need to insert these manually
    const totalRewards: Array<GraphItems> = [];
    const perEpochRewards: Array<GraphItems> = [];
    let amountSum = new MultiToken([], defaultToken);

    const startEpoch = (() => {
      if (isCardanoHaskell(request.publicDeriver.getParent().getNetworkInfo())) {
        const shelleyConfig = getCardanoHaskellBaseConfig(
          request.publicDeriver.getParent().getNetworkInfo()
        )[1];
        return shelleyConfig.StartAt;
      }
      return 0;
    })();
    const endEpoch = (() => {
      if (isCardanoHaskell(request.publicDeriver.getParent().getNetworkInfo())) {
        // TODO: -1 since cardano-db-sync doesn't expose this information for some reason
        return request.currentEpoch - 1;
      }
      if (isJormungandr(request.publicDeriver.getParent().getNetworkInfo())) {
        // note: reward history includes the current epoch
        // since it tells you the reward you got at slot 0 of the new epoch
        return request.currentEpoch + 1;
      }
      throw new Error(
        `${nameof(this._generateRewardGraphData)} can't compute endEpoch for rewards`
      );
    })();

    const getMiniPoolInfo = (poolHash: string) => {
    //   const meta = this.generated.stores.delegation.getLocalPoolInfo(
    //     request.publicDeriver.getParent().getNetworkInfo(),
    //     poolHash
    //   );
      const meta = request.getLocalPoolInfo(
        request.publicDeriver.getParent().getNetworkInfo(),
        poolHash
      );
      if (meta == null || meta.info == null || meta.info.ticker == null || meta.info.name == null) {
        return poolHash;
      }
      return `[${meta.info.ticker}] ${meta.info.name}`;
    }

    const getNormalized = (tokenEntry) => {
    //   const tokenRow = this.generated.stores.tokenInfoStore.tokenInfo
    //     .get(tokenEntry.networkId.toString())
    //     ?.get(tokenEntry.identifier);
         const tokenRow = request.tokenInfo
           .get(tokenEntry.networkId.toString())
           ?.get(tokenEntry.identifier);
      if (tokenRow == null) throw new Error(`${nameof(generateRewardGraphData)} no token info for ${JSON.stringify(tokenEntry)}`);
      return tokenEntry.amount.shiftedBy(-tokenRow.Metadata.numberOfDecimals);
    }
    for (let i = startEpoch; i < endEpoch; i++) {
      if (historyIterator < history.length && i === history[historyIterator][0]) {
        // exists a reward for this epoch
        const poolHash = history[historyIterator][2];
        const nextReward = history[historyIterator][1];
        amountSum = amountSum.joinAddMutable(nextReward);
        totalRewards.push({
          name: i,
          primary: getNormalized(amountSum.getDefaultEntry()).toNumber(),
          poolName: getMiniPoolInfo(poolHash),
        });
        perEpochRewards.push({
          name: i,
          primary: getNormalized(nextReward.getDefaultEntry()).toNumber(),
          poolName: getMiniPoolInfo(poolHash),
        });
        historyIterator++;
      } else {
        // no reward for this epoch
        totalRewards.push({
          name: i,
          primary: getNormalized(amountSum.getDefaultEntry()).toNumber(),
          poolName: '',
        });
        perEpochRewards.push({
          name: i,
          primary: 0,
          poolName: '',
        });
      }
    }

    return {
      totalRewards,
      perEpochRewards,
    };
};


export const generateGraphData: ({|
   delegationRequests: DelegationRequests,
   publicDeriver: PublicDeriver<>,
   currentEpoch: boolean,
   shouldHideBalance: boolean,
   getLocalPoolInfo: string, 
   tokenInfo: string,
|}) => GraphData = request => {
    // const timeStore = this.generated.stores.time;
    // const currTimeRequests = timeStore.getCurrentTimeRequests(request.publicDeriver);
    return {
        rewardsGraphData: {
        error: request.delegationRequests.rewardHistory.error,
        items: generateRewardGraphData({
            delegationRequests: request.delegationRequests,
            currentEpoch: request.currentEpoch,
            publicDeriver: request.publicDeriver,
            getLocalPoolInfo: request.getLocalPoolInfo,
            tokenInfo: request.tokenInfo,
        }),
        hideYAxis: request.shouldHideBalance,
      },
    };
};