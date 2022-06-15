import { mapState, mapGetters } from 'vuex'
import BasicUserCard from '../basic_user_card/basic_user_card.vue'
import UserAvatar from '../user_avatar/user_avatar.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faSearch,
  faChevronLeft
)

const ListNew = {
  components: {
    BasicUserCard,
    UserAvatar
  },
  data () {
    return {
      title: '',
      suggestions: [],
      userIds: [],
      selectedUserIds: [],
      loading: false,
      query: ''
    }
  },
  computed: {
    users () {
      return this.userIds.map(userId => this.findUser(userId))
    },
    availableUsers () {
      if (this.query.length !== 0) {
        return this.users
      } else {
        return this.suggestions
      }
    },
    ...mapState({
      currentUser: state => state.users.currentUser,
      backendInteractor: state => state.api.backendInteractor
    }),
    ...mapGetters(['findUser'])
  },
  methods: {
    goBack () {
      this.$emit('cancel')
    },
    onInput () {
      this.search(this.query)
    },
    selectUser (user, event) {
      if (this.selectedUserIds.includes(user.id)) {
        this.removeUser(user.id)
        event.target.classList.remove('selected')
      } else {
        this.addUser(user)
        event.target.classList.add('selected')
      }
    },
    addUser (user) {
      this.selectedUserIds.push(user.id)
    },
    removeUser (userId) {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId)
    },
    search (query) {
      if (!query) {
        this.loading = false
        return
      }

      this.loading = true
      this.userIds = []
      this.$store.dispatch('search', { q: query, resolve: true, type: 'accounts', following: true })
        .then(data => {
          this.loading = false
          this.userIds = data.accounts.map(a => a.id)
        })
    },
    createList () {
      // the API has two different endpoints for "creating a list with a name"
      // and "updating the accounts on the list".
      this.$store.state.api.backendInteractor.createList({ title: this.title })
        .then((data) => {
          this.$store.state.api.backendInteractor.addAccountsToList({
            id: data.id, accountIds: this.selectedUserIds
          })
          this.$router.push({ name: 'list-timeline', params: { id: data.id } })
        })
    }
  }
}

export default ListNew
