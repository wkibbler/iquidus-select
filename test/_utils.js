function expand (satoshiss, indices) {
  if (indices) {
    return satoshiss.map(function (x, i) {
      if (typeof x === 'number') return { i: i, satoshis: x }

      var y = { i: i }
      for (var k in x) y[k] = x[k]
      return y
    })
  }

  return satoshiss.map(function (x, i) {
    return typeof x === 'object' ? x : { satoshis: x }
  })
}

function testValues (t, actual, expected) {
  t.equal(typeof actual, typeof expected, 'types match')
  if (!expected) return

  t.equal(actual.length, expected.length, 'lengths match')

  actual.forEach(function (ai, i) {
    var ei = expected[i]

    if (ai.i !== undefined) {
      t.equal(ai.i, ei, 'indexes match')
    } else if (typeof ei === 'number') {
      t.equal(ai.satoshis, ei, 'satoshiss match')
    } else {
      t.same(ai, ei, 'objects match')
    }
  })
}

module.exports = {
  expand: expand,
  testValues: testValues
}
