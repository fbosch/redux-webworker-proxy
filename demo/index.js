/* eslint-env browser */
import { createStore, compose, applyMiddleware } from 'redux'
import { connectWorker, workerMiddleware } from '../src/redux-webworker-proxy'
import reducer from './reducer'

const initialState = { number: 0 }

const enhancers = []
const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
if (typeof devToolsExtension === 'function') {
  enhancers.push(devToolsExtension())
}

const worker = new Worker('./reducer.worker.js')
const middleware = applyMiddleware(workerMiddleware(worker))

const composedEnhancers = compose(
  middleware,
  ...enhancers
)

const reducers = compose(connectWorker(worker))(reducer)
const store = createStore(reducers, initialState, composedEnhancers)

const sendTest = number => ({ type: 'TEST', payload: number, meta: { useWorker: true } })

store.subscribe(() => {
  const { number, thread } = store.getState()
  document.body.innerText = number + '  (' + thread + ')'
})

store.dispatch(sendTest(1321321321212))
store.dispatch(sendTest(1231))
