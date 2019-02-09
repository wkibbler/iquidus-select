var utils = require('./utils')

// split utxos between each output, ignores outputs with .satoshis defined
module.exports = function split (utxos, outputs, feeRate) {
  if (!isFinite(utils.uintOrNaN(feeRate))) return {}

  var bytesAccum = utils.transactionBytes(utxos, outputs)
  var fee = feeRate * bytesAccum
  if (outputs.length === 0) return { fee: fee }

  var inAccum = utils.sumOrNaN(utxos)
  var outAccum = utils.sumForgiving(outputs)
  var remaining = inAccum - outAccum - fee
  if (!isFinite(remaining) || remaining < 0) return { fee: fee }

  var unspecified = outputs.reduce(function (a, x) {
    return a + !isFinite(x.satoshis)
  }, 0)

  if (remaining === 0 && unspecified === 0) return utils.finalize(utxos, outputs, feeRate)

  var splitOutputsCount = outputs.reduce(function (a, x) {
    return a + !x.satoshis
  }, 0)
  var splitValue = (remaining / splitOutputsCount) >>> 0

  // ensure every output is either user defined, or over the threshold
  if (!outputs.every(function (x) {
    return x.satoshis !== undefined || (splitValue > utils.dustThreshold(x, feeRate))
  })) return { fee: fee }

  // assign splitValue to outputs not user defined
  outputs = outputs.map(function (x) {
    if (x.satoshis !== undefined) return x

    // not user defined, but still copy over any non-satoshis fields
    var y = {}
    for (var k in x) y[k] = x[k]
    y.satoshis = splitValue
    return y
  })

  return utils.finalize(utxos, outputs, feeRate)
}
