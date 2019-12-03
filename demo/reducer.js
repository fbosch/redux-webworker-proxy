/* eslint-env worker */
function slowFunction (baseNumber) {
  let result = 0
  for (var i = Math.pow(baseNumber, 7); i >= 0; i--) {
    result += Math.atan(i) * Math.tan(i)
  }
  return result
}

export default (state, action) => {
  switch (action.type) {
    case 'CALCULATE': return { ...state, number: Math.floor(slowFunction(action.payload)), thread: self.document ? 'Main Thread' : 'Worker Thread' }
  }
  return state
}
