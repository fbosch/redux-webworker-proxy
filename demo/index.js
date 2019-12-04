/* eslint-env browser */

import { applyMiddleware, compose, createStore } from 'redux'
import { connectReducerToWorker, connectWorkers, terminateAllWorkers, workerMiddleware } from '../src/redux-webworker-proxy'

import reducer from './reducer'

const initialState = { number: 0, thread: 'none' }

const enhancers = []
const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
if (typeof devToolsExtension === 'function') {
  enhancers.push(devToolsExtension())
}

const worker = () => new Worker('./reducer.worker.js')
const workerReducer = connectReducerToWorker(reducer)(worker, { terminateOnIdle: false })
const middleware = applyMiddleware(workerMiddleware)

const composedEnhancers = compose(middleware, ...enhancers)

const reducers = compose(connectWorkers)(workerReducer)
const store = createStore(reducers, initialState, composedEnhancers)
const sendNumber = number => ({ type: 'CALCULATE', payload: number, meta: { useWorker: checkbox.checked } })

const counter = document.querySelector('.counter')
store.subscribe(() => window.requestAnimationFrame(() => {
  const { number, thread } = store.getState()
  counter.innerText = number + ' \n' + '(' + thread + ')'
}))

const checkbox = document.querySelector('input[type="checkbox"]')
checkbox.addEventListener('change', event => event.target.checked && terminateAllWorkers())

store.dispatch(sendNumber(Math.random()))
window.setInterval(() => store.dispatch(sendNumber(Math.random() * 10)), 200)
