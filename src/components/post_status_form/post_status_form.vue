<template>
  <div
    ref="form"
    class="post-status-form"
  >
    <form
      autocomplete="off"
      @submit.prevent
      @dragover.prevent="fileDrag"
    >
      <div class="form-group">
        <i18n-t
          v-if="!$store.state.users.currentUser.locked && newStatus.visibility == 'private' && !disableLockWarning"
          keypath="post_status.account_not_locked_warning"
          tag="p"
          class="visibility-notice"
          scope="global"
        >
          <button
            class="button-unstyled -link"
            @click="openProfileTab"
          >
            {{ $t('post_status.account_not_locked_warning_link') }}
          </button>
        </i18n-t>
        <p
          v-if="!hideScopeNotice && newStatus.visibility === 'public'"
          class="visibility-notice notice-dismissible"
        >
          <span>{{ $t('post_status.scope_notice.public') }}</span>
          <a
            class="fa-scale-110 fa-old-padding dismiss"
            @click.prevent="dismissScopeNotice()"
          >
            <FAIcon icon="times" />
          </a>
        </p>
        <p
          v-else-if="!hideScopeNotice && newStatus.visibility === 'unlisted'"
          class="visibility-notice notice-dismissible"
        >
          <span>{{ $t('post_status.scope_notice.unlisted') }}</span>
          <a
            class="fa-scale-110 fa-old-padding dismiss"
            @click.prevent="dismissScopeNotice()"
          >
            <FAIcon icon="times" />
          </a>
        </p>
        <p
          v-else-if="!hideScopeNotice && newStatus.visibility === 'private' && $store.state.users.currentUser.locked"
          class="visibility-notice notice-dismissible"
        >
          <span>{{ $t('post_status.scope_notice.private') }}</span>
          <a
            class="fa-scale-110 fa-old-padding dismiss"
            @click.prevent="dismissScopeNotice()"
          >
            <FAIcon icon="times" />
          </a>
        </p>
        <p
          v-else-if="newStatus.visibility === 'direct'"
          class="visibility-notice"
        >
          <span v-if="safeDMEnabled">{{ $t('post_status.direct_warning_to_first_only') }}</span>
          <span v-else>{{ $t('post_status.direct_warning_to_all') }}</span>
        </p>
        <div
          v-if="isEdit"
          class="visibility-notice edit-warning"
        >
          <p>{{ $t('post_status.edit_remote_warning') }}</p>
          <p>{{ $t('post_status.edit_unsupported_warning') }}</p>
        </div>
        <div
          v-if="!disablePreview"
          class="preview-heading faint"
        >
          <a
            class="preview-toggle faint"
            @click.stop.prevent="togglePreview"
          >
            {{ $t('post_status.preview') }}
            <FAIcon :icon="showPreview ? 'chevron-left' : 'chevron-right'" />
          </a>
          <div
            v-show="previewLoading"
            class="preview-spinner"
          >
            <FAIcon
              class="fa-old-padding"
              spin
              icon="circle-notch"
            />
          </div>
        </div>
        <div
          v-if="showPreview"
          class="preview-container"
        >
          <div
            v-if="!preview"
            class="preview-status"
          >
            {{ $t('general.loading') }}
          </div>
          <div
            v-else-if="preview.error"
            class="preview-status preview-error"
          >
            {{ preview.error }}
          </div>
          <StatusContent
            v-else
            :status="preview"
            class="preview-status"
          />
        </div>
        <EmojiInput
          v-if="subjectVisible"
          ref="subject-emoji-input"
          v-model="newStatus.spoilerText"
          enable-emoji-picker
          hide-emoji-button
          :suggest="emojiSuggestor"
          class="form-control"
        >
          <input
            ref="subject-input"
            v-model="newStatus.spoilerText"
            type="text"
            :placeholder="$t('post_status.content_warning')"
            :disabled="posting && !optimisticPosting"
            size="1"
            class="form-post-subject"
            @input="onSubjectInput"
            @focus="focusSubjectInput()"
          >
        </EmojiInput>
        <i18n-t
          v-if="newStatus.files.length !== 0 && newStatus.nsfw === false && newStatus.spoilerText !== ''"
          keypath="post_status.media_not_sensitive_warning"
          tag="p"
          class="visibility-notice"
          scope="global"
        >
          {{ $t('post_status.media_not_sensitive_warning') }}
        </i18n-t>
        <EmojiInput
          ref="emoji-input"
          v-model="newStatus.status"
          :suggest="emojiUserSuggestor"
          :placement="emojiPickerPlacement"
          class="form-control main-input"
          enable-emoji-picker
          hide-emoji-button
          :newline-on-ctrl-enter="submitOnEnter"
          enable-sticker-picker
          @input="onEmojiInputInput"
          @sticker-uploaded="addMediaFile"
          @sticker-upload-failed="uploadFailed"
          @shown="handleEmojiInputShow"
        >
          <textarea
            ref="textarea"
            v-model="newStatus.status"
            :placeholder="placeholder || $t('post_status.default')"
            rows="1"
            cols="1"
            :disabled="posting && !optimisticPosting"
            class="form-post-body"
            :class="{ 'scrollable-form': !!maxHeight, '-has-subject': subjectVisible }"
            @keydown.exact.enter="submitOnEnter && postStatus($event, newStatus)"
            @keydown.meta.enter="postStatus($event, newStatus)"
            @keydown.ctrl.enter="!submitOnEnter && postStatus($event, newStatus)"
            @input="resize"
            @compositionupdate="resize"
            @paste="paste"
            @focus="focusStatusInput()"
          />
          <p
            v-if="hasStatusLengthLimit"
            class="character-counter faint"
            :class="{ error: isOverLengthLimit }"
          >
            {{ charactersLeft }}
          </p>
        </EmojiInput>
        <div
          v-if="!disableScopeSelector"
          class="visibility-tray"
          :class="{ 'visibility-tray-edit': isEdit }"
        >
          <scope-selector
            v-if="!disableVisibilitySelector"
            :user-default="userDefaultScope"
            :original-scope="copyMessageScope"
            :initial-scope="newStatus.visibility"
            :on-scope-change="changeVis"
          />

          <div
            class="format-selector-container">
            <div
              class="format-selector"
              >
              <Select
                id="post-language"
                v-model="newStatus.language"
                class="form-control"
              >
                <option
                  v-for="language in postLanguageOptions"
                  :key="language.key"
                  :value="language.value"
                >
                  {{ language.label }}
                </option>
              </Select>
            </div>
            <div
              v-if="postFormats.length > 1"
              class="text-format format-selector"
            >
              <Select
                id="post-content-type"
                v-model="newStatus.contentType"
                class="form-control"
              >
                <option
                  v-for="postFormat in postFormats"
                  :key="postFormat"
                  :value="postFormat"
                >
                  {{ $t(`post_status.content_type["${postFormat}"]`) }}
                </option>
              </Select>
            </div>
            <div
              v-if="postFormats.length === 1 && postFormats[0] !== 'text/plain'"
              class="text-format format-selector"
            >
              <span class="only-format">
                {{ $t(`post_status.content_type["${postFormats[0]}"]`) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <poll-form
        v-if="pollsAvailable"
        ref="pollForm"
        :visible="pollFormVisible"
        @update-poll="setPoll"
      />
      <div
        ref="bottom"
        class="form-bottom"
      >
        <div class="form-bottom-left">
          <media-upload
            ref="mediaUpload"
            class="media-upload-icon"
            :drop-files="dropFiles"
            :disabled="uploadFileLimitReached"
            @uploading="startedUploadingFiles"
            @uploaded="addMediaFile"
            @upload-failed="uploadFailed"
            @all-uploaded="finishedUploadingFiles"
          />
          <button
            class="emoji-icon button-unstyled"
            :title="$t('emoji.add_emoji')"
            @click="showEmojiPicker"
          >
            <FAIcon icon="smile-beam" />
          </button>
          <button
            v-if="pollsAvailable"
            class="poll-icon button-unstyled"
            :class="{ selected: pollFormVisible }"
            :title="$t('polls.add_poll')"
            @click="togglePollForm"
          >
            <FAIcon icon="poll-h" />
          </button>
          <button
            v-if="!disableSubject"
            class="spoiler-icon button-unstyled"
            :class="{ selected: subjectVisible }"
            :title="$t('post_status.toggle_content_warning')"
            @click="toggleSubjectVisible"
          >
            <FAIcon icon="eye-slash" />
          </button>
        </div>
        <button
          v-if="posting"
          disabled
          class="btn button-default"
        >
          {{ $t('post_status.posting') }}
        </button>
        <button
          v-else-if="isOverLengthLimit"
          disabled
          class="btn button-default"
        >
          {{ $t('post_status.post') }}
        </button>
        <!-- To keep the OSK at the same position after a message send, -->
        <!-- @touchstart.stop.prevent was used. But while OSK position is -->
        <!-- quirky, accidental mobile posts caused by the workaround -->
        <!-- when people tried to scroll were a more serious bug. -->
        <button
          v-else
          :disabled="uploadingFiles || disableSubmit"
          class="btn button-default"
          @click.stop.prevent="postStatus($event, newStatus)"
        >
          {{ $t('post_status.post') }}
        </button>
      </div>
      <div
        v-show="showDropIcon !== 'hide'"
        :style="{ animation: showDropIcon === 'show' ? 'fade-in 0.25s' : 'fade-out 0.5s' }"
        class="drop-indicator"
        @dragleave="fileDragStop"
        @drop.stop="fileDrop"
      >
        <FAIcon :icon="uploadFileLimitReached ? 'ban' : 'upload'" />
      </div>
      <div
        v-if="error"
        class="alert error"
      >
        Error: {{ error }}
        <button
          class="button-unstyled"
          @click="clearError"
        >
          <FAIcon
            class="fa-scale-110 fa-old-padding"
            icon="times"
          />
        </button>
      </div>
      <gallery
        v-if="newStatus.files && newStatus.files.length > 0"
        class="attachments"
        :grid="true"
        :nsfw="false"
        :attachments="newStatus.files"
        :descriptions="newStatus.mediaDescriptions"
        :set-media="() => $store.dispatch('setMedia', newStatus.files)"
        :editable="true"
        :edit-attachment="editAttachment"
        :remove-attachment="removeMediaFile"
        :shift-up-attachment="newStatus.files.length > 1 && shiftUpMediaFile"
        :shift-dn-attachment="newStatus.files.length > 1 && shiftDnMediaFile"
        @play="$emit('mediaplay', attachment.id)"
        @pause="$emit('mediapause', attachment.id)"
      />
      <div
        v-if="newStatus.files.length > 0 && !disableSensitivityCheckbox"
        class="upload_settings"
      >
        <Checkbox v-model="newStatus.nsfw">
          {{ $t('post_status.attachments_sensitive') }}
        </Checkbox>
      </div>
    </form>
  </div>
</template>

<script src="./post_status_form.js"></script>

<style lang="scss">
@import '../../_variables.scss';

.post-status-form {
  position: relative;

  .attachments {
    margin-bottom: 0.5em;
  }

  .form-bottom {
    display: flex;
    justify-content: space-between;
    padding: 0.5em;
    height: 2.5em;

    button {
      width: 10em;
    }

    p {
      margin: 0.35em;
      padding: 0.35em;
      display: flex;
    }
  }

  .form-bottom-left {
    display: flex;
    flex: 1;
    padding-right: 7px;
    margin-right: 7px;
    max-width: 10em;
  }

  .preview-heading {
    display: flex;
    padding-left: 0.5em;
  }

  .preview-toggle {
    flex: 1;
    cursor: pointer;
    user-select: none;

    &:hover {
      text-decoration: underline;
    }
    svg, i {
      margin-left: 0.2em;
      font-size: 0.8em;
      transform: rotate(90deg);
    }
  }

  .preview-container {
    margin-bottom: 1em;
  }

  .preview-error {
    font-style: italic;
    color: $fallback--faint;
    color: var(--faint, $fallback--faint);
  }

  .preview-status {
    border: 1px solid $fallback--border;
    border: 1px solid var(--border, $fallback--border);
    border-radius: $fallback--tooltipRadius;
    border-radius: var(--tooltipRadius, $fallback--tooltipRadius);
    padding: 0.5em;
    margin: 0;
  }

  .text-format {
    .only-format {
      color: $fallback--faint;
      color: var(--faint, $fallback--faint);
    }
  }

  .visibility-tray {
    display: flex;
    justify-content: space-between;
    padding-top: 5px;
    align-items: baseline;
  }

  .visibility-tray-edit {
    justify-content: right;
  }

  .visibility-notice.edit-warning {
    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }

  .format-selector-container {
    .format-selector {
      display: inline-block;
    }
  }

  .media-upload-icon, .poll-icon, .emoji-icon, .spoiler-icon {
    font-size: 1.85em;
    line-height: 1.1;
    flex: 1;
    padding: 0 0.1em;
    display: flex;
    align-items: center;

    &.selected, &:hover {
      // needs to be specific to override icon default color
      svg, i, label {
        color: $fallback--lightText;
        color: var(--lightText, $fallback--lightText);
      }
    }

    &.disabled {
      svg, i {
        cursor: not-allowed;
        color: $fallback--icon;
        color: var(--btnDisabledText, $fallback--icon);

        &:hover {
          color: $fallback--icon;
          color: var(--btnDisabledText, $fallback--icon);
        }
      }
    }
  }

  // Order is not necessary but a good indicator
  .media-upload-icon {
    order: 1;
    justify-content: left;
  }

  .emoji-icon {
    order: 2;
    justify-content: center;
  }

  .poll-icon {
    order: 3;
    justify-content: center;
  }

  .spoiler-icon {
    order: 4;
    justify-content: right;
  }

  .error {
    text-align: center;
  }

  .media-upload-wrapper {
    margin-right: .2em;
    margin-bottom: .5em;
    width: 18em;

    img, video {
      object-fit: contain;
      max-height: 10em;
    }

    .video {
      max-height: 10em;
    }

    input {
      flex: 1;
      width: 100%;
    }
  }

  .status-input-wrapper {
    display: flex;
    position: relative;
    width: 100%;
    flex-direction: column;
  }

  .btn[disabled] {
    cursor: not-allowed;
  }

  form {
    display: flex;
    flex-direction: column;
    margin: 0.6em;
    position: relative;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    padding: 0.25em 0.5em 0.5em;
    line-height: 1.85;
  }

  .form-post-subject {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .form-post-body {
    // TODO: make a resizable textarea component?
    box-sizing: content-box; // needed for easier computation of dynamic size
    overflow: hidden;
    transition: min-height 200ms 100ms;
    // stock padding + 1 line of text (for counter)
    padding-bottom: calc(var(--_padding) + var(--post-line-height) * 1em);
    // two lines of text
    height: calc(var(--post-line-height) * 1em);
    min-height: calc(var(--post-line-height) * 1em);
    resize: none;

    &.-has-subject {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    &.scrollable-form {
      overflow-y: auto;
    }
  }

  .main-input {
    position: relative;
  }

  .character-counter {
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 0;
    margin: 0 0.5em;

    &.error {
      color: $fallback--cRed;
      color: var(--cRed, $fallback--cRed);
    }
  }

  .btn[disabled] {
    cursor: not-allowed;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 0.6; }
  }

  @keyframes fade-out {
    from { opacity: 0.6; }
    to   { opacity: 0; }
  }

  .drop-indicator {
    position: absolute;
    width: 100%;
    height: 100%;
    font-size: 5em;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    color: $fallback--text;
    color: var(--text, $fallback--text);
    background-color: $fallback--bg;
    background-color: var(--bg, $fallback--bg);
    border-radius: $fallback--tooltipRadius;
    border-radius: var(--tooltipRadius, $fallback--tooltipRadius);
    border: 2px dashed $fallback--text;
    border: 2px dashed var(--text, $fallback--text);
  }
}
</style>
