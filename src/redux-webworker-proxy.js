/* eslint-env worker */
import { proxy, expose } from 'comlinkjs'
const IS_WORKER = typeof importScripts === 'function'
const proxyInstances = new WeakMap()
const workerResponseMap = new WeakMap()

const getReducerProxyForWorker = worker => {
  let proxyReducer = null
  if (proxyInstances.has(worker)) {
    proxyReducer = proxyInstances.get(worker)
  } else {
    try {
      proxyReducer = proxy(worker)
      proxyInstances.set(worker, proxyReducer)
    } catch (e) {
      return null
    }
  }
  if (workerResponseMap.has(worker) === false) {
    const resultsMap = new WeakMap()
    workerResponseMap.set(worker, resultsMap)
  }
  return proxyReducer
}

export const exposeReducer = reducer => {
  if (IS_WORKER === false) return reducer
  expose(reducer, self)
  return reducer
}

export const workerMiddleware = worker => store => next => action => {
  if (action.meta && action.meta.useWorker) {
    const reducerProxy = getReducerProxyForWorker(worker)
    if (reducerProxy) {
      return reducerProxy(store.getState(), action)
        .then(newState => {
          const actionResults = workerResponseMap.get(worker)
          actionResults.set(action, newState)
          next(action)
        })
    }
  }
  return next(action)
}

export const connectWorker = worker => reducer => (state, action) => {
  if (workerResponseMap.has(worker)) {
    const actionResults = workerResponseMap.get(worker)
    if (actionResults.has(action)) {
      const newState = actionResults.get(action)
      actionResults.delete(action)
      return { ...state, ...newState }
    }
  }
  return reducer ? reducer(state, action) : state
}
