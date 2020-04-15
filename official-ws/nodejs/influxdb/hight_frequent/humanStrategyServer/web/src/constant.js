export const PirceUnitMap = {
  'XBTUSD': 0.5,
  'ETHUSD': 0.05,
}

export const getAmountKelly = (maxUsd, winRate, profitRate, leverage=1) => { // 凯里公式
  const amount = Math.round(maxUsd * leverage * (winRate - (1 - winRate) / profitRate))
  return Math.max(amount, 0)
}