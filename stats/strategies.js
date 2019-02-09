let accumulative = require('../accumulative')
let blackjack = require('../blackjack')
let shuffle = require('fisher-yates')
let shuffleInplace = require('fisher-yates/inplace')
let coinSelect = require('../')
let utils = require('../utils')

function blackmax (utxos, outputs, feeRate) {
  // order by ascending satoshis
  utxos = utxos.concat().sort((a, b) => a.satoshis - b.satoshis)

  // attempt to use the blackjack strategy first (no change output)
  let base = blackjack(utxos, outputs, feeRate)
  if (base.inputs) return base

  // else, try the accumulative strategy
  return accumulative(utxos, outputs, feeRate)
}

function blackmin (utxos, outputs, feeRate) {
  // order by descending satoshis
  utxos = utxos.concat().sort((a, b) => b.satoshis - a.satoshis)

  // attempt to use the blackjack strategy first (no change output)
  let base = blackjack(utxos, outputs, feeRate)
  if (base.inputs) return base

  // else, try the accumulative strategy
  return accumulative(utxos, outputs, feeRate)
}

function blackrand (utxos, outputs, feeRate) {
  utxos = shuffle(utxos)

  // attempt to use the blackjack strategy first (no change output)
  let base = blackjack(utxos, outputs, feeRate)
  if (base.inputs) return base

  // else, try the accumulative strategy
  return accumulative(utxos, outputs, feeRate)
}

function maximal (utxos, outputs, feeRate) {
  utxos = utxos.concat().sort((a, b) => a.satoshis - b.satoshis)

  return accumulative(utxos, outputs, feeRate)
}

function minimal (utxos, outputs, feeRate) {
  utxos = utxos.concat().sort((a, b) => b.satoshis - a.satoshis)

  return accumulative(utxos, outputs, feeRate)
}

function FIFO (utxos, outputs, feeRate) {
  utxos = utxos.concat().reverse()

  return accumulative(utxos, outputs, feeRate)
}

function proximal (utxos, outputs, feeRate) {
  const outAccum = outputs.reduce((a, x) => a + x.satoshis, 0)

  utxos = utxos.concat().sort((a, b) => {
    let aa = a.satoshis - outAccum
    let bb = b.satoshis - outAccum

    return aa - bb
  })

  return accumulative(utxos, outputs, feeRate)
}

// similar to bitcoind
function random (utxos, outputs, feeRate) {
  utxos = shuffle(utxos)

  return accumulative(utxos, outputs, feeRate)
}

function bestof (utxos, outputs, feeRate) {
  let n = 100
  let utxosCopy = utxos.concat()
  let best = { fee: Infinity }

  while (n) {
    shuffleInplace(utxosCopy)

    let result = accumulative(utxos, outputs, feeRate)
    if (result.inputs && result.fee < best.fee) {
      best = result
    }

    --n
  }

  return best
}

function utxoScore (x, feeRate) {
  return x.satoshis - (feeRate * utils.inputBytes(x))
}

function privet (utxos, outputs, feeRate) {
  let txosMap = {}
  utxos.forEach((txo) => {
    if (!txosMap[txo.address]) {
      txosMap[txo.address] = []
    }

    txosMap[txo.address].push(txo)
  })

  // order & summate sets
  for (var address in txosMap) {
    txosMap[address] = txosMap[address].sort((a, b) => {
      return utxoScore(b, feeRate) - utxoScore(a, feeRate)
    })
    txosMap[address].satoshis = txosMap[address].reduce((a, x) => a + x.satoshis, 0)
  }

  utxos = [].concat.apply([], Object.keys(txosMap).map(x => txosMap[x]))

  // only use accumulative strategy
  return accumulative(utxos, outputs, feeRate)
}

module.exports = {
  accumulative,
  bestof,
  blackjack,
  blackmax,
  blackmin,
  blackrand,
  coinSelect,
  FIFO,
  maximal,
  minimal,
  privet,
  proximal,
  random
}
