echo '----------------------create html report------------------------'
node createReport.js
echo '----------------------craete pdf report-------------------------'
node ../reportToPdf.js --dir test_compose/S4compose_rsidivergence_rsiclose
