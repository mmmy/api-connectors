var exec = require('child_process').exec
const moment = require('moment-timezone')

const now = function () {
    return moment().tz('Asia/ShangHai').format('MM-DD hh:mm:ss')
}

function notifyPhone(msg, sound) {
    notifyPhoneUser(msg, "ayuuekzm61f2nm72qes1wkaofyhxp3", "uzxi5bsqjf8a58be5kvxzze4m1agwy", sound)
}

function notifyPhoneUser(msg, token, user, sound) {

    const isProd = process.env.NODE_ENV === 'production'
    // msg = `${now()}  ${msg}`
    if (!isProd) {
        msg = '[TEST] ' + msg
    }
    sound = sound || 'pushover'
    exec(`curl -s \
        --form-string "html=1" \
        --form-string "token=${token}" \
        --form-string "user=${user}" \
        --form-string "sound=${sound}" \
        --form-string "message=${msg}" \
        --form-string "title=this is a title" \
        https://api.pushover.net/1/messages.json`, (error, stdout, stderr) => {
            console.log(error, stdout, stderr)
        })
}

function notifyGlances(msg, token, user, sound) {

    const isProd = process.env.NODE_ENV === 'production'
    // msg = `${now()}  ${msg}`
    if (!isProd) {
        msg = '[TEST] ' + msg
    }
    sound = sound || 'pushover'
    exec(`curl -s \
        --form-string "token=${token}" \
        --form-string "user=${user}" \
        --form-string "title=${msg}" \
        https://api.pushover.net/1/glances.json`, (error, stdout, stderr) => {
            console.log(error, stdout, stderr)
        })
}

exports.notifyPhoneUser = notifyPhoneUser
exports.notifyPhone = notifyPhone
exports.notifyGlances = notifyGlances

exports.now = now
