/* eslint-env worker */
import { proxy, expose } from 'comlinkjs'
const ProxyMap = new WeakMap()
const ProxyResultMap = new WeakMap()

export const exposeReducer = reducer => {
  if (!self) return reducer
  expose(reducer, self)
  return reducer
}

const getReducerProxyForWorker = worker => {
  let proxyReducer = null
  if (ProxyMap.has(worker)) {
    proxyReducer = ProxyMap.get(worker)
  } else {
    try {
      proxyReducer = proxy(worker)
      ProxyMap.set(worker, proxyReducer)
    } catch (e) {
      console.log(e)
      return proxyReducer
    }
  }
  return proxyReducer
}

export const workerProxyMiddleware = worker => store => next => action => {
  if (action.meta && action.meta.useWorker) {
    const reducerProxy = getReducerProxyForWorker(worker)
    if (reducerProxy) {
      return reducerProxy(store.getState(), action)
        .then(newState => {
          ProxyResultMap.set(action, newState)
          next(action)
        })
    }
  }
  return next(action)
}

export const proxyMetaReducer = reducer => (state, action) => {
  if (ProxyResultMap.has(action)) {
    const newState = ProxyResultMap.get(action)
    ProxyResultMap.delete(action)
    return { ...state, ...newState }
  }
  const nextState = reducer ? reducer(state, action) : state
  return nextState
}
