import { extractCommit } from 'src/services/version/version.service'

function joinURL(base, subpath) {
  return URL.parse(subpath, base)?.href || "invalid base URL"
}

const VersionTab = {
  data () {
    const instance = this.$store.state.instance
    return {
      backendCommitUrl: instance.backendCommitUrl,
      backendVersion: instance.backendVersion,
      frontendCommitUrl: instance.frontendCommitUrl,
      frontendVersion: instance.frontendVersion
    }
  },
  computed: {
    frontendVersionLink () {
      return joinURL(this.frontendCommitUrl, this.frontendVersion)
    },
    backendVersionLink () {
      return joinURL(this.backendCommitUrl, extractCommit(this.backendVersion))
    }
  }
}

export default VersionTab
