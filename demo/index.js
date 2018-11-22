/* eslint-env browser */
import { createStore, compose, applyMiddleware } from 'redux'
import { proxyMetaReducer, workerProxyMiddleware } from '../src/proxy'
import reducer from './reducer'

const initialState = { number: 0 }

const enhancers = []
const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
if (typeof devToolsExtension === 'function') {
  enhancers.push(devToolsExtension())
}

const reducerWorker = new Worker('./reducer.worker.js')
const middleware = applyMiddleware(workerProxyMiddleware(reducerWorker))

const composedEnhancers = compose(
  middleware,
  ...enhancers
)

const reducers = proxyMetaReducer(reducer)
const store = createStore(reducers, initialState, composedEnhancers)

const sendTest = number => ({ type: 'TEST', payload: number, meta: { useWorker: true } })

store.subscribe(() => {
  const { number, worker } = store.getState()
  document.body.innerText = number + '  (' + (worker ? 'worker' : 'main thread') + ')'
})

store.dispatch(sendTest(1321321321212))
store.dispatch(sendTest(1231))
