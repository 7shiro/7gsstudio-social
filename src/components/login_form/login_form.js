import oauthApi from '../../services/new_api/oauth.js'
const LoginForm = {
  data: () => ({
    user: {},
    authError: false
  }),
  computed: {
    loginMethod () { return this.$store.state.instance.loginMethod },
    loggingIn () { return this.$store.state.users.loggingIn },
    registrationOpen () { return this.$store.state.instance.registrationOpen }
  },
  methods: {
    oAuthLogin () {
      oauthApi.login({
        oauth: this.$store.state.oauth,
        instance: this.$store.state.instance.server,
        commit: this.$store.commit
      })
    },
    submit () {
      const data = {
        oauth: this.$store.state.oauth,
        instance: this.$store.state.instance.server
      }
      oauthApi.getOrCreateApp(data).then((app) => {
        oauthApi.getTokenWithCredentials(
          {
            app,
            instance: data.instance,
            username: this.user.username,
            password: this.user.password})
          .then((result) => {
            this.$store.commit('setToken', result.access_token)
            this.$store.dispatch('loginUser', result.access_token)
            this.$router.push('/p/main/friends')
          })
      })
    }
  }
}

export default LoginForm
