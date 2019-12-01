/* eslint-env browser */

import { applyMiddleware, compose, createStore } from 'redux'
import { connectReducerWorker, connectWorkers, terminateAllWorkers, workerMiddleware } from '../src/redux-webworker-proxy'

import Stats from 'stats.js'
import anime from 'animejs/lib/anime.es.js'
import reducer from './reducer'

const initialState = { number: 0, thread: 'none' }

const enhancers = []
const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
if (typeof devToolsExtension === 'function') {
  enhancers.push(devToolsExtension())
}

const worker = () => new Worker('./reducer.worker.js')
const workerReducer = connectReducerWorker(reducer)(worker, { terminateOnIdle: false })
const middleware = applyMiddleware(workerMiddleware)

const composedEnhancers = compose(
  middleware,
  ...enhancers
)

const reducers = compose(connectWorkers)(workerReducer)
const store = createStore(reducers, initialState, composedEnhancers)

const checkbox = document.querySelector('input[type="checkbox"]')
const changeChecked = event => {
  const check = event.target.checked
  if (check === false) terminateAllWorkers()
}
checkbox.addEventListener('change', changeChecked)

const sendTest = number => ({ type: 'TEST', payload: number, meta: { useWorker: checkbox.checked } })

const counter = document.querySelector('.counter')
store.subscribe(() => window.requestAnimationFrame(() => {
  const { number, thread } = store.getState()
  counter.innerText = number + ' \n' + '(' + thread + ')'
}))

window.setInterval(() => {
  store.dispatch(sendTest(Math.random() * 10))
}, 28)

const wrapperEl = document.querySelector('.wrapper')
const numberOfEls = 200
const duration = 5000
const delay = duration / numberOfEls

let tl = anime.timeline({
  duration: delay,
  complete: function () { tl.restart() }
})

function createEl (i) {
  let el = document.createElement('div')
  const rotate = (360 / numberOfEls) * i
  const translateY = -65
  const hue = Math.round(360 / numberOfEls * i)
  el.classList.add('el')
  el.style.backgroundColor = 'hsl(' + hue + ', 80%, 40%)'
  el.style.transform = 'rotate(' + rotate + 'deg) translateY(' + translateY + '%)'
  tl.add({
    begin: function () {
      anime({
        targets: el,
        backgroundColor: ['hsl(' + hue + ', 80%, 60%)', 'hsl(' + hue + ', 80%, 80%)'],
        rotate: [rotate + 'deg', rotate + 10 + 'deg'],
        translateY: [translateY + '%', translateY + 10 + '%'],
        scale: [1, 1.25],
        easing: 'easeInOutSine',
        direction: 'alternate',
        duration: duration * 0.1
      })
    }
  })
  wrapperEl.appendChild(el)
};

for (let i = 0; i < numberOfEls; i++) createEl(i)

var stats = new Stats()

document.body.appendChild(stats.dom)
stats.showPanel(0)

function animate () {
  stats.begin()
  stats.end()
  requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
