import { createStore, compose, applyMiddleware } from 'redux'
import { createProxy, proxyMetaReducer, reducerProxyMiddleware } from '../src/proxy'

const initialState = { number: 0 }

const enhancers = []
const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
if (typeof devToolsExtension === 'function') {
	enhancers.push(devToolsExtension())
}

const reducerWorker = new Worker('./reducer.js')
const proxy = createProxy(reducerWorker)
const middleware = applyMiddleware(reducerProxyMiddleware(proxy))

const composedEnhancers = compose(
  middleware,
  ...enhancers
)

const reducer = (state = initialState, action) => {
	console.log('handled by main thread')
	switch(action.type) {
		case 'TEST': return { ...state, number: action.payload * Math.sqrt(2), worker: false }
	}
	return state
}

const reducers = proxyMetaReducer(reducer)
const store = createStore(reducers, initialState, composedEnhancers)

const sendTest = number => ({ type: 'TEST', payload: number, meta: { handleInWorker: true } })

store.subscribe(() => {
	const { number, worker } = store.getState()
	document.body.innerText = number + '  (' + (worker ? 'worker' : 'main thread') + ')'
})

store.dispatch(sendTest(1321321321212))




