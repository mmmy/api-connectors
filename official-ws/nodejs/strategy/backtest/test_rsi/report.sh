echo 'start run backtest'
node backtest_rsi_divergence.js
echo '-----------------start create html& report---------------------'
node createReport.js
echo '-----------------start create pdf report-----------------------'
node ../reportToPdf.js --dir test_rsi/S1背离反转策略回测
