import { exposeReducer } from '../src/proxy'

const initialState = { number: 0 }

export default exposeReducer((state = initialState, action) => {
	console.log('handled from worker')
	switch(action.type) {
		case 'TEST': return { ...state, number: action.payload * Math.sqrt(2), worker: true }
	}
	return state
})