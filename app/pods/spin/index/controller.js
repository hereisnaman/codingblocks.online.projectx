import Controller from '@ember/controller';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { dropTask } from 'ember-concurrency-decorators';
import { timeout } from "ember-concurrency";

export default class SpinIndexController extends Controller {
  @service api
  @service router
  @service currentUser

  showTnC = false
  prizeDrawn = null

  linksMap = {
    'whatsapp': text => `https://web.whatsapp.com/send?text=${text}`,
    'twitter': text => `http://twitter.com/share?text=${text}&url=https://online.codingblocks.com&hashtags=codingBlocksIN`,
    'facebook': text => `https://www.facebook.com/sharer/sharer.php?u=online.codingblocks.com&quote=${text}`
  }

  @computed('referralCode')
  get shareText() {
    return `Sign-up using my link to get instant 500 in your wallet and Spin the CB Wheel to win assured prizes this Christmas and New Year using my referral link: https://cb.lk/join/${this.referralCode.code}  @codingblocksIn

    #CodingBlocks #CBSanta #Christmas #NewYear`
  }

  @computed('referralCode', 'wonPrize.title')
  get shareTextWin() {
    return `I just won ${this.wonPrize.title} on Coding Blocks Spin-n-Win. Signup using this link to get 500 in your Coding Blocks wallet and get a chance to spin and win exciting prizes this Christmas with Coding Blocks: https://cb.lk/join/${this.referralCode}`
  }

  @dropTask spin = function *() {
    if (!this.currentUser.user.verifiedemail) {
      this.set('notVerifiedEmailModal', true)
      return;
    }

    if (this.stats.availableSpins <= 0) {
      this.spinsLeftBox.classList.remove('wobble')
      yield timeout(10)
      this.spinsLeftBox.classList.add('wobble')
      return;
    }
    
    const prize = yield this.api.request('/spins/draw', {
      method: 'POST'
    })
    // TODO: Animate Image
    yield new Promise((resolve, reject) => {
      const preloadImage = new Image()
      preloadImage.src = prize.webp
      preloadImage.onload = resolve
      preloadImage.onerror = reject
    })
    const prizeImage = document.getElementById('prize-image')
    prizeImage.src = prize.webp

    yield timeout(3000)
    this.set('wonPrize', prize)

    const content = document.getElementById('content-play')
    content.style.display = 'none'

    const share = document.getElementById('content-share')
    share.style.display = 'block'

    yield this.reloadRoute()
  }

  @dropTask tryAgain = function *() {
    yield this.api.request('/jwt/upsert')
    yield this.currentUser.load(true)

    if (!this.currentUser.user.verifiedemail) {
      throw new Error('Email is not verified')
    }

    this.set('notVerifiedEmailModal', false)
    return ;
  }

  @action
  share(to, lose = true) {
    window.open(this.linksMap[to](lose ? this.shareText : this.shareTextWin), `${to}-share`, 'width=860,height=840,toolbar=0,menubar=0')
  }

  @action goToShare() {
    const shareBox = document.getElementById("share-box")
    shareBox.scrollIntoView({behavior: "smooth", block: "center" })
  }
}
