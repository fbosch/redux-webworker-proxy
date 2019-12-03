const anime = window.anime
const wrapperEl = document.querySelector('.wrapper')
const numberOfEls = 200
const duration = 4000
const delay = duration / numberOfEls

const tl = anime.timeline({
  duration: delay,
  complete: function () { window.requestAnimationFrame(tl.restart) }
})

function createEl (i) {
  const el = document.createElement('div')
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
}

for (let i = 0; i < numberOfEls; i++) createEl(i)
