/* eslint-env worker */
const initialState = { number: 0 }

export default (state = initialState, action) => {
  switch (action.type) {
    case 'TEST': return { ...state, number: action.payload * Math.sqrt(2), thread: self.document ? 'main' : 'worker' }
  }
  return state
}
