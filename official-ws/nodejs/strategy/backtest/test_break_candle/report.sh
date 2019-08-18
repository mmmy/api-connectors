echo '----------------------create html report------------------------'
node createReport.js
echo '----------------------craete pdf report-------------------------'
node ../reportToPdf.js --dir test_break_candle/S2放量突破策略回测
