var utils = require('./utils')

// break utxos into the maximum number of 'output' possible
module.exports = function broken (utxos, output, feeRate) {
  if (!isFinite(utils.uintOrNaN(feeRate))) return {}

  var bytesAccum = utils.transactionBytes(utxos, [])
  var satoshis = utils.uintOrNaN(output.satoshis)
  var inAccum = utils.sumOrNaN(utxos)
  if (!isFinite(satoshis) ||
      !isFinite(inAccum)) return { fee: feeRate * bytesAccum }

  var outputBytes = utils.outputBytes(output)
  var outAccum = 0
  var outputs = []

  while (true) {
    var fee = feeRate * (bytesAccum + outputBytes)

    // did we bust?
    if (inAccum < (outAccum + fee + satoshis)) {
      // premature?
      if (outAccum === 0) return { fee: fee }

      break
    }

    bytesAccum += outputBytes
    outAccum += satoshis
    outputs.push(output)
  }

  return utils.finalize(utxos, outputs, feeRate)
}
