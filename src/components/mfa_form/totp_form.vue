<template>
  <div class="login panel panel-default">
    <!-- Default panel contents -->

    <div class="panel-heading">
      {{ $t('login.heading.totp') }}
    </div>

    <div class="panel-body">
      <form
        class="login-form"
        @submit.prevent="submit"
      >
        <div class="form-group">
          <label for="code">
            {{ $t('login.authentication_code') }}
          </label>
          <input
            id="code"
            v-model="code"
            autocomplete="one-time-code"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <div class="login-bottom">
            <div>
              <button
                class="button-unstyled -link"
                type="button"
                @click.prevent="requireRecovery"
              >
                {{ $t('login.enter_recovery_code') }}
              </button>
              <br>
              <button
                class="button-unstyled -link"
                type="button"
                @click.prevent="abortMFA"
              >
                {{ $t('general.cancel') }}
              </button>
            </div>
            <button
              type="submit"
              class="btn button-default"
            >
              {{ $t('general.verify') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <div
      v-if="error"
      class="form-group"
    >
      <div class="alert error">
        {{ error }}
        <button
          class="button-unstyled"
          @click="clearError"
        >
          <FAIcon
            size="lg"
            class="fa-scale-110 fa-old-padding"
            icon="times"
          />
        </button>
      </div>
    </div>
  </div>
</template>
<script src="./totp_form.js"></script>
