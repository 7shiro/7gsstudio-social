import { mount, shallowMount } from '@vue/test-utils'
import RichContent from 'src/components/rich_content/rich_content.jsx'

const attentions = []
const global = {
  mocks: {
    '$store': null
  },
  stubs: {
    FAIcon: true
  }
}

const makeMention = (who) => {
  attentions.push({ statusnet_profile_url: `https://fake.tld/@${who}` })
  return `<span class="h-card"><a class="u-url mention" href="https://fake.tld/@${who}">@<span>${who}</span></a></span>`
}
const p = (...data) => `<p>${data.join('')}</p>`
const compwrap = (...data) => `<span class="RichContent">${data.join('')}</span>`
const mentionsLine = (times) => [
  '<mentions-line-stub mentions="',
  new Array(times).fill('[object Object]').join(','),
  '"></mentions-line-stub>'
].join('')

describe('RichContent', () => {
  it('renders simple post without exploding', () => {
    const html = p('Hello world!')
    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(html))
  })

  it('it adds a # to the MFM color style value', () => {
    const html_ok = '<span class="mfm-fg" data-mfm-color="fff">this text is not white</span>'
    const expected_ok = '<span class="mfm-fg" data-mfm-color="fff" style="--mfm-color: #fff;">this text is not white</span>'
    const wrapper_ok = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html: html_ok
      }
    })

    expect(wrapper_ok.html()).to.eql(compwrap(expected_ok))
  })

  it('does not allow injection through MFM data- attributes', () => {
    const html_ok = '<span class="mfm-spin" data-mfm-speed="-0.2s">brrr</span>'
    const expected_ok = '<span class="mfm-spin" data-mfm-speed="-0.2s" style="--mfm-speed: -0.2s;">brrr</span>'
    const wrapper_ok = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html: html_ok
      }
    })
    const html_nok1 = '<span class="mfm-spin" data-mfm-speed="<">brrr</span>'
    const wrapper_nok1 = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html: html_nok1
      }
    })
    const html_nok2 = '<span class="mfm-spin" data-mfm-speed="\\">brrr</span>'
    const wrapper_nok2 = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html: html_nok2
      }
    })

    expect(wrapper_ok.html()).to.eql(compwrap(expected_ok))
    expect(wrapper_nok1.html()).to.eql(compwrap(html_nok1))
    expect(wrapper_nok2.html()).to.eql(compwrap(html_nok2))
  })

  it('unescapes everything as needed', () => {
    const html = [
      p('Testing &#39;em all'),
      'Testing &#39;em all',
      '<a href="http://example.com?a=1">http://example.com?a=1</a>'
    ].join('')
    const expected = [
      p('Testing \'em all'),
      'Testing \'em all',
      '<a href="http://example.com?a=1" target="_blank">http://example.com?a=1</a>'
    ].join('')
    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('replaces mention with mentionsline', () => {
    const html = p(
      makeMention('John'),
      ' how are you doing today?'
    )
    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(p(
      mentionsLine(1),
      ' how are you doing today?'
    )))
  })

  it('replaces mentions at the end of the hellpost', () => {
    const html = [
      p('How are you doing today, fine gentlemen?'),
      p(
        makeMention('John'),
        makeMention('Josh'),
        makeMention('Jeremy')
      )
    ].join('')
    const expected = [
      p(
        'How are you doing today, fine gentlemen?'
      ),
      // TODO fix this extra line somehow?
      p(
        '<mentions-line-stub mentions="',
        '[object Object],',
        '[object Object],',
        '[object Object]',
        '"></mentions-line-stub>'
      )
    ].join('')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('Does not touch links if link handling is disabled', () => {
    const html = [
      [
        makeMention('Jack'),
        'let\'s meet up with ',
        makeMention('Janet')
      ].join(''),
      [
        makeMention('John'),
        makeMention('Josh'),
        makeMention('Jeremy')
      ].join('')
    ].join('\n')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: false,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html()).to.eql(compwrap(html))
  })

  it('Adds greentext and cyantext to the post', () => {
    const html = [
      '&gt;preordering videogames',
      '&gt;any year'
    ].join('\n')
    const expected = [
      '<span class="greentext">&gt;preordering videogames</span>',
      '<span class="greentext">&gt;any year</span>'
    ].join('\n')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: false,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html()).to.eql(compwrap(expected))
  })

  it('Does not add greentext and cyantext if setting is set to false', () => {
    const html = [
      '&gt;preordering videogames',
      '&gt;any year'
    ].join('\n')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: false,
        greentext: false,
        emoji: [],
        html
      }
    })

    expect(wrapper.html()).to.eql(compwrap(html))
  })

  it('Adds emoji to post', () => {
    const html = p('Ebin :DDDD :spurdo:')
    const expected = p(
      'Ebin :DDDD ',
      '<anonymous-stub src="about:blank" alt=":spurdo:" class="emoji img" title=":spurdo:"></anonymous-stub>'
    )

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: false,
        greentext: false,
        emoji: [{ url: 'about:blank', shortcode: 'spurdo' }],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('Doesn\'t add nonexistent emoji to post', () => {
    const html = p('Lol :lol:')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: false,
        greentext: false,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(html))
  })

  it('Greentext + last mentions', () => {
    const html = [
      '&gt;quote',
      makeMention('lol'),
      '&gt;quote',
      '&gt;quote'
    ].join('\n')
    const expected = [
      '<span class="greentext">&gt;quote</span>',
      mentionsLine(1),
      '<span class="greentext">&gt;quote</span>',
      '<span class="greentext">&gt;quote</span>'
    ].join('\n')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html()).to.eql(compwrap(expected))
  })

  it('One buggy example', () => {
    const html = [
      'Bruh',
      'Bruh',
      [
        makeMention('foo'),
        makeMention('bar'),
        makeMention('baz')
      ].join(''),
      'Bruh'
    ].join('<br>')
    const expected = [
      'Bruh',
      'Bruh',
      mentionsLine(3),
      'Bruh'
    ].join('<br>')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('buggy example/hashtags', () => {
    const html = [
      '<p>',
      '<a href="http://macrochan.org/images/N/H/NHCMDUXJPPZ6M3Z2CQ6D2EBRSWGE7MZY.jpg">',
      'NHCMDUXJPPZ6M3Z2CQ6D2EBRSWGE7MZY.jpg</a>',
      ' <a class="hashtag" data-tag="nou" href="https://shitposter.club/tag/nou">',
      '#nou</a>',
      ' <a class="hashtag" data-tag="screencap" href="https://shitposter.club/tag/screencap">',
      '#screencap</a>',
      ' </p>'
    ].join('')
    const expected = [
      '<p>',
      '<a href="http://macrochan.org/images/N/H/NHCMDUXJPPZ6M3Z2CQ6D2EBRSWGE7MZY.jpg" target="_blank">',
      'NHCMDUXJPPZ6M3Z2CQ6D2EBRSWGE7MZY.jpg</a>',
      ' <hashtag-link-stub url="https://shitposter.club/tag/nou" content="#nou" tag="nou">',
      '</hashtag-link-stub>',
      ' <hashtag-link-stub url="https://shitposter.club/tag/screencap" content="#screencap" tag="screencap">',
      '</hashtag-link-stub>',
      ' </p>'
    ].join('')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('rich contents of a mention are handled properly', () => {
    attentions.push({ statusnet_profile_url: 'lol' })
    const html = [
      p(
        '<a href="lol" class="mention">',
        '<span>',
        'https://</span>',
        '<span>',
        'lol.tld/</span>',
        '<span>',
        '</span>',
        '</a>'
      ),
      p(
        'Testing'
      )
    ].join('')
    const expected = [
      p(
        '<span class="MentionsLine">',
        '<span class="MentionLink mention-link">',
        '<!-- eslint-disable vue/no-v-html -->',
        '<a href="lol" class="original" target="_blank">',
        '<span>',
        'https://</span>',
        '<span>',
        'lol.tld/</span>',
        '<span>',
        '</span>',
        '</a>',
        '<!-- eslint-enable vue/no-v-html -->',
        '<!--v-if-->', // v-if placeholder, mentionlink's "new" (i.e. rich) display
        '</span>',
        '<!--v-if-->', // v-if placeholder, mentionsline's extra mentions and stuff
        '</span>'
      ),
      p(
        'Testing'
      )
    ].join('')

    const wrapper = mount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('rich contents of nested mentions are handled properly', () => {
    attentions.push({ statusnet_profile_url: 'lol' })
    const html = [
      '<span class="poast-style">',
      '<a href="lol" class="mention">',
      '<span>',
      'https://</span>',
      '<span>',
      'lol.tld/</span>',
      '<span>',
      '</span>',
      '</a>',
      ' ',
      '<a href="lol" class="mention">',
      '<span>',
      'https://</span>',
      '<span>',
      'lol.tld/</span>',
      '<span>',
      '</span>',
      '</a>',
      ' ',
      '</span>',
      'Testing'
    ].join('')
    const expected = [
      '<span class="poast-style">',
      '<span class="MentionsLine">',
      '<span class="MentionLink mention-link">',
      '<!-- eslint-disable vue/no-v-html -->',
      '<a href="lol" class="original" target="_blank">',
      '<span>',
      'https://</span>',
      '<span>',
      'lol.tld/</span>',
      '<span>',
      '</span>',
      '</a>',
      '<!-- eslint-enable vue/no-v-html -->',
      '<!--v-if-->', // v-if placeholder, mentionlink's "new" (i.e. rich) display
      '</span>',
      '<span class="MentionLink mention-link">',
      '<!-- eslint-disable vue/no-v-html -->',
      '<a href="lol" class="original" target="_blank">',
      '<span>',
      'https://</span>',
      '<span>',
      'lol.tld/</span>',
      '<span>',
      '</span>',
      '</a>',
      '<!-- eslint-enable vue/no-v-html -->',
      '<!--v-if-->', // v-if placeholder, mentionlink's "new" (i.e. rich) display
      '</span>',
      '<!--v-if-->', // v-if placeholder, mentionsline's extra mentions and stuff
      '</span>',
      ' ',
      '</span>',
      'Testing'
    ].join('')

    const wrapper = mount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it('rich contents of a link are handled properly', () => {
    const html = [
      '<p>',
      'Freenode is dead.</p>',
      '<p>',
      '<a href="https://isfreenodedeadyet.com/">',
      '<span>',
      'https://</span>',
      '<span>',
      'isfreenodedeadyet.com/</span>',
      '<span>',
      '</span>',
      '</a>',
      '</p>'
    ].join('')
    const expected = [
      '<p>',
      'Freenode is dead.</p>',
      '<p>',
      '<a href="https://isfreenodedeadyet.com/" target="_blank">',
      '<span>',
      'https://</span>',
      '<span>',
      'isfreenodedeadyet.com/</span>',
      '<span>',
      '</span>',
      '</a>',
      '</p>'
    ].join('')

    const wrapper = shallowMount(RichContent, {
      global,
      props: {
        attentions,
        handleLinks: true,
        greentext: true,
        emoji: [],
        html
      }
    })

    expect(wrapper.html().replace(/\n/g, '')).to.eql(compwrap(expected))
  })

  it.skip('[INFORMATIVE] Performance testing, 10 000 simple posts', () => {
    const amount = 20

    const onePost = p(
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      makeMention('Lain'),
      ' i just landed in l a where are you'
    )

    const TestComponent = {
      template: `
      <div v-if="!vhtml">
        ${new Array(amount).fill(`<RichContent html="${onePost}" :greentext="true" :handleLinks="handeLinks" :emoji="[]" :attentions="attentions"/>`)}
      </div>
      <div v-else="vhtml">
        ${new Array(amount).fill(`<div v-html="${onePost}"/>`)}
      </div>
      `,
      props: ['handleLinks', 'attentions', 'vhtml']
    }
    console.log(1)

    const ptest = (handleLinks, vhtml) => {
      const t0 = performance.now()

      const wrapper = mount(TestComponent, {
        global,
        props: {
          attentions,
          handleLinks,
          vhtml
        }
      })

      const t1 = performance.now()

      wrapper.destroy()

      const t2 = performance.now()

      return `Mount: ${t1 - t0}ms, destroy: ${t2 - t1}ms, avg ${(t1 - t0) / amount}ms - ${(t2 - t1) / amount}ms per item`
    }

    console.log(`${amount} items with links handling:`)
    console.log(ptest(true))
    console.log(`${amount} items without links handling:`)
    console.log(ptest(false))
    console.log(`${amount} items plain v-html:`)
    console.log(ptest(false, true))
  })
})
